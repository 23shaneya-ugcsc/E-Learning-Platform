
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Pro = require("../models/ExamSubmission");
const Assessment = require("../models/Assessment");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

router.post("/", async (req, res) => {
  try {
    const { studentId, courseId, assessmentId, answers } = req.body;

    // Validate required fields
    if (
      !studentId ||
      !courseId ||
      !assessmentId ||
      !Array.isArray(answers)
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing submission fields"
      });
    }

    // Validate MongoDB IDs
    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(assessmentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student, course or assessment ID"
      });
    }

    // Find student
    const student = await User.findById(studentId);

    if (!student || student.role !== "student") {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      userId: studentId,
      courseId: courseId
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course"
      });
    }

    // Find course
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check video progress
    const totalVideos = course.videos.length;

    const progress = student.videoProgress.find(
      p => String(p.courseId) === String(courseId)
    );

    const courseVideoIds = new Set(
      course.videos.map(video => String(video._id))
    );

    const watchedVideoIds = new Set(
      (progress?.watchedVideos || [])
        .map(id => String(id))
        .filter(id => courseVideoIds.has(id))
    );

    const completedVideos = watchedVideoIds.size;

    const progressPercentage = totalVideos > 0
      ? (completedVideos / totalVideos) * 100
      : 0;

    // Assessment requires MORE than 90%
    if (progressPercentage <= 90) {
      return res.status(403).json({
        success: false,
        message: "Complete more than 90% of course videos to unlock assessment",
        progressPercentage
      });
    }

    // Find assessment
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found"
      });
    }

    // Verify assessment belongs to this course
    if (String(assessment.courseId) !== String(courseId)) {
      return res.status(403).json({
        success: false,
        message: "This assessment does not belong to the selected course"
      });
    }

    // Check duplicate submission
    const existingSubmission = await Pro.findOne({
      userId: studentId,
      courseId: courseId,
      assessmentId: assessmentId
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this assessment"
      });
    }

    // Validate answer count
    if (answers.length !== assessment.questions.length) {
      return res.status(400).json({
        success: false,
        message: "Answer count does not match the assessment questions"
      });
    }

    // Validate each answer
    const validAnswers = answers.every((answer, index) => {
      return (
        Number.isInteger(answer) &&
        answer >= -1 &&
        answer < assessment.questions[index].options.length
      );
    });

    if (!validAnswers) {
      return res.status(400).json({
        success: false,
        message: "Invalid answer option"
      });
    }

    // Calculate score on backend
    let score = 0;

    assessment.questions.forEach((question, index) => {
      if (answers[index] === question.answer) {
        score++;
      }
    });

    const totalQuestions = assessment.questions.length;
    const percentage = totalQuestions > 0
      ? (score / totalQuestions) * 100
      : 0;

    // Save submission
    const submission = await Pro.create({
      userId: studentId,
      courseId,
      assessmentId,
      answers,
      score
    });

    res.json({
      success: true,
      message: "Assessment submitted successfully",
      score,
      totalQuestions,
      percentage: Number(percentage.toFixed(2)),
      passed: percentage >= 60,
      submission
    });

  } catch (err) {
    console.error("Assessment submission error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to submit assessment",
      error: err.message
    });
  }
});

module.exports = router;
