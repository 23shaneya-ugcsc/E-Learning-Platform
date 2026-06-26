const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  status: { type: String, enum: ["enrolled", "completed"], default: "enrolled" },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model("StudentProgress", progressSchema);
