const express = require("express");
const {
  getMyConversations,
  getConversation,
  createConversation,
  sendMessage,
} = require("../controllers/messageController");

const router = express.Router();

const { protect } = require("../middlewares/auth");

// Lấy tất cả cuộc hội thoại của người dùng
router.get("/conversations", protect, getMyConversations);

// Tạo cuộc hội thoại mới
router.post("/conversations", protect, createConversation);

// Lấy chi tiết cuộc hội thoại và gửi tin nhắn
router
  .route("/conversations/:id")
  .get(protect, getConversation)
  .post(protect, sendMessage);

module.exports = router;
