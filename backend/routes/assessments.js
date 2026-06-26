// routes/assessments.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ Ensure Assessment model
// ✅ Ensure Assessment model
let Assessment;
try {
  Assessment = require("../models/Assessment");
} catch (err) {
  // 🛑 FIX 1: Assessment Schema Redefinition - Remove this section if models/Assessment.js is guaranteed to exist and be correct.
  // In real scenario, only the try block should be enough.
  const assessmentSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Changed to ObjectId
// ... (rest of schema)
  });
  Assessment = mongoose.models.Assessment || mongoose.model("Assessment", assessmentSchema);
}

/* ------------------ STAFF SIDE ------------------ */

// ✅ Create assessment (staff adds questions)
router.post("/", async (req, res) => {
  try {
    const { courseId, staffId, title, questions } = req.body;
    if (!courseId || !title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "Missing courseId, title or questions" });
    }

    const newA = new Assessment({ courseId, staffId, title, questions });
    const saved = await newA.save();
    res.json({ success: true, assessment: saved });
  } catch (err) {
    console.error("Error saving assessment:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Get assessments by staff (for staff dashboard)
// ✅ Get assessments by staff (for staff dashboard)
router.get("/staff/:staffId", async (req, res) => {
    try {
      const { staffId } = req.params;
      
      // 🛑 முக்கிய மாற்றம்: staffId String-ஐ ObjectId ஆக மாற்றுதல்
      if (!mongoose.Types.ObjectId.isValid(staffId)) {
          return res.status(400).json({ success: false, message: "Invalid Staff ID format." });
      }
      
      // Assessment Model-ஐப் பயன்படுத்தும் இடங்களில் Mongoose-ஐ import செய்திருக்க வேண்டும் (server.js-ல் இருந்தால்).
      const assessments = await Assessment.find({ staffId: new mongoose.Types.ObjectId(staffId) }).sort({ createdAt: -1 });
  
      res.json({ success: true, assessments });
    } catch (err) {
      console.error("Error fetching staff assessments:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  

/* ------------------ STUDENT SIDE ------------------ */

// ✅ Get latest assessment for a course (for students)
router.get("/student/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid Course ID format." });
    }

    const assessment = await Assessment.findOne({ courseId: new mongoose.Types.ObjectId(courseId) }).sort({ createdAt: -1 });

    if (!assessment) {
      return res.json({ success: false, message: "No assessment found for this course." });
    }

    // Map questions to include a clear numeric correct index
    const questionsWithAnswerIndex = assessment.questions.map(q => ({
      question: q.question,
      options: q.options,
      answer: q.answer  // numeric index 0-3
    }));

    res.json({
      success: true,
      _id: assessment._id,
      title: assessment.title,
      questions: questionsWithAnswerIndex
    });
  } catch (err) {
    console.error("Error fetching student assessment:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


/* ------------------ ADMIN SIDE ------------------ */

// ✅ Get all assessments (admin)
router.get("/", async (req, res) => {
  try {
    const items = await Assessment.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("Error fetching assessments:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
