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
const ReviewBlog = require("../model/reviewandrating_model");
// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dyit1jjef",
  api_key: process.env.CLOUD_KEY || "743564427533897",
  api_secret: process.env.CLOUD_SECRET || "TR9TvJlNF5Blp6AcyZ0plQ0kqkQ",
});

routes.post("/addReview/:blogId", checkAuth, async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const { rating, remark } = req.body;

    // ⭐ Validate Rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: false,
        message: "Rating must be between 1 and 5!",
      });
    }

    // ⭐ Validate Remark
    if (!remark) {
      return res.status(400).json({
        status: false,
        message: "Remark is required!",
      });
    }

    // ⭐ Find User
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

    // ⭐ Check Blog
    const blog = await BlogData.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found!",
      });
    }

    // ⭐ Prevent Duplicate Review
    const existingReview = await ReviewBlog.findOne({
      blogId,
      userId: req.user.userId,
    });

    if (existingReview) {
      return res.status(400).json({
        status: false,
        message: "You have already reviewed this blog!",
      });
    }

    // ⭐ Create Review
    const newReview = new ReviewBlog({
      blogId,
      userId: req.user.userId,
      userName: `${user.firstName} ${user.lastName}`,
      userImage: user.imageUrl || null,
      rating,
      remark,
    });

    await newReview.save();

    // ⭐ Feedback Message
    let feedbackMessage = "";
    if (rating <= 2) {
      feedbackMessage = "Thanks for your feedback! We’ll try to improve.";
    } else if (rating === 3) {
      feedbackMessage = "Thank you! Your review is Average.";
    } else if (rating === 4) {
      feedbackMessage = "Great! Your review is Good.";
    } else if (rating === 5) {
      feedbackMessage = "Excellent! Thanks for your amazing feedback!";
    }

    // ⭐ Return Response
    return res.status(201).json({
      status: true,
      message: feedbackMessage,
      review: newReview,
    });
  } catch (err) {
    console.error("Add Review Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.get("/getAllReview/:blogId", async (req, res) => {
  try {
    const blogId = req.params.blogId;

    // ⭐ Validate blogId format
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid blogId!",
      });
    }

    // ⭐ Check Blog Exists
    const blogExists = await BlogData.exists({ _id: blogId });
    if (!blogExists) {
      return res.status(404).json({
        status: false,
        message: "Blog not found!",
      });
    }

    // ⭐ Fetch reviews
    const reviews = await ReviewBlog.find({ blogId })
      .populate("userId", "firstName lastName email imageUrl")
      .sort({ createdAt: -1 });

    // ⭐ Calculate Average Rating
    let avgRating = 0;

    if (reviews.length > 0) {
      let sum = 0;
      for (let i = 0; i < reviews.length; i++) {
        sum += reviews[i].rating;
      }
      avgRating = (sum / reviews.length).toFixed(2); // ⭐ Rounded to 2 decimals
    }

    return res.status(200).json({
      status: true,
      message: "Reviews fetched successfully!",
      totalReview: reviews.length,
      avgRating: avgRating, // ⭐ Added average rating
      reviews,
    });
  } catch (err) {
    console.error("Get Review Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.get("/reviewwithauth/:blogId", checkAuth, async (req, res) => {
  try {
    const blogId = req.params.blogId;

    // ⭐ Validate blogId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid blogId!",
      });
    }

    // ⭐ Check Auth User
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
        message: "Your account is deleted or inactive.",
      });
    }

    // ⭐ Check Blog Exists
    const blog = await BlogData.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found!",
      });
    }

    // ⭐ Authorization – Only blog owner can view
    if (blog.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to view reviews of this blog!",
      });
    }

    // ⭐ Fetch reviews
    const reviews = await ReviewBlog.find({ blogId })
      .populate("userId", "firstName lastName email imageUrl")
      .sort({ createdAt: -1 });

    // ⭐ Calculate Average Rating
    let avgRating = 0;

    if (reviews.length > 0) {
      let sum = 0;
      for (let i = 0; i < reviews.length; i++) {
        sum += reviews[i].rating;
      }
      avgRating = (sum / reviews.length).toFixed(2); // ⭐ Rounded to 2 decimals
    }

    return res.status(200).json({
      status: true,
      message: "Reviews fetched successfully!",
      totalReview: reviews.length,
      avgRating: avgRating, // ⭐ Added average rating
      reviews,
    });
  } catch (err) {
    console.error("Get Review Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.patch("/update_review/:ratingId", checkAuth, async (req, res) => {
  try {
    const ratingId = req.params.ratingId;
    const { rating, remark } = req.body;

    // 🔹 Validate input
    if (!rating || !remark) {
      return res.status(400).json({
        status: false,
        message: "rating and remark are required!",
      });
    }

    // ⭐ Validate ratingId
    if (!mongoose.Types.ObjectId.isValid(ratingId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid ratingId!",
      });
    }

    // ⭐ Check Auth User
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
        message: "Your account is deleted or inactive.",
      });
    }

    // ⭐ Check Review Exists
    const review = await ReviewBlog.findById(ratingId);
    if (!review) {
      return res.status(404).json({
        status: false,
        message: "Review not found!",
      });
    }

    // ⭐ Only review creator can update the review
    if (review.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        status: false,
        message: "You are not allowed to update this review!",
      });
    }

    // ⭐ Update the review
    review.rating = rating;
    review.remark = remark;

    await review.save();

    return res.status(200).json({
      status: true,
      message: "Review updated successfully!",
      data: review,
    });
  } catch (err) {
    console.error("Update Review Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.delete("/delete_review/:ratingId", checkAuth, async (req, res) => {
  try {
    const ratingId = req.params.ratingId;

    // ⭐ Validate ratingId
    if (!mongoose.Types.ObjectId.isValid(ratingId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid ratingId!",
      });
    }

    // ⭐ Logged-in User
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
        message: "Your account is inactive or deleted.",
      });
    }

    // ⭐ Check review exists
    const review = await ReviewBlog.findById(ratingId);
    if (!review) {
      return res.status(404).json({
        status: false,
        message: "Review not found!",
      });
    }

    // ⭐ Only review creator can delete
    if (review.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        status: false,
        message: "You are not allowed to delete this review!",
      });
    }

    // ⭐ Delete Permanently
    await ReviewBlog.findByIdAndDelete(ratingId);

    return res.status(200).json({
      status: true,
      message: "Review deleted successfully!",
      deletedReviewId: ratingId,
    });
  } catch (err) {
    console.error("Delete Review Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = routes;
