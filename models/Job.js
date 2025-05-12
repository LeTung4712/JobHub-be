const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Vui lòng nhập tiêu đề công việc"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Vui lòng nhập địa điểm làm việc"],
    },
    salary: {
      type: String,
    },
    salaryMin: {
      type: Number,
      min: 0,
    },
    salaryMax: {
      type: Number,
      min: 0,
    },
    category: {
      type: String,
      required: [true, "Vui lòng chọn lĩnh vực"],
    },
    type: {
      type: String,
      required: [true, "Vui lòng chọn loại hình công việc"],
    },
    experience: {
      type: String,
    },
    description: {
      type: String,
      required: [true, "Vui lòng nhập mô tả công việc"],
    },
    requirements: [
      {
        type: String,
      },
    ],
    benefits: [
      {
        type: String,
      },
    ],
    deadline: {
      type: Date,
    },
    postType: {
      type: String,
      enum: ["hiring", "seeking"],
      default: "hiring",
    },
    status: {
      type: String,
      enum: ["active", "expired", "draft", "paused"],
      default: "active",
    },
    views: {
      type: Number,
      default: 0,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cvFile: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
jobSchema.index({ author: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ postType: 1 });
jobSchema.index(
  {
    title: "text",
    description: "text",
  },
  {
    weights: {
      title: 3,
      description: 1,
    },
  }
);

module.exports = mongoose.model("Job", jobSchema);
