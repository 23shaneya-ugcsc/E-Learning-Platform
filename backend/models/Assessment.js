const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: Number, required: true } // index of correct option
});

const assessmentSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ இது சரி
    title: { type: String, required: true },
  staffId: { type: String, required: true },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },

  score: { type: Number, default: 0 },
timeTaken: { type: Number, default: 0 }

});



module.exports = mongoose.model("Assessment", assessmentSchema);
