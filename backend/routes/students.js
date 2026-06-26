const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');

// ✅ Enroll a user in a course
router.post('/:userId/enroll/:courseId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const course = await Course.findById(req.params.courseId);

    if (!user || !course) return res.status(404).json({ message: "User or course not found" });

    // Add user to course.students if not already
    if (!course.students.includes(user._id)) {
      course.students.push(user._id);
      await course.save();
    }

    // Add course to user.enrolledCourses (if you keep it)
    if (!user.enrolledCourses) user.enrolledCourses = [];
    if (!user.enrolledCourses.includes(course._id)) {
      user.enrolledCourses.push(course._id);
      await user.save();
    }

    res.json({ message: "✅ Student enrolled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
