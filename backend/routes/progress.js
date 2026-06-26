const express = require("express");
const router = express.Router();
const StudentProgress = require("../models/StudentProgress");

// Add / Update progress
router.post("/update", async (req, res) => {
  try {
    const { userId, courseId, status } = req.body;

    let progress = await StudentProgress.findOne({ userId, courseId });

    if (!progress) {
      progress = new StudentProgress({ userId, courseId, status });
    } else {
      progress.status = status;
      if (status === "completed") progress.completedAt = new Date();
    }

    await progress.save();
    res.json({ success: true, progress });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch all courses (enrolled + completed) for a student
router.get("/:userId", async (req, res) => {
  try {
    const data = await StudentProgress.find({ userId: req.params.userId })
      .populate("courseId");

    res.json({ success: true, data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
