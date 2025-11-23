const express = require("express");
const routes = express.Router();
const BlogUser = require("../model/user_model");
const CategoryBlog = require("../model/category_model");
const cloudinary = require("cloudinary").v2;
const checkAuth = require("../middlewares/check_auth");
const BlogData = require("../model/blog_model");
const slugify = require("slugify");
const mongoose = require("mongoose");
const CommentBlog = require("../model/comment_model");
const LikeDislike = require("../model/likeanddislike_model");
// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dyit1jjef",
  api_key: process.env.CLOUD_KEY || "743564427533897",
  api_secret: process.env.CLOUD_SECRET || "TR9TvJlNF5Blp6AcyZ0plQ0kqkQ",
});

routes.post("/addLike/:blogId", checkAuth, async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid blogId",
      });
    }

    const blog = await BlogData.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found!",
      });
    }

    // Check if user already liked the blog
    let like = await LikeDislike.findOne({
      userId: req.user.userId,
      blogId: blogId,
    });

    // If not liked yet → like now
    if (!like) {
      like = new LikeDislike({
        userId: req.user.userId,
        blogId: blogId,
        isLiked: true,
      });
      await like.save();

      return res.status(200).json({
        status: true,
        liked: true,
        message: "Blog liked successfully!",
      });
    }

    // If already liked → remove like (unlike)
    if (like.isLiked) {
      like.isLiked = false;
      await like.save();

      return res.status(200).json({
        status: true,
        liked: false,
        message: "Like removed!",
      });
    }

    // If stored but isLiked = false → like again
    like.isLiked = true;
    await like.save();

    return res.status(200).json({
      status: true,
      liked: true,
      message: "Blog liked again!",
    });
  } catch (err) {
    console.error("Like Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.get("/likes/:blogId", async (req, res) => {
  try {
    const { blogId } = req.params;

    const totalLikes = await LikeDislike.countDocuments({
      blogId,
      isLiked: true,
    });

    return res.status(200).json({
      status: true,
      blogId,
      totalLikes,
    });
  } catch (err) {
    console.error("Get Likes Error:", err);
    return res.status(500).json({
      status: false,
      message: "Server Error",
      error: err.message,
    });
  }
});

module.exports = routes;
