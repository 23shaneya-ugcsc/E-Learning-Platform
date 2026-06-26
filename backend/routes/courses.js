const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

/* ==============================
   Multer Setup for Image Upload
================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure "uploads" folder exists in your root
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

/* ==============================
   1. Add new course (Admin)
================================ */
router.post("/", async (req, res) => {
  try {
    const { title, description, teacher } = req.body;

    if (!title || !description || !teacher)
      return res.status(400).json({ message: "Fill all fields" });

    const course = new Course({ title, description, teacher });
    await course.save();
    res.status(201).json({ message: "Course added!", course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



/* ==============================
   2. Get all courses
================================ */
/* ==========================================================
   ✅ 2. Get all courses (FIXED: Table-க்கு Live Count எடுக்கும்)
========================================================== */
router.get("/", async (req, res) => {
    try {
      // 1. அனைத்து கோர்ஸ் விவரங்களையும் பெறுகிறது
      const courses = await Course.find().lean(); 
  
      // 2. Enrollment Collection-லிருந்து Live Count-ஐ எடுக்கிறது (Chart-க்கு எடுத்த அதே Aggregation)
      const enrollmentCounts = await Enrollment.aggregate([
        { $match: { courseId: { $ne: null } } }, // பிழைகளைத் தவிர்க்க
        { $group: { _id: "$courseId", studentsEnrolled: { $sum: 1 } } }
      ]);
  
      // 3. கோர்ஸ் ID-ஐப் பயன்படுத்தி எண்ணிக்கையை விரைவாகப் பார்க்க Map உருவாக்குகிறது
      const enrollmentMap = new Map(enrollmentCounts.map(item => [item._id.toString(), item.studentsEnrolled]));
  
      // 4. கோர்ஸ் டேட்டாவுடன் Live Count-ஐ இணைத்து அனுப்புகிறது
      const finalCourses = courses.map(course => {
        // Enrollment count-ஐ Database-இல் உள்ள static value-க்கு பதிலாக, Live count-ஐ பயன்படுத்துகிறது
        course.studentsEnrolled = enrollmentMap.get(course._id.toString()) || 0;
        return course;
      });
  
      res.json(finalCourses);
    } catch (err) {
      console.error("Error fetching courses with live count:", err);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

/* ==============================
   3. Get courses assigned to a teacher
================================ */
/* ==========================================================
   ✅ 3. Get courses assigned to a teacher (Live Count-உடன்)
========================================================== */


/* ==============================
   4. Get Enrollments
================================ */
/* ===================================================================
    ✅ 4. GET /enrollments (Chart Aggregation Logic) - பிழை சரி செய்யப்பட்டது
=================================================================== */
router.get("/enrollments", async (req, res) => { 
      try {
        const courses = await Course.find({}, "_id title");
        
        // 2. Enrollment Collection-ஐப் பயன்படுத்தி, கோர்ஸ் ID வாரியாக மாணவர் எண்ணிக்கையைச் சேகரிக்கிறது
        const enrollmentCounts = await Enrollment.aggregate([
          // 👇 இந்த வரியைச் சேர்க்கவும்: null courseId-ஐத் தவிர்க்கிறது
          { $match: { courseId: { $ne: null } } }, 
          { $group: { _id: "$courseId", studentsEnrolled: { $sum: 1 } } }
        ]);
    
        const courseMap = new Map(enrollmentCounts.map(item => [item._id.toString(), item.studentsEnrolled]));
    
        const data = courses.map(course => ({
          title: course.title,
          studentsEnrolled: courseMap.get(course._id.toString()) || 0 
        }));
        
        res.json(data);
      } catch (err) { 
        console.error("❌ Chart-க்கான Enrollment தரவை எடுப்பதில் பிழை:", err.message);
        res.status(500).json({ error: "Failed to fetch enrollments for chart" }); 
      }
    });

  /* ==========================================================
    ✅ NEW: GET /total-enrollments (Total Count மட்டும் தரும்)
========================================================== */
router.get("/total-enrollments", async (req, res) => {
  try {
      const count = await Enrollment.countDocuments({});
      res.json({ total: count });
  } catch (err) {
      console.error("❌ Error fetching total enrollment count:", err.message);
      res.status(500).json({ error: "Failed to fetch total enrollments" });
  }
});

router.get("/staff/:name", async (req, res) => {
  try {
    const teacherName = req.params.name.trim(); // remove extra spaces

    console.log("Fetching courses for teacher:", teacherName);

    // 1️⃣ Find all courses assigned to this teacher (case-insensitive)
    const courses = await Course.find({
      teacher: { $regex: new RegExp(`^${teacherName}$`, "i") } 
    }).lean();

    if (!courses.length) {
      return res.status(404).json({ message: "No courses found for this teacher." });
    }

    // 2️⃣ Get live enrollment counts for these courses only
    const courseIds = courses.map(course => course._id);

    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } }, // only this teacher's courses
      { $group: { _id: "$courseId", studentsEnrolled: { $sum: 1 } } }
    ]);

    // 3️⃣ Map courseId -> studentsEnrolled
    const enrollmentMap = new Map(enrollmentCounts.map(item => [item._id.toString(), item.studentsEnrolled]));

    // 4️⃣ Attach live counts to courses
    const finalCourses = courses.map(course => {
      course.studentsEnrolled = enrollmentMap.get(course._id.toString()) || 0;
      return course;
    });

    res.json(finalCourses);

  } catch (err) {
    console.error("Error fetching teacher courses:", err);
    res.status(500).json({ error: "Failed to fetch teacher courses" });
  }
});

/* ==============================
   5. Get single course by ID
================================ */
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

/* ==============================
   6. Edit a course (with image upload)
================================ */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, teacher, duration, topics } = req.body;
    const updateData = { title, teacher, duration, topics };

    // If new image is uploaded
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(updatedCourse);
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ error: "Failed to update course" });
  }
});

router.post("/:courseId/enroll", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId, fullName, email } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found." });

    // Check if user is already enrolled
    const existing = await Enrollment.findOne({ userId, courseId });
    if (existing) {
      return res.status(200).json({ message: "✅ Already enrolled in this course!" });
    }

    // Create new enrollment
    const enrollment = new Enrollment({
      userId,
      courseId,
      fullName,
      email,
      enrolledAt: new Date(),
    });
    await enrollment.save();

    // ✅ Increment studentsEnrolled in the course
    course.studentsEnrolled = (course.studentsEnrolled || 0) + 1;
    await course.save();

    res.status(200).json({ 
      message: "✅ Enrolled successfully!", 
      studentsEnrolled: course.studentsEnrolled 
    });
  } catch (err) {
    console.error("Enrollment error:", err);
    res.status(500).json({ message: "❌ Enrollment failed!" });
  }
});



module.exports = router;
