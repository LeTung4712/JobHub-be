const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  saveJob,
  getSavedJobs,
} = require("../controllers/userController");

const router = express.Router();

const { protect } = require("../middlewares/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/save-job/:jobId", protect, saveJob);
router.get("/saved-jobs", protect, getSavedJobs);

module.exports = router;
