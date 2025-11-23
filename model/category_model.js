const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true, // Auto-generate _id (optional)
    },

    userId: {
      type: String,
      required: true, // Spelling corrected
    },

    categoryTitle: {
      type: String,
      required: true, // Spelling corrected
      trim: true,
    },

    imageUrl: {
      type: String,
      default: null,
    },

    userName: {
      type: String,
      required: true, // Spelling corrected
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("finalCategoryBlog", categorySchema);
