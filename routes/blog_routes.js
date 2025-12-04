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
const BlogLike = require("../model/likeanddislike_model");
const ReviewBlog = require("../model/reviewandrating_model");
// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dyit1jjef",
  api_key: process.env.CLOUD_KEY || "743564427533897",
  api_secret: process.env.CLOUD_SECRET || "TR9TvJlNF5Blp6AcyZ0plQ0kqkQ",
});

// Upload Function
const uploadImage = async (file) => {
  if (!file || !file.tempFilePath) return "";
  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "blogsFolder",
      timeout: 600000, // 10 min timeout (fix timeout error)
    });
    return result.secure_url;
  } catch (error) {
    console.log("Cloudinary Upload Error:", error);
    return "";
  }
};

routes.post("/addBlogsMultipleImage", checkAuth, async (req, res) => {
  try {
    const {
      blogTitle,
      blogSubDescription,
      blogDescription1,
      blogDescription2,
      blogDescription3,
      blogDescription4,
      categoryId,
      categoryTitle,
    } = req.body;

    // Required Field Check
    if (
      !blogTitle ||
      !blogSubDescription ||
      !blogDescription1 ||
      !blogDescription2 ||
      !blogDescription3 ||
      !blogDescription4 ||
      !categoryId ||
      !categoryTitle
    ) {
      return res.status(400).json({
        status: false,
        message: "All required fields must be provided!",
      });shortId
    }

    // User Check
    const user = await BlogUser.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found!" });
    }
    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message: "Account is deleted or inactive.",
      });
    }

    // Category Validation
    const category = await CategoryBlog.findOne({
      _id: categoryId,
      userId: req.user.userId,
    });

    if (!category) {
      return res.status(400).json({
        status: false,
        message: "Category not found!",
      });
    }

    // Generate Slug
    let slug = slugify(blogTitle, { lower: true, strict: true, trim: true });

    // Check Duplicate Slug → Fix Duplicate Key Error
    const slugExists = await BlogData.findOne({ slug });
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }

    // Image Uploads
    const mainImage = await uploadImage(req.files?.imageUrl);
    const img2 = await uploadImage(req.files?.secondImage);
    const img3 = await uploadImage(req.files?.thirdImage);
    const img4 = await uploadImage(req.files?.fourthImage);

    // Create Blog
    const newBlog = new BlogData({
      userId: req.user.userId,
      categoryId,
      blogTitle: blogTitle.trim(),
      categoryTitle: categoryTitle.trim(),
      slug, 
      blogSubDescription: blogSubDescription.trim(),
      blogDescription1: blogDescription1.trim(),
      blogDescription2: blogDescription2.trim(),
      blogDescription3: blogDescription3.trim(),
      blogDescription4: blogDescription4.trim(),
      userName: `${user.firstName} ${user.lastName}`,
      imageUrl: mainImage,
      secondImage: img2,
      thirdImage: img3,
      fourthImage: img4,
    });

    await newBlog.save();

    return res.status(201).json({
      status: true,
      message: "Blog created successfully!",
      data: newBlog,
    });
  } catch (err) {
    console.error("Add Blog Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

/* routes.get("/getAllBlogs", async (req, res) => {
  try {
    const blogs = await BlogData.find({})
      .sort({ createdAt: -1 }) // corrected field name
      .populate("categoryId", "categoryTitle imageUrl") // ✔ correct reference
      .populate("userId", "firstName lastName email imageUrl"); // if userModel correct

    if (!blogs.length) {
      return res.status(404).json({
        status: false,
        message: "No blogs found!",
      });
    }

    const result = [];

    for (let i = 0; i < blogs.length; i++) {
      const commets = await CommentBlog.find({ blogId: blogs[i]._id });
      const totalComment = commets.length;
      const comment = commets.comment;

      result.push({
        ...blogs.toObject(),
        totalComment,
        comment,
      });
    }

    return res.status(200).json({
      status: true,
      message: "All blogs fetched successfully!",
      count: blogs.length,
    
      BlogList: result,
    });
  } catch (err) {
    console.error("❌ Get All Blogs Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
      error: err.message,
    });
  }
}); */

/* routes.get("/getAllBlogs", async (req, res) => {
  try {
    const blogs = await BlogData.find({})
      .sort({ createdAt: -1 })
      .populate("categoryId", "categoryTitle imageUrl")
      .populate("userId", "firstName lastName email imageUrl");

    if (!blogs.length) {
      return res.status(404).json({
        status: false,
        message: "No blogs found!",
      });
    }

    let result = [];

    for (let blog of blogs) {
      // 🔹 Fetch all comments for this blog
      const comments = await CommentBlog.find({ blogId: blog._id }).sort({
        createdAt: -1,
      }).populate("commentId", "comment tota")

      result.push({
        ...blog.toObject(),
        totalComments: comments.length, // 👈 Total number of comments
        comments: comments.comments, // 👈 List of all comments for this blog
      });
    }

    return res.status(200).json({
      status: true,
      message: "All blogs fetched successfully!",
      totalBlogs: blogs.length,
      BlogList: result,
    });
  } catch (err) {
    console.error("❌ Get All Blogs Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
      error: err.message,
    });
  }
}); */

/* routes.get("/getAllBlogs", async (req, res) => {
  try {
    const blogs = await BlogData.find({})
      .sort({ createdAt: -1 })
      .populate("categoryId", "categoryTitle imageUrl")
      .populate("userId", "firstName lastName email imageUrl");

    if (!blogs.length) {
      return res.status(404).json({
        status: false,
        message: "No blogs found!",
      });
    }

    let result = [];

    // ----------- MAIN FOR LOOP FOR BLOGS -----------
    for (let i = 0; i < blogs.length; i++) {
      let blog = blogs[i];

      // 🟦 fetch comments for this blog
      const comments = await CommentBlog.find({ blogId: blog._id })
        .sort({ createdAt: -1 })
        .populate("userId", "firstName lastName imageUrl");

      // ----------- FOR LOOP FOR COMMENTS -----------
      let formattedComments = [];

      for (let j = 0; j < comments.length; j++) {
        let c = comments[j];

        formattedComments.push({
          username: `${c.userId.firstName} ${c.userId.lastName}`,
          comment: c.comment,
          imageUrl: c.userId.imageUrl,
          createdAt: c.createdAt,
        });
      }

      // push final blog + comments
      result.push({
        ...blog.toObject(),
        totalComments: comments.length,
        comments: formattedComments,
      });
    }

  

    return res.status(200).json({
      status: true,
      message: "All blogs fetched successfully!",
      totalBlogs: blogs.length,
      BlogList: result,
    });
  } catch (err) {
    console.error("❌ Get All Blogs Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
      error: err.message,
    });
  }
});
 */

/* routes.get("/getAllBlogs", checkAuth, async (req, res) => {
  try {
    const blogs = await BlogData.find({})
      .sort({ createdAt: -1 })
      .populate("categoryId", "categoryTitle imageUrl")
      .populate("userId", "firstName lastName email imageUrl");

    if (!blogs.length) {
      return res.status(404).json({
        status: false,
        message: "No blogs found!",
      });
    }

    let result = [];

    for (let i = 0; i < blogs.length; i++) {
      let blog = blogs[i];

      // 🟦 Fetch comments
      const comments = await CommentBlog.find({ blogId: blog._id })
        .sort({ createdAt: -1 })
        .populate("userId", "firstName lastName imageUrl");

      const review = await ReviewBlog.find({ blogId: blog._id }).sort({
        createAt: -1,
      });

      let reviewRatingList = [];

      for (let k = 0; k < review.length; k++) {
        let r = review[k];
        reviewRatingList.push({
          rating: r.rating,
          remark: r.remark,
          createAt: r.createdAt,
        });
      }

      let formattedComments = [];

      for (let j = 0; j < comments.length; j++) {
        let c = comments[j];

        formattedComments.push({
          username: `${c.userId.firstName} ${c.userId.lastName}`,
          comment: c.comment,
          imageUrl: c.userId.imageUrl,
          createdAt: c.createdAt,
        });
      }

      // 🟦 LIKE COUNT
      const totalLikes = await BlogLike.countDocuments({
        blogId: blog._id,
        isLiked: true,
      });

      // 🟦 DISLIKE COUNT
      const totalDislikes = await BlogLike.countDocuments({
        blogId: blog._id,
        isLiked: false,
      });

      // 🟦 CHECK IF CURRENT USER LIKED THIS BLOG
      const userLike = await BlogLike.findOne({
        blogId: blog._id,
        userId: req.user.userId,
      });

      result.push({
        ...blog.toObject(),

        // 🟦 New Keys (Like/Dislike)
        totalLikes,
        totalDislikes,
        userLiked: userLike ? userLike.isLiked : null, // true / false / null
        totalRating: review.length,
        // 🟦 Comments
        totalComments: comments.length,
        comments: formattedComments,
      });
    }

    return res.status(200).json({
      status: true,
      message: "All blogs fetched successfully!",
      totalBlogs: blogs.length,
      BlogList: result,
    });
  } catch (err) {
    console.error("❌ Get All Blogs Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
      error: err.message,
    });
  }
}); */

routes.get("/getAllBlogs", checkAuth, async (req, res) => {
  try {
    const blogs = await BlogData.find({})
      .sort({ createdAt: -1 })
      .populate("categoryId", "categoryTitle imageUrl")
      .populate("userId", "firstName lastName email imageUrl");

    if (!blogs.length) {
      return res.status(404).json({
        status: false,
        message: "No blogs found!",
      });
    }

    let result = [];

    for (let i = 0; i < blogs.length; i++) {
      let blog = blogs[i];

      // ------------------------------------
      // 🔵 FETCH COMMENTS
      // ------------------------------------
      const comments = await CommentBlog.find({ blogId: blog._id })
        .sort({ createdAt: -1 })
        .populate("userId", "firstName lastName imageUrl");

      let formattedComments = [];
      for (let j = 0; j < comments.length; j++) {
        let c = comments[j];
        formattedComments.push({
          username: `${c.userId.firstName} ${c.userId.lastName}`,
          comment: c.comment,
          imageUrl: c.userId.imageUrl,
          createdAt: c.createdAt,
        });
      }

      // ------------------------------------
      // 🔵 FETCH RATING & REVIEWS
      // ------------------------------------
      const reviews = await ReviewBlog.find({ blogId: blog._id })
        .sort({ createdAt: -1 })
        .populate("userId", "firstName lastName imageUrl");

      let reviewList = [];
      let totalRatingSum = 0;

      for (let k = 0; k < reviews.length; k++) {
        let r = reviews[k];

        totalRatingSum += r.rating;

        reviewList.push({
          rating: r.rating,
          remark: r.remark,
          username: `${r.userId.firstName} ${r.userId.lastName}`,
          userImage: r.userId.imageUrl,
          createdAt: r.createdAt,
        });
      }

      const totalRatingCount = reviews.length;
      const averageRating =
        totalRatingCount > 0
          ? (totalRatingSum / totalRatingCount).toFixed(1)
          : 0;

      // ------------------------------------
      // 🔵 LIKE & DISLIKE
      // ------------------------------------
      const totalLikes = await BlogLike.countDocuments({
        blogId: blog._id,
        isLiked: true,
      });

      const totalDislikes = await BlogLike.countDocuments({
        blogId: blog._id,
        isLiked: false,
      });

      const userLike = await BlogLike.findOne({
        blogId: blog._id,
        userId: req.user.userId,
      });

      // ------------------------------------
      // 🔵 FINAL BLOG OBJECT
      // ------------------------------------
      result.push({
        ...blog.toObject(),

        // 🔹 Comments
        totalComments: comments.length,
        comments: formattedComments,

        // 🔹 Rating & Reviews
        totalRating: totalRatingCount,
        averageRating,
        reviewList,

        // 🔹 Like-Dislike
        totalLikes,
        totalDislikes,
        userLiked: userLike ? userLike.isLiked : null, // true / false / null
      });
    }

    return res.status(200).json({
      status: true,
      message: "All blogs fetched successfully!",
      totalBlogs: blogs.length,
      BlogList: result,
    });
  } catch (err) {
    console.error("❌ Get All Blogs Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
      error: err.message,
    });
  }
});

/* routes.get("/getBlogOnlyAuthUser", checkAuth, async (req, res) => {
  try {
    // User Check
    const user = await BlogUser.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found!" });
    }
    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message: "Account is deleted or inactive.",
      });
    }

    const blogs = await BlogData.find({})
      .sort({ createdAt: -1 }) // corrected field name
      .populate("categoryId", "categoryTitle imageUrl") // ✔ correct reference
      .populate("userId", "firstName lastName email imageUrl"); // if userModel correct

    if (!blogs.length) {
      return res.status(404).json({
        status: false,
        message: "No blogs found!",
      });
    }

    let result = [];

    // ----------- MAIN FOR LOOP FOR BLOGS -----------
    for (let i = 0; i < blogs.length; i++) {
      let blog = blogs[i];

      // 🟦 fetch comments for this blog
      const comments = await CommentBlog.find({ blogId: blog._id })
        .sort({ createdAt: -1 })
        .populate("userId", "firstName lastName imageUrl");

      // ----------- FOR LOOP FOR COMMENTS -----------
      let formattedComments = [];

      for (let j = 0; j < comments.length; j++) {
        let c = comments[j];

        formattedComments.push({
          username: `${c.userId.firstName} ${c.userId.lastName}`,
          comment: c.comment,
          imageUrl: c.userId.imageUrl,
          createdAt: c.createdAt,
        });
      }

      // push final blog + comments
      result.push({
        ...blog.toObject(),
        totalComments: comments.length,
        comments: formattedComments,
      });
    }
    return res.status(200).json({
      status: true,
      message: "All blogs fetched successfully!",
      count: blogs.length,
      BlogList: result,
    });
  } catch (err) {
    console.error("❌ Get Blogs by LoggedIn User Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
      error: err.message,
    });
  }
}); */

routes.get("/getBlogOnlyAuthUser", checkAuth, async (req, res) => {
  try {
    // User Check
    const user = await BlogUser.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found!" });
    }
    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message: "Account is deleted or inactive.",
      });
    }

    const blogs = await BlogData.find({})
      .sort({ createdAt: -1 }) // corrected field name
      .populate("categoryId", "categoryTitle imageUrl") // ✔ correct reference
      .populate("userId", "firstName lastName email imageUrl"); // if userModel correct

    if (!blogs.length) {
      return res.status(404).json({
        status: false,
        message: "No blogs found!",
      });
    }

    let result = [];

    for (let i = 0; i < blogs.length; i++) {
      let blog = blogs[i];

      // ------------------------------------
      // 🔵 FETCH COMMENTS
      // ------------------------------------
      const comments = await CommentBlog.find({ blogId: blog._id })
        .sort({ createdAt: -1 })
        .populate("userId", "firstName lastName imageUrl");

      let formattedComments = [];
      for (let j = 0; j < comments.length; j++) {
        let c = comments[j];
        formattedComments.push({
          username: `${c.userId.firstName} ${c.userId.lastName}`,
          comment: c.comment,
          imageUrl: c.userId.imageUrl,
          createdAt: c.createdAt,
        });
      }

      // ------------------------------------
      // 🔵 FETCH RATING & REVIEWS
      // ------------------------------------
      const reviews = await ReviewBlog.find({ blogId: blog._id })
        .sort({ createdAt: -1 })
        .populate("userId", "firstName lastName imageUrl");

      let reviewList = [];
      let totalRatingSum = 0;

      for (let k = 0; k < reviews.length; k++) {
        let r = reviews[k];

        totalRatingSum += r.rating;

        reviewList.push({
          rating: r.rating,
          remark: r.remark,
          username: `${r.userId.firstName} ${r.userId.lastName}`,
          userImage: r.userId.imageUrl,
          createdAt: r.createdAt,
        });
      }

      const totalRatingCount = reviews.length;
      const averageRating =
        totalRatingCount > 0
          ? (totalRatingSum / totalRatingCount).toFixed(1)
          : 0;

      // ------------------------------------
      // 🔵 LIKE & DISLIKE
      // ------------------------------------
      const totalLikes = await BlogLike.countDocuments({
        blogId: blog._id,
        isLiked: true,
      });

      const totalDislikes = await BlogLike.countDocuments({
        blogId: blog._id,
        isLiked: false,
      });

      const userLike = await BlogLike.findOne({
        blogId: blog._id,
        userId: req.user.userId,
      });

      // ------------------------------------
      // 🔵 FINAL BLOG OBJECT
      // ------------------------------------
      result.push({
        ...blog.toObject(),

        // 🔹 Comments
        totalComments: comments.length,
        comments: formattedComments,

        // 🔹 Rating & Reviews
        totalRating: totalRatingCount,
        averageRating,
        reviewList,

        // 🔹 Like-Dislike
        totalLikes,
        totalDislikes,
        userLiked: userLike ? userLike.isLiked : null, // true / false / null
      });
    }
    return res.status(200).json({
      status: true,
      message: "All blogs fetched successfully!",
      count: blogs.length,
      BlogList: result,
    });
  } catch (err) {
    console.error("❌ Get Blogs by LoggedIn User Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
      error: err.message,
    });
  }
});
routes.get("/getBlogByCategoryId/:catId", async (req, res) => {
  try {
    const { catId } = req.params;

    // Validate Category ID
    if (!catId || catId === "undefined" || catId === null) {
      return res.status(400).json({
        status: false,
        message: "Valid Category ID is required!",
      });
    }

    const category = await CategoryBlog.findById(catId);
    if (!category) {
      return res.status(404).json({
        status: false,
        message: "Category not found!",
      });
    }

    const blogs = await BlogData.find({ categoryId: catId })
      .sort({ createdAt: -1 })
      .populate("userId", "firestName lastName email imageUrl")
      .populate("categoryId", "categoryTitle imageUrl");

    if (!blogs.length) {
      return res.status(200).json({
        status: true,
        message: "No blogs found under this category!",
        categoryTitle: category.categoryTitle,
        totalBlogs: 0,
        data: [],
      });
    }

    return res.status(200).json({
      status: true,
      message: "Blogs fetched successfully!",
      //   categoryTitle: category.categoryTitle,
      totalBlogs: blogs.length,
      blogCategoryByIdList: blogs,
    });
  } catch (err) {
    console.error("❌ Get blogs by categoryId Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.get("/getBlogWithAuthCategoryId/:catId", checkAuth, async (req, res) => {
  try {
    const { catId } = req.params;

    // Validate Category ID
    if (!catId || catId === "undefined" || catId === null) {
      return res.status(400).json({
        status: false,
        message: "Valid Category ID is required!",
      });
    }

    // Validate User
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

    // Validate Category
    const category = await CategoryBlog.findById(catId);
    if (!category) {
      return res.status(404).json({
        status: false,
        message: "Category not found!",
      });
    }

    // Fetch Blogs
    const blogs = await BlogData.find({ categoryId: catId })
      .sort({ createdAt: -1 })
      .populate("userId", "firestName lastName email imageUrl")
      .populate("categoryId", "categoryTitle imageUrl");

    // If no blogs
    if (!blogs.length) {
      return res.status(200).json({
        status: true,
        message: "No blogs found under this category!",
        categoryTitle: category.categoryTitle,
        totalBlogs: 0,
        data: [],
      });
    }

    // Success Response
    return res.status(200).json({
      status: true,
      message: "Blogs fetched successfully!",
      categoryTitle: category.categoryTitle,
      totalBlogs: blogs.length,
      blogCategoryByIdList: blogs,
    });
  } catch (err) {
    console.error("❌ Get blogs by categoryId Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.patch("/update_blog/:blogId", checkAuth, async (req, res) => {
  try {
    const { blogId } = req.params;

    const {
      blogTitle,
      blogSubDescription,
      blogDescription1,
      blogDescription2,
      blogDescription3,
      blogDescription4,
      categoryId,
      categoryTitle,
    } = req.body;

    const { imageUrl, secondImage, thirdImage, fourthImage } = req.files || {};

    // ✅ Validate User
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

    // ✅ Validate Blog
    const blogs = await BlogData.findById(blogId);
    if (!blogs) {
      return res.status(404).json({
        status: false,
        message: "Blog not found!",
      });
    }

    if (blogs.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        status: false,
        message: "Not authorized to update this blog!",
      });
    }

    // ✅ Validate Category
    if (categoryId) {
      const category = await CategoryBlog.findById(categoryId);
      if (!category) {
        return res.status(400).json({
          status: false,
          message: "Category not found!",
        });
      }
      blogs.categoryId = categoryId;
    }

    // ✅ Update Text Fields
    if (blogTitle) blogs.blogTitle = blogTitle.trim();
    if (categoryTitle) blogs.categoryTitle = categoryTitle.trim();
    if (blogSubDescription)
      blogs.blogSubDescription = blogSubDescription.trim();
    if (blogDescription1) blogs.blogDescription1 = blogDescription1.trim();
    if (blogDescription2) blogs.blogDescription2 = blogDescription2.trim();
    if (blogDescription3) blogs.blogDescription3 = blogDescription3.trim();
    if (blogDescription4) blogs.blogDescription4 = blogDescription4.trim();

    // -------------------------------------
    //  ✅ Cloudinary Image Upload Function
    // -------------------------------------
    const uploadImage = async (file, oldUrl) => {
      try {
        if (!file || !file.tempFilePath) return oldUrl || "";

        // 🔄 Delete old image from Cloudinary
        if (oldUrl) {
          const parts = oldUrl.split("/");
          const fileName = parts[parts.length - 1];
          const publicId = `blogsFolder/${fileName.split(".")[0]}`;

          await cloudinary.uploader.destroy(publicId).catch(() => {});
        }

        // ⬆ Upload new image
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "blogsFolder",
          timeout: 600000,
        });

        return result.secure_url;
      } catch (err) {
        console.error("Cloudinary Upload Error:", err);
        return oldUrl || "";
      }
    };

    // -------------------------------------
    //  ✅ Upload Images If Provided
    // -------------------------------------
    blogs.imageUrl = await uploadImage(imageUrl, blogs.imageUrl);
    blogs.secondImage = await uploadImage(secondImage, blogs.secondImage);
    blogs.thirdImage = await uploadImage(thirdImage, blogs.thirdImage);
    blogs.fourthImage = await uploadImage(fourthImage, blogs.fourthImage);

    // -------------------------------------
    //  ✅ Save Blog
    // -------------------------------------
    await blogs.save();

    return res.status(200).json({
      status: true,
      message: "Blog updated successfully!",
      data: blogs,
    });
  } catch (err) {
    console.error("❌ Update Blog Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.delete("/delete_blog/:blogId", checkAuth, async (req, res) => {
  try {
    const { blogId } = req.params;

    // ✅ Validate User
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

    // ✅ Validate Blog
    const blogs = await BlogData.findById(blogId);
    if (!blogs) {
      return res.status(404).json({
        status: false,
        message: "Blog not found!",
      });
    }

    // ❌ Wrong message fixed
    if (blogs.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        status: false,
        message: "Not authorized to delete this blog!",
      });
    }

    // ---------------------------------------
    //   ✅ Cloudinary Delete Function
    // ---------------------------------------
    const deleteImageFromCloudinary = async (imageUrl) => {
      if (!imageUrl) return;

      try {
        const parts = imageUrl.split("/");
        const fileName = parts[parts.length - 1]; // example: abc123.jpg
        const publicId = `blogsFolder/${fileName.split(".")[0]}`;

        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.warn(
          `⚠️ Failed to delete image from Cloudinary: ${error.message}`
        );
      }
    };

    // ---------------------------------------
    //   🗑 Delete All Blog Images
    // ---------------------------------------
    await Promise.all([
      deleteImageFromCloudinary(blogs.imageUrl),
      deleteImageFromCloudinary(blogs.secondImage),
      deleteImageFromCloudinary(blogs.thirdImage),
      deleteImageFromCloudinary(blogs.fourthImage),
    ]);

    // ---------------------------------------
    //   🗑 Delete Blog Document
    // ---------------------------------------
    await BlogData.deleteOne({ _id: blogId });

    return res.status(200).json({
      status: true,
      message: "Blog deleted successfully!",
      deletedBlog: {
        blogId: blogs._id,
        blogTitle: blogs.blogTitle,
        categoryTitle: blogs.categoryTitle,
      },
    });
  } catch (err) {
    console.error("❌ Delete Blog Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = routes;
