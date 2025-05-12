const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");

// @desc      Lấy tất cả cuộc hội thoại của người dùng
// @route     GET /api/messages/conversations
// @access    Private
exports.getMyConversations = asyncHandler(async (req, res, next) => {
  const conversations = await Conversation.find({
    participants: { $in: [req.user.id] },
  })
    .populate({
      path: "participants",
      select: "fullName avatar email",
      match: { _id: { $ne: req.user.id } }, // Không lấy thông tin của bản thân
    })
    .populate({
      path: "lastMessage",
      select: "content createdAt sender",
    })
    .populate({
      path: "relatedJob",
      select: "title company",
    })
    .sort("-updatedAt");

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations,
  });
});

// @desc      Lấy chi tiết cuộc hội thoại và tin nhắn
// @route     GET /api/messages/conversations/:id
// @access    Private
exports.getConversation = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate({
      path: "participants",
      select: "fullName avatar email phone",
    })
    .populate({
      path: "relatedJob",
      select: "title company location",
    });

  if (!conversation) {
    return next(
      new ErrorResponse(
        `Không tìm thấy cuộc hội thoại với id ${req.params.id}`,
        404
      )
    );
  }

  // Kiểm tra người dùng có phải là thành viên của cuộc hội thoại
  if (
    !conversation.participants.some((p) => p._id.toString() === req.user.id)
  ) {
    return next(
      new ErrorResponse("Không có quyền truy cập vào cuộc hội thoại này", 403)
    );
  }

  // Lấy tin nhắn của cuộc hội thoại
  const messages = await Message.find({ conversationId: req.params.id }).sort(
    "createdAt"
  );

  // Đánh dấu tin nhắn đã đọc (chỉ những tin nhắn không phải của người dùng)
  await Message.updateMany(
    {
      conversationId: req.params.id,
      sender: { $ne: req.user.id },
      read: false,
    },
    { read: true }
  );

  // Cập nhật số tin nhắn chưa đọc về 0
  await Conversation.findByIdAndUpdate(req.params.id, { unreadCount: 0 });

  res.status(200).json({
    success: true,
    data: {
      conversation,
      messages,
    },
  });
});

// @desc      Tạo hoặc tiếp tục cuộc hội thoại
// @route     POST /api/messages/conversations
// @access    Private
exports.createConversation = asyncHandler(async (req, res, next) => {
  const { receiverId, message, relatedJobId } = req.body;

  if (!receiverId || !message) {
    return next(
      new ErrorResponse(
        "Vui lòng cung cấp người nhận và nội dung tin nhắn",
        400
      )
    );
  }

  // Kiểm tra người nhận có tồn tại không
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return next(
      new ErrorResponse(`Không tìm thấy người dùng với id ${receiverId}`, 404)
    );
  }

  // Tìm cuộc hội thoại hiện có giữa hai người dùng
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user.id, receiverId] },
    relatedJob: relatedJobId || null,
  });

  // Nếu chưa có cuộc hội thoại, tạo mới
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, receiverId],
      relatedJob: relatedJobId,
    });
  }

  // Tạo tin nhắn mới
  const newMessage = await Message.create({
    sender: req.user.id,
    receiver: receiverId,
    content: message,
    conversationId: conversation._id,
    relatedJob: relatedJobId,
  });

  // Cập nhật thông tin cuộc hội thoại
  conversation.lastMessage = newMessage._id;
  conversation.unreadCount = (conversation.unreadCount || 0) + 1;
  await conversation.save();

  // Tạo thông báo cho người nhận
  await Notification.create({
    recipient: receiverId,
    type: "message",
    message: `Bạn có tin nhắn mới từ ${req.user.fullName}`,
    relatedEntity: newMessage._id,
    onModel: "Message",
  });

  res.status(201).json({
    success: true,
    data: {
      conversation,
      message: newMessage,
    },
  });
});

// @desc      Gửi tin nhắn mới trong cuộc hội thoại
// @route     POST /api/messages/conversations/:id
// @access    Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  if (!content) {
    return next(new ErrorResponse("Vui lòng cung cấp nội dung tin nhắn", 400));
  }

  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(
      new ErrorResponse(
        `Không tìm thấy cuộc hội thoại với id ${req.params.id}`,
        404
      )
    );
  }

  // Kiểm tra người dùng có phải là thành viên của cuộc hội thoại
  if (!conversation.participants.includes(req.user.id)) {
    return next(
      new ErrorResponse(
        "Không có quyền gửi tin nhắn trong cuộc hội thoại này",
        403
      )
    );
  }

  // Tìm người nhận (người dùng khác trong cuộc hội thoại)
  const receiver = conversation.participants.find(
    (participant) => participant.toString() !== req.user.id
  );

  // Tạo tin nhắn mới
  const message = await Message.create({
    sender: req.user.id,
    receiver,
    content,
    conversationId: conversation._id,
    relatedJob: conversation.relatedJob,
  });

  // Cập nhật thông tin cuộc hội thoại
  conversation.lastMessage = message._id;
  conversation.unreadCount = (conversation.unreadCount || 0) + 1;
  await conversation.save();

  // Tạo thông báo cho người nhận
  await Notification.create({
    recipient: receiver,
    type: "message",
    message: `Bạn có tin nhắn mới từ ${req.user.fullName}`,
    relatedEntity: message._id,
    onModel: "Message",
  });

  res.status(201).json({
    success: true,
    data: message,
  });
});
