const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  enrolledCourse: {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    completedVideos: [{ type: String }],
    progress: { type: Number, default: 0 },
    status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" }
  }
});

module.exports = mongoose.model("Student", studentSchema);
