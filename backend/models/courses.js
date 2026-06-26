const express = require("express");
const router = express.Router();
const Course = require("../models/Course");

// ✅ GET all courses (WITH teacher name)
router.get("/courses", async (req, res) => {
  const courses = await Course.find()
    .populate("teacher", "name email");

  res.json(courses);
});

// ✅ GET chart data
router.get("/courses/enrollments", async (req, res) => {
  const courses = await Course.find()
    .populate("teacher", "name");

  res.json(courses);
});

// ✅ ADD course
router.post("/courses", async (req, res) => {
  try {
    const { title, description, teacher } = req.body;

    const course = new Course({
      title,
      description,
      teacher
    });

    await course.save();
    res.json({ message: "Course added" });

  } catch (err) {
    res.status(500).json({ message: "Error adding course" });
  }
});

// ✅ UPDATE course
router.put("/courses/:id", async (req, res) => {
  try {
    const { title, description } = req.body;

    await Course.findByIdAndUpdate(req.params.id, {
      title,
      description
    });

    res.json({ message: "Updated successfully" });

  } catch {
    res.status(500).json({ message: "Update failed" });
  }
});

// ✅ GET students in course
router.get("/courses/:id/students", async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("students", "name email");

  res.json(course.students || []);
});

module.exports = router;