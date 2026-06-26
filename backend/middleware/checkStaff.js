const User = require("../models/User");

async function checkStaff(req, res, next) {
  try {
    const staffId = req.body.staffId; // from frontend or JWT
    if (!staffId) return res.status(400).json({ message: "Staff ID missing" });

    const user = await User.findById(staffId);
    if (!user || user.role !== "staff") {
      return res.status(403).json({ message: "Only staff can perform this action" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error in middleware" });
  }
}

module.exports = checkStaff;
