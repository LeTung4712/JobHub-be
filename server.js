const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorMiddleware = require("./middlewares/error");
const path = require("path");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set security headers
app.use(helmet());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount routers
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// Custom error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Socket.io setup for real-time messaging
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join personal room
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  });

  // Handle private messages
  socket.on("privateMessage", ({ from, to, message }) => {
    io.to(to).emit("newMessage", {
      from,
      message,
    });
  });

  // Handle notifications
  socket.on("notification", ({ to, notification }) => {
    io.to(to).emit("newNotification", notification);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
