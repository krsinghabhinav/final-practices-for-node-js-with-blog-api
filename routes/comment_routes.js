const express = require("express");
const routes = express.Router();
const BlogUser = require("../model/user_model");
const CategoryBlog = require("../model/category_model");
const cloudinary = require("cloudinary").v2;
const checkAuth = require("../middlewares/check_auth");
const BlogData = require("../model/blog_model");
const slugify = require("slugify");
const CommentBlog = require("../model/comment_model");
const mongoose = require("mongoose");
// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dyit1jjef",
  api_key: process.env.CLOUD_KEY || "743564427533897",
  api_secret: process.env.CLOUD_SECRET || "TR9TvJlNF5Blp6AcyZ0plQ0kqkQ",
});

routes.post("/addComment/:blogId", checkAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { comment } = req.body;

    // 🔹 Validate fields
    if (!comment || !blogId) {
      return res.status(400).json({
        status: false,
        message: "Both 'comment' and 'blogId' are required!",
      });
    }

    // 🔹 Check User
    const user = await BlogUser.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message: "Account is deleted or inactive.",
      });
    }

    // 🔹 Check Blog
    const blog = await BlogData.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found!",
      });
    }

    // 🔹 Create New Comment
    const newComment = new CommentBlog({
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userImage: user.imageUrl || "",
      comment: comment.trim(),
      blogId: blogId,
    });

    await newComment.save();

    return res.status(201).json({
      status: true,
      message: "Comment added successfully!",
      data: newComment,
    });
  } catch (err) {
    console.error("❌ Add Comment Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

// GET ALL COMMENTS BY BLOG ID
routes.get("/getAllComment/:blogId", async (req, res) => {
  try {
    const blogId = req.params.blogId;

    // 🔹 Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid blogId!",
      });
    }

    // 🔹 Check Blog Exists
    const blog = await BlogData.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found!",
      });
    }

    // 🔹 Fetch All Comments
    const comments = await CommentBlog.find({ blogId }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "Comments fetched successfully!",
      totalComments: comments.length,
      comments,
    });
  } catch (err) {
    console.error("Get Comments Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.get("/getOnlyAuthBlog/:blogId", checkAuth, async (req, res) => {
  try {
    const { blogId } = req.params;

    // 🔹 Validate blogId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid blogId!",
      });
    }

    // 🔹 Check Auth User Exists
    const user = await BlogUser.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message: "Account is deleted or inactive.",
      });
    }

    // 🔹 Check Blog Exists
    const blog = await BlogData.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found!",
      });
    }

    // 🔹 Ensure Blog belongs to Auth User
    if (blog.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to view comments for this blog!",
      });
    }

    // 🔹 Fetch All Comments
    const comments = await CommentBlog.find({ blogId }).sort({ createdAt: -1 });

    if (!comments || comments.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No comments available for this blog.",
        totalComments: 0,
        comments: [],
      });
    }

    return res.status(200).json({
      status: true,
      message: "Comments fetched successfully!",
      totalComments: comments.length,
      comments,
    });
  } catch (err) {
    console.error("Get Comments Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.patch("/update_comment/:commentId", checkAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;

    // 🔹 Validate input
    if (!comment || !commentId) {
      return res.status(400).json({
        status: false,
        message: "comment and commentId are required!",
      });
    }

    // 🔹 Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid commentId!",
      });
    }

    // 🔹 Check Auth User Exists
    const user = await BlogUser.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message: "Account is deleted or inactive.",
      });
    }

    // 🔹 Find Comment
    const commentObj = await CommentBlog.findById(commentId);
    if (!commentObj) {
      return res.status(404).json({
        status: false,
        message: "Comment not found!",
      });
    }

    // 🔹 Check ownership
    if (commentObj.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        status: false,
        message: "Not authorized to update this comment!",
      });
    }

    // 🔹 Update comment
    commentObj.comment = comment;
    await commentObj.save();

    return res.status(200).json({
      status: true,
      message: "Comment updated successfully!",
      updatedComment: commentObj,
    });
  } catch (err) {
    console.error("Update Comment Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.delete("/delete_comment/:commentId", checkAuth, async (req, res) => {
  try {
    const { commentId } = req.params;

    // 🔹 Validate input
    if (!commentId) {
      return res.status(400).json({
        status: false,
        message: "commentId is required!",
      });
    }

    // 🔹 Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid commentId!",
      });
    }

    // 🔹 Check Auth User Exists
    const user = await BlogUser.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message: "Account is deleted or inactive.",
      });
    }

    // 🔹 Find Comment
    const commentObj = await CommentBlog.findById(commentId);
    if (!commentObj) {
      return res.status(404).json({
        status: false,
        message: "Comment not found!",
      });
    }

    // 🔹 Check ownership
    if (commentObj.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        status: false,
        message: "Not authorized to delete this comment!",
      });
    }

    // 🔹 Delete Comment
    await CommentBlog.findByIdAndDelete(commentId);

    return res.status(200).json({
      status: true,
      message: "Comment deleted successfully!",
    });
  } catch (err) {
    console.error("Delete Comment Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = routes;
