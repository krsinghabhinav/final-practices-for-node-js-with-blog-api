const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "FinalBlogUser",
    },

    userName: { type: String, required: true, trim: true },

    userImage: { type: String, default: null },

    comment: { type: String, required: true, trim: true },

    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "finalBlogData",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("finalComment", commentSchema);
