const express = require("express");
const routes = express.Router();
const BlogUser = require("../model/user_model");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const checkAuth = require("../middlewares/check_auth");

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dyit1jjef",
  api_key: process.env.CLOUD_KEY || "743564427533897",
  api_secret: process.env.CLOUD_SECRET || "TR9TvJlNF5Blp6AcyZ0plQ0kqkQ",
});

// =======================
// 🚀 USER SIGNUP ROUTE
// =======================
routes.post("/userSignup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      userName,
      email,
      password,
      address,
    } = req.body;

    // ✔ Check required fields
    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !userName ||
      !email ||
      !password ||
      !address
    ) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required!!" });
    }

    // ✔ Validate phone length
    if (phoneNumber.length !== 10) {
      return res
        .status(400)
        .json({ status: false, message: "PhoneNumber must be 10 digits!!" });
    }

    // ✔ Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid email address!!" });
    }

    // ✔ Validate password
    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 6 characters long!!",
      });
    }

    // ❗ Email Already Exists (Bug Fixed)
    const existEmailUser = await BlogUser.findOne({ email });
    if (existEmailUser) {
      return res
        .status(400)
        .json({ status: false, message: "Email already exists!!" });
    }

    // ❗ Username Already Exists
    const existUserName = await BlogUser.findOne({ userName });
    if (existUserName) {
      return res
        .status(400)
        .json({ status: false, message: "Username already taken!!" });
    }

    // ✔ Check image upload
    let imageUrl = "";
    if (req.files?.image) {
      const file = req.files.image;
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "user_profiles",
      });
      imageUrl = uploadResult.secure_url;
    }

    // ✔ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✔ Create User
    const newUser = new BlogUser({
      firstName,
      lastName,
      phoneNumber,
      userName,
      email,
      password: hashedPassword,
      address,
      imageUrl,
    });

    await newUser.save();

    res.status(200).json({
      status: true,
      message: "User registered successfully",
      userData: newUser,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.post("/userLogin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required!",
      });
    }

    // 2️⃣ Check user exist
    const user = await BlogUser.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    // 3️⃣ Deletion check
    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message:
          "Your account is marked for deletion. It will be permanently deleted after 10 days.",
      });
    }

    // 4️⃣ Match password
    const isMatchPassword = await bcrypt.compare(password, user.password);
    if (!isMatchPassword) {
      return res.status(401).json({
        status: false,
        message: "Invalid password!",
      });
    }

    // 5️⃣ Create token with all required user details
    const token = jwt.sign(
      {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
      },
      process.env.JWT_SECRET || "tokenkey",
      { expiresIn: "50d" }
    );

    // 6️⃣ Success
    return res.status(200).json({
      status: true,
      message: "User Login Successful!",
      token,
      userData: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
      error: err.message,
    });
  }
});

routes.post("/change_password", checkAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;

    // 1️⃣ Validate input
    if (!newPassword) {
      return res.status(400).json({
        status: false,
        message: "New password is required!",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 6 characters long!",
      });
    }

    // 2️⃣ Find user by token-based ID
    const user = await BlogUser.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    // 3️⃣ Check if user marked for deletion
    if (user.isDeleted) {
      return res.status(403).json({
        status: false,
        message:
          "Your account is marked for deletion and cannot reset password. It will be permanently deleted after 10 days.",
      });
    }

    // 4️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5️⃣ Update password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Password updated successfully!",
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
      error: err.message,
    });
  }
});

routes.get("/getUserDetails", checkAuth, async (req, res) => {
  try {
    // 1️⃣ Validate token payload
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access! Token invalid or missing.",
      });
    }

    // 2️⃣ Fetch user and hide password
    const user = await BlogUser.findById(req.user.userId).select("-password");

    // 3️⃣ Check if user exists
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    // 4️⃣ Check if user marked for deletion
    if (user.isDeleted) {
      return res.status(400).json({
        status: false,
        message:
          "Your account is marked for deletion. It will be permanently deleted after 10 days.",
      });
    }

    // 5️⃣ Finally return user data
    return res.status(200).json({
      status: true,
      message: "User fetched successfully!",
      userData: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.get("/getAllUsers", async (req, res) => {
  try {
    // Fetch all users except deleted ones
    const users = await BlogUser.find({ isDeleted: false }).select("-password");

    return res.status(200).json({
      status: true,
      message: "All users fetched successfully!",
      totalUsers: users.length,
      userData: users,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

/* routes.patch("/updateUserWithImage", checkAuth, async (req, res) => {
  try {
    // Check valid token user
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access! Token invalid or missing.",
      });
    }

    const { firstName, lastName, userName, address, phoneNumber } = req.body;

    // Find user
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
        message: "Cannot update. Account is deleted or inactive.",
      });
    }

    // Update simple fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (userName) user.userName = userName;
    if (address) user.address = address;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // Image Upload Handling
    if (req.files && req.files.image) {
      const file = req.files.image;

      // Delete old image from Cloudinary (if exists)
      if (user.imageUrlPublicId) {
        try {
          await cloudinary.uploader.destroy(user.imageUrlPublicId);
        } catch (err) {
          console.error("Error deleting old image:", err.message);
        }
      }

      // Upload new image
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "user_profiles",
        resource_type: "image",
      });

      // Save new image data
      user.imageUrl = uploadResult.secure_url;
      user.imageUrlPublicId = uploadResult.public_id;
    }

    // Save updated user
    await user.save();

    return res.status(200).json({
      status: true,
      message: "User updated successfully!",
      userData: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.delete("/delete_account", checkAuth, async (req, res) => {
  try {
    // Check userId available from JWT
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access! Invalid or missing token.",
      });
    }

    // Find user
    const user = await BlogUser.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    // Check if already deleted
    if (user.isDeleted) {
      return res.status(400).json({
        status: false,
        message:
          "Your account is already marked for deletion. It will be permanently deleted after 10 days.",
      });
    }

    // Mark for deletion
    user.isDeleted = true;
    user.deletedAt = new Date();

    await user.save();

    return res.status(200).json({
      status: true,
      message:
        "Your account has been marked for deletion. It will be permanently deleted after 10 days.",
      userData: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
}); */

routes.patch("/updateUserWithImage", checkAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access! Token invalid or missing.",
      });
    }

    const { firstName, lastName, userName, address, phoneNumber } = req.body;

    // Find user
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
        message: "Cannot update. Account is deleted or inactive.",
      });
    }

    // Update simple fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (userName) user.userName = userName;
    if (address) user.address = address;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // Check image update request
    if (req.files && req.files.image) {
      const file = req.files.image;

      // Delete old Cloudinary image
      if (user.imageUrlPublicId) {
        try {
          await cloudinary.uploader.destroy(user.imageUrlPublicId);
        } catch (err) {
          console.error("Cloudinary old image delete error:", err.message);
        }
      }

      // Upload new image
      const uploadedImage = await cloudinary.uploader.upload(
        file.tempFilePath,
        {
          folder: "user_profiles",
        }
      );

      user.imageUrl = uploadedImage.secure_url;
      user.imageUrlPublicId = uploadedImage.public_id;
    }

    await user.save();

    return res.status(200).json({
      status: true,
      message: "User updated successfully!",
      userData: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

routes.delete("/delete_account", checkAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access! Invalid or missing token.",
      });
    }

    const user = await BlogUser.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        status: false,
        message:
          "Your account is already marked for deletion. It will be permanently deleted after 10 days.",
      });
    }

    // Delete user profile image from Cloudinary
    if (user.imageUrlPublicId) {
      try {
        await cloudinary.uploader.destroy(user.imageUrlPublicId);
      } catch (err) {
        console.error("Cloudinary delete error:", err.message);
      }
    }

    // Mark account for deletion
    user.isDeleted = true;
    user.deletedAt = new Date();

    await user.save();

    return res.status(200).json({
      status: true,
      message:
        "Your account has been marked for deletion. It will be permanently deleted after 10 days.",
      userData: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = routes;
