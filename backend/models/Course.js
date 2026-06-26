const mongoose = require("mongoose");

const pptSchema = new mongoose.Schema({
  filename: String,
  url: String,
  uploadedAt: { type: Date, default: Date.now }
});

const videoSchema = new mongoose.Schema({
  title: String,
  url: String,
  uploadedAt: { type: Date, default: Date.now }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  image: { type: String, default: "uploads/default-course.png" },

  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  pptFiles: [pptSchema],
  videos: [videoSchema],

  addedBy: { type: String, enum: ["admin", "staff"], default: "admin" },

  // ✅ FIXED TEACHER FIELD
  teacher: {
    type: String,
    ref: "User",
    required: true
  },

  duration: { type: String, default: "" },
  topics: [{ type: String }]

}, { timestamps: true });

// ✅ Virtual student count
courseSchema.virtual("studentsCount").get(function () {
  return this.students ? this.students.length : 0;
});

courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Course", courseSchema);