const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const { getTokenFromRequest } = require("../utils/jwtToken");

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  // Lấy token từ request
  const token = getTokenFromRequest(req);

  // Make sure token exists
  if (!token) {
    return next(
      new ErrorResponse("Không được phép truy cập vào route này", 401)
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(
      new ErrorResponse("Không được phép truy cập vào route này", 401)
    );
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Role ${req.user.role} không được phép truy cập vào route này`,
          403
        )
      );
    }
    next();
  };
};
