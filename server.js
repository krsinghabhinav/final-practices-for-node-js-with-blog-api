const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cron = require("node-cron");
const app = require("./app");
const BlogUser = require("./model/user_model");

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 120000,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); // ⚠ If database fails, server should stop
  }
};

connectDB();

// Cron job (midnight)
cron.schedule("0 0 * * *", async () => {
  try {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    const result = await BlogUser.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: tenDaysAgo },
    });

    console.log(`🧹 Deleted ${result.deletedCount} users before ${tenDaysAgo}`);
  } catch (err) {
    console.error("❌ Error in cron job:", err.message);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
