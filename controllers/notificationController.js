const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");

// @desc      Lấy tất cả thông báo của người dùng
// @route     GET /api/notifications
// @access    Private
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort("-createdAt")
    .populate({
      path: "relatedEntity",
      select: "title company status content",
    });

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});

// @desc      Đánh dấu thông báo đã đọc
// @route     PUT /api/notifications/:id
// @access    Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(`Không tìm thấy thông báo với id ${req.params.id}`, 404)
    );
  }

  // Kiểm tra quyền (chỉ người nhận mới có thể đánh dấu thông báo đã đọc)
  if (notification.recipient.toString() !== req.user.id) {
    return next(
      new ErrorResponse("Không có quyền cập nhật thông báo này", 403)
    );
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc      Đánh dấu tất cả thông báo đã đọc
// @route     PUT /api/notifications/mark-all-read
// @access    Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: "Tất cả thông báo đã được đánh dấu là đã đọc",
  });
});

// @desc      Xóa thông báo
// @route     DELETE /api/notifications/:id
// @access    Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(`Không tìm thấy thông báo với id ${req.params.id}`, 404)
    );
  }

  // Kiểm tra quyền (chỉ người nhận mới có thể xóa thông báo)
  if (notification.recipient.toString() !== req.user.id) {
    return next(new ErrorResponse("Không có quyền xóa thông báo này", 403));
  }

  await notification.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
