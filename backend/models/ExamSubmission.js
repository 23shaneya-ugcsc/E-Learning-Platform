const mongoose = require("mongoose");

const examSubmissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment" },
    answers: [Number],
    score: Number,
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Pro", examSubmissionSchema);
