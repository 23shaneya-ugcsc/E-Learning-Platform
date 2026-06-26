const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: String,
  email: String,
  username: String,
  phone: String,
  dob: String,
  gender: String,
  role: { type: String, default: "student" },
  password: String,
  status: { type: String, enum: ["active", "removed"], default: "active" },
  videoProgress: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      watched: { type: Boolean, default: false }
    }
  ]
});

module.exports = mongoose.model("User", userSchema);
