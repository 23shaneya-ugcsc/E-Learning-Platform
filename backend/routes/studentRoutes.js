const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Course = require("../models/Course");

// --------------------- FIXED ROUTES ----------------------

// Get student by ID
router.get("/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

// Enroll
router.post("/enroll", async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.enrolledCourses.push({
      courseId,
      courseTitle: course.title
    });

    await student.save();

    res.json({ message: "Course Enrolled Successfully!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Mark course completed
router.post("/:id/complete-course", async (req, res) => {
  const { id } = req.params;
  const { courseId, courseName } = req.body;

  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const exists = student.completedCourses.some(c => c.courseId === courseId);
    if (!exists) {
      student.completedCourses.push({ courseId, courseName });
      await student.save();
    }

    res.json({ message: "Course added", student });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ KEEP THESE AT BOTTOM ------------------

// Get profile
router.get("/profile/:email", async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.params.email })
      .populate("enrolledCourse.courseId");

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch student profile" });
  }
});

// Update profile
router.put("/profile/update/:email", async (req, res) => {
  try {
    const { name, email } = req.body;

    const updated = await Student.findOneAndUpdate(
      { email: req.params.email },
      { name, email },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Student not found" });

    res.json(updated);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get enrolled & completed courses
router.post("/:id/complete-course", async (req, res) => {
  const { id } = req.params;
  const { courseId, courseName } = req.body;

  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Convert ObjectId to string for matching
    const exists = student.completedCourses.some(
      c => String(c.courseId) === String(courseId)
    );

    if (!exists) {
      student.completedCourses.push({
        courseId,
        courseName
      });
      await student.save();
    }

    res.json({ message: "Course completed added!", student });
  } catch (err) {
    console.error("Error completing course:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
