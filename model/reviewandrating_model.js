const mongoose = require("mongoose");

const reviewRatingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "FinalBlogUser",
    },

    userName: {
      type: String,
      required: true,
      trim: true,
    },

    userImage: {
      type: String,
      default: null,
    },

    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "finalBlogData",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: [1, "Minimum rating is 1"],
      max: [5, "Maximum rating is 5"],
    },

    remark: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// 🛑 Prevent duplicate review for same blog by same user
reviewRatingSchema.index({ userId: 1, blogId: 1 }, { unique: true });

module.exports = mongoose.model("FinalBlogReview", reviewRatingSchema);
