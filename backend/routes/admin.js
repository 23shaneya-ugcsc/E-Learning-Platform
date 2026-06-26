const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

router.post('/add-course', async (req, res) => {
  try {
    const { title, description, image, teacher } = req.body;

    if (!teacher) {
      return res.status(400).json({ message: "Teacher is required" });
    }

    const newCourse = new Course({
      title,
      description,
      image,
      teacher,        // 👈 STAFF ID here
      addedBy: 'admin'
    });

    await newCourse.save();

    res.status(201).json({ message: "✅ Course added & assigned to staff!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
