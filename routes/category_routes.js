const express = require("express");
const routes = express.Router();
const BlogUser = require("../model/user_model");
const CategoryBlog = require("../model/category_model");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const checkAuth = require("../middlewares/check_auth");
const { default: mongoose } = require("mongoose");

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dyit1jjef",
  api_key: process.env.CLOUD_KEY || "743564427533897",
  api_secret: process.env.CLOUD_SECRET || "TR9TvJlNF5Blp6AcyZ0plQ0kqkQ",
});

routes.post("/addBlogCategory", checkAuth, async (req, res) => {
  try {
    const { categoryTitle } = req.body;
    const file = req.files?.image;

    // 🟢 1. Validation
    if (!categoryTitle) {
      return res.status(400).json({
        status: false,
        message: "Category title is required!",
      });
    }

    if (!file) {
      return res.status(400).json({
        status: false,
        message: "Image file is required!",
      });
    }

    // 🟢 2. Find User
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
        message: "Cannot add category. Account is deleted or inactive.",
      });
    }

    // 🟢 3. Check Duplicate Category
    const existCategory = await CategoryBlog.findOne({
      categoryTitle: categoryTitle.trim().toLowerCase(),
      userId: req.user.userId,
    });

    if (existCategory) {
      return res.status(400).json({
        status: false,
        message: "Category already exists!",
      });
    }

    // 🟢 4. Upload Image
    let imageUrl = "";
    if (file.tempFilePath) {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "categories",
      });
      imageUrl = result.secure_url;
    }

    // 🟢 5. Create Category
    const newCategory = new CategoryBlog({
      _id: new mongoose.Types.ObjectId(),
      categoryTitle: categoryTitle.trim().toLowerCase(),
      userId: req.user.userId,
      userName: `${user.firstName} ${user.lastName}`,
      imageUrl: imageUrl,
    });

    await newCategory.save();

    return res.status(201).json({
      status: true,
      message: "Category added successfully!",
      categoryData: newCategory,
    });
  } catch (err) {
    console.error("❌ Add Category Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.get("/getAllCategoryWithoutAuth", async (req, res) => {
  try {
    const allCategory = await CategoryBlog.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message:
        allCategory.length > 0
          ? "All categories fetched successfully!"
          : "No categories found!",
      count: allCategory.length,
      categoryList: allCategory,
    });
  } catch (err) {
    console.error("Get All Category Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.get("/getAllCategoryWithAuth", checkAuth, async (req, res) => {
  try {
    const user = await BlogUser.findById(req.user.userId);

    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found!" });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message: "Cannot fetch categories. Account is deleted or inactive.",
      });
    }

    const getCategory = await CategoryBlog.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message:
        getCategory.length > 0
          ? "User categories fetched successfully!"
          : "No categories found for this user!",
      count: getCategory.length,
      categoryList: getCategory,
      userData: user,
    });
  } catch (err) {
    console.error("Get All Category Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.patch("/update_category/:catId", checkAuth, async (req, res) => {
  try {
    const { categoryTitle } = req.body;
    const catId = req.params.catId;

    // Find user
    const user = await BlogUser.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message: "Account is deleted or inactive!",
      });
    }

    // Find category
    const category = await CategoryBlog.findById(catId);

    if (!category) {
      return res.status(404).json({
        status: false,
        message: "Category not found!",
      });
    }

    // Authorization: category belongs to this user?
    if (category.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        status: false,
        message: "Not authorized to update this category!",
      });
    }

    // Update category title
    if (categoryTitle) {
      category.categoryTitle = categoryTitle.trim();
    }

    // Update image if provided
    if (req.files && req.files.image) {
      const file = req.files.image;

      // Delete old image from cloudinary (if exists)
      if (category.imageUrl) {
        const publicId = category.imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`categories/${publicId}`);
      }

      // Upload new image
      const uploadedImage = await cloudinary.uploader.upload(
        file.tempFilePath,
        {
          folder: "categories",
        }
      );

      category.imageUrl = uploadedImage.secure_url;
    }

    await category.save();

    return res.status(200).json({
      status: true,
      message: "Category updated successfully!",
      updatedCategory: category,
    });
  } catch (err) {
    console.error("Update Category Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.delete("/delete_Category/:catId", checkAuth, async (req, res) => {
  try {
    const catId = req.params.catId;

    // Find user
    const user = await BlogUser.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message: "Account is deleted or inactive!",
      });
    }

    // Find category
    const category = await CategoryBlog.findById(catId);

    if (!category) {
      return res.status(404).json({
        status: false,
        message: "Category not found!",
      });
    }

    // Check authorization
    if (category.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        status: false,
        message: "Not authorized to delete this category!",
      });
    }

    // Delete image from Cloudinary
    if (category.imageUrl) {
      try {
        const publicId = category.imageUrl.split("/").pop().split(".")[0];

        await cloudinary.uploader.destroy(`categories/${publicId}`);
      } catch (err) {
        console.error("Cloudinary delete error:", err.message);
      }
    }

    // Delete category
    await CategoryBlog.deleteOne({ _id: catId });

    return res.status(200).json({
      status: true,
      message: "Category deleted successfully!",
      deletedCategory: category,
    });
  } catch (err) {
    console.error("Delete Category Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = routes;
