const mongoose = require("mongoose");

const blogLikeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "FinalBlogUser",
    },

    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "finalBlogData",
    },

    isLiked: {
      type: Boolean,
      default: true, // true = liked, false = disliked / removed
    },
  },
  { timestamps: true }
);

// A user can LIKE only once ⇾ prevent duplicates
blogLikeSchema.index({ userId: 1, blogId: 1 }, { unique: true });

module.exports = mongoose.model("FinalBlogLike", blogLikeSchema);
