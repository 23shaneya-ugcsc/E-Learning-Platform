// routes/staff.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Get only admin courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ addedBy: 'admin' });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add PPT to admin course
router.post('/courses/:id/add-ppt', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).send("Course not found");
    if (course.addedBy !== 'admin') return res.status(403).send("You can only add PPTs/videos to admin courses");

    const { filename, url } = req.body;
    course.pptFiles.push({ filename, url });
    await course.save();
    res.send("PPT added successfully!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Add Video to admin course
router.post('/courses/:id/add-video', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).send("Course not found");
    if (course.addedBy !== 'admin') return res.status(403).send("You can only add videos to admin courses");

    const { videoId, title, url } = req.body;
    course.videos.push({ videoId, title, url });
    await course.save();
    res.send("Video added successfully!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET all staff
router.get("/staff", async (req, res) => {
  const staff = await User.find({ role: "staff" })
    .select("_id name");

  res.json(staff);
});

module.exports = router;
