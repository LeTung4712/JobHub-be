const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");
const { sendTokenResponse } = require("../utils/jwtToken");

// @desc      Đăng ký người dùng
// @route     POST /api/users/register
// @access    Public
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, password } = req.body;

  // Create user
  const user = await User.create({
    fullName,
    email,
    password,
  });

  sendTokenResponse(user, 201, res);
});

// @desc      Đăng nhập
// @route     POST /api/users/login
// @access    Public
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse("Vui lòng cung cấp email và mật khẩu", 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Thông tin đăng nhập không hợp lệ", 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Thông tin đăng nhập không hợp lệ", 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc      Lấy thông tin người dùng hiện tại
// @route     GET /api/users/me
// @access    Private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Cập nhật thông tin người dùng
// @route     PUT /api/users/me
// @access    Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    fullName: req.body.fullName,
    phone: req.body.phone,
    location: req.body.location,
    currentPosition: req.body.currentPosition,
    yearsOfExperience: req.body.yearsOfExperience,
    education: req.body.education,
    bio: req.body.bio,
    website: req.body.website,
    isAvailableForWork: req.body.isAvailableForWork,
    skills: req.body.skills,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Lưu công việc
// @route     PUT /api/users/save-job/:jobId
// @access    Private
exports.saveJob = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Kiểm tra nếu đã lưu công việc này
  if (user.savedJobs.includes(req.params.jobId)) {
    // Nếu đã lưu, xóa khỏi danh sách đã lưu
    user.savedJobs = user.savedJobs.filter(
      (job) => job.toString() !== req.params.jobId
    );
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Đã xóa công việc khỏi danh sách đã lưu",
      saved: false,
    });
  }

  // Nếu chưa lưu, thêm vào danh sách đã lưu
  user.savedJobs.push(req.params.jobId);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Đã lưu công việc",
    saved: true,
  });
});

// @desc      Lấy danh sách công việc đã lưu
// @route     GET /api/users/saved-jobs
// @access    Private
exports.getSavedJobs = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("savedJobs");

  res.status(200).json({
    success: true,
    count: user.savedJobs.length,
    data: user.savedJobs,
  });
});
