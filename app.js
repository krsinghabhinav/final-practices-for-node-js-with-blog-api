const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const fileUpload = require("express-fileupload");

// ROUTES IMPORTS (Correct)
const UserRoutes = require("./routes/user_routes");
const CategoryRoutes = require("./routes/category_routes");
const BlogData = require("./routes/blog_routes");
const CommnetBlog = require("./routes/comment_routes");
const LikeDislike = require("./routes/likeanddislike_routes");
const ReviewRating = require("./routes/review_rating_routes");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File Upload Middleware
app.use(
  fileUpload({
    useTempFiles: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  })
);

// Correct Route Setup
app.use("/user", UserRoutes);
app.use("/cat", CategoryRoutes);
app.use("/blog", BlogData);
app.use("/comment", CommnetBlog);
app.use("/like", LikeDislike);
app.use("/review", ReviewRating);

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Server is running...");
});

module.exports = app;
