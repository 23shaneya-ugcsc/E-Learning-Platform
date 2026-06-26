const Assessment = require("../models/Assessment");

// Save new assessment
exports.createAssessment = async (req, res) => {
  try {
    const { courseId, staffId, title, questions } = req.body;
    const assess = await Assessment.create({ courseId, staffId, title, questions });
    res.json({ success: true, assessment: assess });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error creating assessment" });
  }
};

// Get assessments by course (for students)
exports.getAssessmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const assessments = await Assessment.find({ courseId });
    res.json(assessments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching assessments" });
  }
};

// Get assessments by staff (for staff dashboard view)
exports.getAssessmentsByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const assessments = await Assessment.find({ staffId });
    res.json(assessments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching assessments" });
  }
};
