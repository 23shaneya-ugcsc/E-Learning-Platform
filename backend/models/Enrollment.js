const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fullName: String,
  dob: String,
  school: String,
  email: String,
  password: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },

  status: { type: String, enum: ["enrolled", "completed"], default: "enrolled" },
  completedAt: { type: Date }

});

module.exports = mongoose.model("Enrollment", enrollmentSchema);
