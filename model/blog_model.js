const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
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
    userImage: { type: String },

    blogTitle: { type: String, required: true, trim: true },
    blogSubDescription: { type: String, required: true, trim: true },

    blogDescription1: { type: String, required: true, trim: true },
    blogDescription2: { type: String, trim: true },
    blogDescription3: { type: String, trim: true },
    blogDescription4: { type: String, trim: true },

    // 🔥 Multiple Images Support
    imageUrl: { type: String },
    secondImage: { type: String },
    thirdImage: { type: String },
    fourthImage: { type: String },

    // 🔥 Unlimited images future expansion
    allImages: [{ type: String }],

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "finalCategoryBlog",
      required: true,
    },
    categoryTitle: { type: String, required: true, trim: true },

    // 🔥 SEO / Extra Features
    slug: { type: String, trim: true, unique: true },
    metaDescription: { type: String, trim: true },
    tags: [{ type: String, trim: true }],

    // 🔥 Stats
    likes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },

    // Soft Delete
    isDeleted: { type: Boolean, default: false },

    // Reading time (auto calculate)
    readingTime: { type: Number, default: 0 }, // in minutes
  },
  { timestamps: true }
);

module.exports = mongoose.model("finalBlogData", blogSchema);
