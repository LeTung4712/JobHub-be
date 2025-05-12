const express = require("express");
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

const { protect } = require("../middlewares/auth");

// Lấy tất cả thông báo của người dùng
router.get("/", protect, getMyNotifications);

// Đánh dấu tất cả thông báo đã đọc
router.put("/mark-all-read", protect, markAllAsRead);

// Đánh dấu thông báo đã đọc và xóa thông báo
router
  .route("/:id")
  .put(protect, markAsRead)
  .delete(protect, deleteNotification);

module.exports = router; 