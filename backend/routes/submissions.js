const express = require("express");
const router = express.Router();
const Pro = require("../models/ExamSubmission"); // your model
const Assessment = require("../models/Assessment");

router.post("/", async (req, res) => {
    try {
        const { studentId, courseId, assessmentId, answers } = req.body;

        const assessment = await Assessment.findById(assessmentId);

        let score = 0;

        assessment.questions.forEach((q, i) => {
            if (answers[i] === q.answer) score++;
        });

        const submission = await Pro.create({
            userId: studentId,
            courseId,
            assessmentId,
            answers,
            score
        });

        res.json({ success: true, score, submission });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
