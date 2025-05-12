const jwt = require("jsonwebtoken");

// Tạo JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Gửi token response kèm cookie
const sendTokenResponse = (user, statusCode, res) => {
  // Tạo token
  const token = generateToken(user);

  // Thiết lập options cho cookie
  const options = {
    expires: new Date(
      Date.now() +
        (parseInt(process.env.JWT_COOKIE_EXPIRE) || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Thêm secure flag nếu là môi trường production
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};

// Trích xuất token từ request
const getTokenFromRequest = (req) => {
  let token;

  // Kiểm tra header authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Kiểm tra cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  return token;
};

module.exports = {
  generateToken,
  sendTokenResponse,
  getTokenFromRequest,
};
