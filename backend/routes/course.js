const express = require("express");
const router = express.Router();
const multer = require("multer");
const Course = require("../models/Course");
const path = require("path");

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/videos/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Upload video
router.post("/:courseId/add-video-file", upload.single("video"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).send("Course not found");

    const video = {
      title: req.body.title || req.file.originalname,
      url: `/uploads/videos/${req.file.filename}`
    };

    course.videos.push(video);
    await course.save();

    res.json(video); // return video object
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error while uploading video");
  }
});

module.exports = router;
