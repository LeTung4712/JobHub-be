const express = require("express");
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  downloadCV,
  updateJobStatus
} = require("../controllers/jobController");

const router = express.Router();

const { protect } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Sử dụng single để chỉ xử lý 1 file với field name là 'cv'
router.route("/").get(getJobs).post(protect, upload.single("cv"), createJob);
router.route("/my-jobs").get(protect, getMyJobs);
router.route("/download-cv/:fileId").get(protect, downloadCV);
router.route("/:id/status").patch(protect, updateJobStatus);
router
  .route("/:id")
  .get(getJob)
  .put(protect, upload.single("cv"), updateJob)
  .delete(protect, deleteJob);

module.exports = router;
