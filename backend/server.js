const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const assessmentRoutes = require("./routes/assessments");
const courseRoutes = require("./routes/courses");
const submissionRoutes = require("./routes/submissions");


// const studentRoutes = require("./routes/studentRoutes"); // ✅ keep only this one


const app = express();
app.use(cors());
app.use(express.json());
const router = express.Router();


// Serve uploads folder
app.use("/uploads", express.static("uploads"));

// Routers
app.use("/api/assessments", assessmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/submissions", submissionRoutes);

// Models
const Enrollment = require("./models/Enrollment");
const Course = require("./models/Course");
const User = require("./models/User");
const Student = require("./models/Student");
const Assessment = require("./models/Assessment");
const Pro = require("./models/ExamSubmission");



// Routes

// ... (Your existing models: Enrollment, Course, User, Student, Assessment)

/* ==============================
    ✅ NEW: Submission Model Schema (Server.js-ல் வரையறுக்கப்படுகிறது)
================================*/
const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
  answers: { type: [Number], required: true },
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
});

const Submission = mongoose.model("Submission", submissionSchema); // Submission model-ஐ இங்கே உருவாக்கவும்
// const studentRoutes = require("./routes/students");

const __dirnameFull = __dirname;

/* ==============================
   CONNECT TO MONGO
================================*/
mongoose.connect(
  "mongodb+srv://shaneya:SHANEYA@cluster0.15fz8.mongodb.net/?appName=Cluster0",
  { serverSelectionTimeoutMS: 30000 }
)
.then(async () => {
  console.log("✅ MongoDB connected");

  // 🌱 Run seeds only AFTER connection is ready
  await seedPredefinedUsers();
  await seedCourses();
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

mongoose.connection.on("disconnected", () => console.warn("⚠️ MongoDB disconnected"));


/* ==============================
   SEED DEMO COURSES
================================*/
async function seedCourses() {
  try {
    const count = await Course.countDocuments();
    if (count === 0) {
      await Course.insertMany([
        { 
          title: "Node.js Fundamentals", 
          description: "Learn the basics of Node.js and backend development.",
          image: "/uploads/default-course.png",
          studentsEnrolled: 0,
          pptFiles: [],
          videos: [],
          addedBy: "admin"
        },
        { 
          title: "HTML & CSS for Beginners", 
          description: "Start building web pages with HTML and CSS.",
          image: "/uploads/default-course.png",
          studentsEnrolled: 0,
          pptFiles: [],
          videos: [],
          addedBy: "admin"
        }
      ]);
      console.log("✅ Demo courses seeded");
    }
  } catch (err) {
    console.error("❌ Error seeding courses:", err.message);
  }
}
seedCourses();

/* ==============================
   PREDEFINED USERS
================================*/
async function seedPredefinedUsers() {
  const users = [
    { username: "Shaneya", password: "shaneya", role: "admin", fullname: "Shaneya", email: "shaneya@example.com" },
    { username: "navya", password: "navya", role: "staff", fullname: "Navya", email: "navya@example.com" },
    { username: "kavya", password: "kavya", role: "staff", fullname: "Kavya", email: "kavya@example.com" }
  ];

  for (const u of users) {
    let exists = await User.findOne({ username: u.username });

    const hashedPassword = await bcrypt.hash(u.password, 10);

    if (!exists) {
      // CREATE new user
      const newUser = new User({
        username: u.username,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        fullname: u.fullname,
        status: "active"
      });

      await newUser.save();
      console.log(`✅ Created user: ${u.username}`);
    } else {
      // UPDATE password + details
      exists.password = hashedPassword;
      exists.fullname = u.fullname;
      exists.email = u.email;
      exists.role = u.role;
      exists.status = "active";

      await exists.save();
      console.log(`🔄 Updated existing user: ${u.username}`);
    }
  }
}

seedPredefinedUsers();


/* ==============================
   ROUTES
================================*/
// app.use("/api/students", studentRoutes);

// Register student
app.post("/api/register", async (req, res) => {
  try {
    const { fullname, email, username, phone, dob, gender, password } = req.body;
    if (!fullname || !email || !username || !phone || !dob || !gender || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullname, email, username, phone, dob, gender, role: "student", password: hashedPassword, status: "active" });
    await newUser.save();

    res.json({ message: "Registered successfully! You can login now." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    res.json({
      message: "Login successful!",
      role: user.role,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==============================
   COURSES & ENROLLMENT
================================*/
app.get("/api/courses", async (req, res) => {
    try { res.json(await Course.find()); } // ✅ இதுதான் சரியாக உள்ளது!
    catch (err) { res.status(500).json({ message: "Error fetching courses" }); }
  });
  
  // இந்த API-யை நீங்கள் பயன்படுத்தினால் அதுவும் சரியாகவே வேலை செய்யும்
  // server.js - இல் உள்ள Course/Enrollments API-ஐ இதனுடன் மாற்றவும்
/* ===================================================================
    ✅ ADMIN: GET ENROLLMENTS FOR CHART (Reads live count from Enrollment Model)
    Aggregation pipeline - Enrollment கலெக்ஷனில் இருந்து நேரடி எண்ணிக்கையை எடுக்கும்
=================================================================== */
// server.js - இல் உள்ள Course/Enrollments API-ஐ இதனுடன் மாற்றவும்
/* ===================================================================
    ✅ ADMIN: GET ENROLLMENTS FOR CHART (Reads live count from Enrollment Model)
=================================================================== */

app.get("/api/courses/enrollments", async (req, res) => { 
      try {
        const courses = await Course.find({}, "_id title");
        
        // Enrollment கலெக்ஷனில் இருந்து Count எடுக்கிறது!
        const enrollmentCounts = await Enrollment.aggregate([
          { $group: { _id: "$courseId", studentsEnrolled: { $sum: 1 } } }
        ]);
    
        const courseMap = new Map(enrollmentCounts.map(item => [item._id.toString(), item.studentsEnrolled]));
    
        const data = courses.map(course => ({
          title: course.title,
          studentsEnrolled: courseMap.get(course._id.toString()) || 0 
        }));
        
        res.json(data);
      } catch (err) { 
        console.error("❌ Error fetching enrollment data for chart:", err.message);
        res.status(500).json({ error: "Failed to fetch enrollments for chart" }); 
      }
    });


/* ==============================
   ✅ ADMIN: FETCH ALL ENROLLMENTS WITH STUDENT & COURSE INFO
================================*/
app.get("/api/enrollments", async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate("courseId", "title description")  // course details
      .populate("userId", "fullname email username"); // student details

    res.json(enrollments);
  } catch (err) {
    console.error("❌ Error fetching enrollments:", err.message);
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

app.get("/api/courses/:id/students", async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ courseId: req.params.id })
      .populate("userId", "fullname username name email");
    
    // Convert to plain list of students with fallback name field
    const students = enrollments.map(e => {
      const u = e.userId || {};
      return {
        name: u.fullname || u.username || u.name || "Unknown",
        email: u.email || "—"
      };
    });

    res.json(students);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ error: "Failed to load students" });
  }
});


// ✅ EDIT COURSE (Admin)
app.put("/api/courses/:id", async (req, res) => {
  try {
    const { title, description } = req.body;
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true }
    );
    res.json(updatedCourse);
  } catch (err) {
    console.error("❌ Error updating course:", err.message);
    res.status(500).json({ error: "Failed to update course" });
  }
});



/* ==============================
   STATIC FILES
================================*/
app.use("/uploads", express.static(path.join(__dirnameFull, "uploads")));
app.use(express.static(path.join(__dirnameFull, "../frontend")));

/* ==============================
   COURSE MANAGEMENT (Admin + Staff)
================================*/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others";
    if (file.fieldname === "ppt") folder = "uploads/ppt";
    if (file.fieldname === "video") folder = "uploads/videos";
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Add/Update/Delete course, PPT, Video (keep your existing code, no changes)

// Add new course
app.post("/api/courses", upload.fields([{ name: "ppt" }, { name: "video" }]), async (req, res) => {
  try {
    const { title, description, teacher, image } = req.body;
    const ppt = req.files?.ppt ? "/uploads/ppt/" + req.files.ppt[0].filename : null;
    const video = req.files?.video ? "/uploads/videos/" + req.files.video[0].filename : null;

    const newCourse = new Course({
      title,
      description,
      teacher,
      image: image || "/uploads/default-course.png",
      ppt,
      video,
      studentsEnrolled: 0,
      addedBy: "admin"
    });
    await newCourse.save();
    res.json(newCourse);
  } catch (err) {
    res.status(500).json({ error: "Failed to add course" });
  }
});

// Update course
app.put("/api/courses/:id", async (req, res) => {
  try {
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update course" });
  }
});

// Delete course
app.delete("/api/courses/:id", async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete course" });
  }
});

/* ==============================
   STAFF DASHBOARD SUPPORT
================================*/
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/staff/courses", async (req, res) => {
  try {
    const courses = await Course.find(); // ✅ show all courses
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching courses" });
  }
});

// Upload PPT file
// Upload PPT file (from staff-dashboard.html)
app.post("/api/courses/:id/add-ppt-file", upload.single("ppt"), async (req, res) => {
  try {

    // 1️⃣ File actually received-a?
    if (!req.file) {
      return res.status(400).json({ error: "No file received! Field name must be 'ppt'" });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // 2️⃣ Save PPT details in DB
    const newPPT = {
      filename: req.file.originalname,
      url: `/uploads/ppt/${req.file.filename}`,
      _id: Date.now().toString() // frontend needs an _id
    };

    // Create array if doesn't exist
    if (!course.ppts) course.ppts = [];

    course.ppts.push(newPPT);
    await course.save();

    // 3️⃣ Send clean response to frontend
    res.json({
      message: "PPT uploaded successfully",
      ...newPPT
    });

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload Video file (from staff-dashboard.html)
app.post("/api/courses/:id/add-video-file", upload.single("video"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).send("Course not found");

    course.videos.push({
      title: req.body.title || req.file.originalname,
      url: `/uploads/videos/${req.file.filename}`
    });

    await course.save();
    res.send("✅ Video uploaded successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading video");
  }
});


// DELETE PPT
app.delete("/staff/courses/:courseId/ppts/:pptId", async (req, res) => {
  const { courseId, pptId } = req.params;
  await Course.findByIdAndUpdate(courseId, {
    $pull: { ppts: { _id: pptId } }
  });
  res.json({ message: "PPT removed" });
});

// DELETE Video
app.delete("/staff/courses/:courseId/videos/:videoId", async (req, res) => {
  const { courseId, videoId } = req.params;
  await Course.findByIdAndUpdate(courseId, {
    $pull: { videos: { _id: videoId } }
  });
  res.json({ message: "Video removed" });
});

/* ==============================
   VIDEOS PAGE SUPPORT
================================*/

// GET user + enrolled course info
app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Assume one course per student (from Enrollment collection)
    const enrollment = await Enrollment.findOne({ userId: user._id });
    let course = null;
    let videoWatched = false;

    if (enrollment) {
      course = await Course.findById(enrollment.courseId);

      // Check if video watched already (track in User.videoProgress)
      const progress = user.videoProgress?.find(p => p.courseId.toString() === course._id.toString());
      videoWatched = progress ? progress.watched : false;
    }

    res.json({ user, course, videoWatched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// MARK video watched
app.put("/api/user/:id/video-watched/:courseId", async (req, res) => {
  try {
    const { id, courseId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.videoProgress) user.videoProgress = [];

    const index = user.videoProgress.findIndex(p => p.courseId.toString() === courseId);
    if (index !== -1) {
      user.videoProgress[index].watched = true;
    } else {
      user.videoProgress.push({ courseId, watched: true });
    }

    await user.save();
    res.json({ message: "✅ Video marked as watched" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get single course with all content (for students)


// Update student profile
app.put("/api/user/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    const { fullname, email, phone } = req.body;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.fullname = fullname || student.fullname;
    student.email = email || student.email;
    student.phone = phone || student.phone;

    await student.save();

    res.json({ message: "Profile updated", user: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// Mark video as watched
// Mark video as watched
app.post("/api/user/:id/progress", async (req, res) => {
  try {
    const studentId = req.params.id;
    const { courseId, videoId } = req.body;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!student.videoProgress) student.videoProgress = [];

    let courseProgress = student.videoProgress.find(p => p.courseId.toString() === courseId);
    if (!courseProgress) {
      courseProgress = { courseId, watchedVideos: [] };
      student.videoProgress.push(courseProgress);
    }

    if (!Array.isArray(courseProgress.watchedVideos)) {
      courseProgress.watchedVideos = [];
    }
    if (!courseProgress.watchedVideos.includes(videoId)) {
      courseProgress.watchedVideos.push(videoId);
    }
    
    await student.save();

    // Return updated progress count
    const course = await Course.findById(courseId);
    const completedVideos = courseProgress.watchedVideos.length;
    const totalVideos = course.videos.length;

    res.json({ message: "Progress updated", completedVideos, totalVideos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get student info + enrolled courses + video progress
// 1️⃣ Get a course by ID
// app.get("/api/courses/:id", async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.id);
//     if (!course) return res.status(404).json({ message: "Course not found" });
//     res.json(course);
//   } catch (err) {
//     console.error("❌ Error fetching course:", err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// 2️⃣ Get a student + enrolled course (use ?course=COURSE_ID in query)
app.get("/api/students/:id", async (req, res) => {
    try {
      const studentId = req.params.id;
      const student = await User.findById(studentId).lean();
      
      // ✅ FIX: If student not found, return 404
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      const enrollments = await Enrollment.find({ userId: studentId }).populate("courseId");
      const enrolledCourses = enrollments.map(e => {
        const course = e.courseId;
        if (!course) return null;
        const totalVideos = Array.isArray(course.videos) ? course.videos.length : 0;
        const progress = Array.isArray(student.videoProgress)
          ? student.videoProgress.find(p => p.courseId.toString() === course._id.toString())
          : null;
        const completedVideos = progress?.watchedVideos?.length || 0;
        return {
          _id: course._id.toString(),
          title: course.title || "Untitled Course",
          totalVideos,
          completedVideos,
          videos: course.videos || [],
          pptFiles: course.pptFiles || []
        };
      }).filter(c => c !== null);
  
      res.json({
        _id: student._id.toString(),
        name: student.fullname || "", // ✅ This provides the name for the frontend
        email: student.email || "",
        phone: student.phone || "",
        dob: student.dob || "",
        gender: student.gender || "",
        avatar: student.avatar || "",
        enrolledCourses
      });
  
    } catch (err) {
      console.error(err);
      // If there is a server error, send 500
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });
  
  /* ==============================
     ✅ GOAL 2: UPDATE STUDENT PROFILE (Edit My Profile)
  ================================*/
  app.put("/api/students/:id", async (req, res) => {
    try {
      const studentId = req.params.id;
      // Allow updating all relevant profile fields
      const { fullname, email, phone, dob, gender } = req.body;
  
      const student = await User.findByIdAndUpdate(
          studentId, 
          { fullname, email, phone, dob, gender }, 
          { new: true, runValidators: true }
      );
      
      if (!student) return res.status(404).json({ message: "Student not found" });
  
      res.json({ message: "Profile updated successfully!", user: student });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error during profile update", error: err.message });
    }
  });
/* ==============================
   STAFF-SPECIFIC COURSES
================================*/
// GET courses assigned to a specific staff by teacher name
app.get("/api/courses/staff/:teacher", async (req, res) => {
  try {
    const teacherName = req.params.teacher;
    if (!teacherName) return res.status(400).json({ message: "Teacher name required" });

    const courses = await Course.find({ teacher: teacherName });

    // Format response to include enrolled students count if needed
    const formatted = courses.map(c => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      duration: c.duration || "",
      topics: c.topics || [],
      studentsEnrolled: c.studentsEnrolled || 0,
      pptFiles: c.pptFiles || [],
      videos: c.videos || []
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching staff courses:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// app.put("/api/courses/:id", async (req, res) => {
//   try {
//     const { title, description } = req.body;
//     const course = await Course.findByIdAndUpdate(
//       req.params.id,
//       { title, description },
//       { new: true }
//     );
//     res.json(course);
//   } catch (err) {
//     res.status(500).json({ message: "Error updating course" });
//   }
// });


// GET courses assigned to a particular staff (e.g., Navya / Kavya)
app.get("/api/courses/staff/:staffName", async (req, res) => {
  try {
    const staffName = req.params.staffName;
    const courses = await Course.find({ assignedStaff: staffName });
    res.json(courses);
  } catch (error) {
    console.error("Error fetching staff courses:", error);
    res.status(500).json({ message: "Failed to fetch staff courses" });
  }
});


app.post("/api/courses/:id/add-video-file", async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  // example: check staff from auth middleware
  const staffName = req.user?.name;
  if (course.assignedStaff !== staffName) {
    return res.status(403).json({ message: "Not authorized to modify this course" });
  }

  // continue upload logic...
});

app.post("/api/courses", async (req, res) => {
  const { title, description, teacher } = req.body;
  const newCourse = new Course({ title, description, teacher });
  await newCourse.save();
  res.json(newCourse);
});


// app.put("/api/courses/:id", async (req, res) => {
//   try {
//     const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(updated);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error updating course");
//   }
// });


/* ==============================
    ✅ SUBMISSION ROUTE (Student Assessment Submission)
================================*/
// ==============================
// SUBMISSION ROUTE
// ==============================
app.post("/api/submissions", async (req, res) => {
  try {
    const { studentId, courseId, assessmentId, answers } = req.body;
    if (!studentId || !courseId || !assessmentId || !Array.isArray(answers))
      return res.status(400).json({ success:false, message: "Missing submission fields" });

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ success:false, message: "Assessment not found" });

    if (answers.length !== assessment.questions.length)
      return res.status(400).json({ success:false, message: "Answer count mismatch" });

    // Calculate score
    let score = 0;
    assessment.questions.forEach((q, idx) => {
      const correctIndex = q.answerIndex ?? getCorrectIndex(q); // fallback
      if (answers[idx] === correctIndex) score++;
    });

    // Prevent duplicate submissions
    const existing = await Submission.findOne({ studentId, assessmentId });
    if (existing) return res.status(409).json({ success:false, message:"Already submitted", score: existing.score });

    // Save submission
    await Submission.create({
      studentId,
      courseId,
      assessmentId,
      answers,
      score,
      totalQuestions: assessment.questions.length
    });

    res.json({ success:true, score, total: assessment.questions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, message:"Server error" });
  }
});

// Helper for fallback
function getCorrectIndex(q){
  if(q.correctIndex!==undefined) return q.correctIndex;
  if(q.answerIndex!==undefined) return q.answerIndex;
  if(q.answer && Array.isArray(q.options)) return q.options.indexOf(q.answer);
  return -1;
}

  
  // GET /api/assessments/staff/:staffId - Fetch all assessments created by a staff
  app.get("/api/assessments/staff/:staffId", async (req, res) => {
      try {
          const staffId = req.params.staffId;
          const assessments = await Assessment.find({ staffId: staffId }).select("title courseId createdAt");
          res.json({ success: true, assessments });
      } catch (err) {
          console.error("❌ Error fetching staff assessments:", err.message);
          res.status(500).json({ success: false, message: "Failed to fetch staff assessments." });
      }
  });


  /* ==============================
    ✅ UPDATE ASSESSMENT (PUT /api/assessments/:id)
================================*/
// app.put("/api/assessments/:id", async (req, res) => {
//   try {
//       const assessmentId = req.params.id;
//       const { title, questions } = req.body;
      
//       // Validation and ObjectId check
//       if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
//           return res.status(400).json({ success: false, message: "Invalid Assessment ID format." });
//       }
//       if (!title || !questions || questions.length === 0) {
//           return res.status(400).json({ success: false, message: "Missing title or questions data." });
//       }

//       // Assessment-ஐப் புதுப்பிக்கவும்
//       const updatedAssessment = await Assessment.findByIdAndUpdate(
//           assessmentId,
//           { title, questions, updatedAt: Date.now() },
//           { new: true } // புதுப்பிக்கப்பட்ட Document-ஐத் திரும்பப் பெற
//       );

//       if (!updatedAssessment) {
//           return res.status(404).json({ success: false, message: "Assessment not found to update." });
//       }

//       res.json({ success: true, message: "Assessment updated successfully.", assessment: updatedAssessment });
//   } catch (err) {
//       console.error("❌ Error updating assessment:", err.message);
//       res.status(500).json({ success: false, message: "Server error during update.", error: err.message });
//   }
// });

app.get('/api/courses/:courseId/enrollment-status', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.query;

    const existingEnrollment = await Enrollment.findOne({
      userId,
      courseId
    });

    if (existingEnrollment) {
      return res.json({ isEnrolled: true });
    }

    res.json({ isEnrolled: false });

  } catch (err) {
    console.error("Enrollment check error:", err);
    res.status(500).json({ isEnrolled: false });
  }
});

// app.post("/api/courses/:courseId/enroll", async (req, res) => {
//   try {
//     const { courseId } = req.params;
//     const { userId, fullName, email } = req.body;

//     const already = await Enrollment.findOne({ userId, courseId });
//     if (already) {
//       return res.status(400).json({ message: "You are already enrolled in this course!" });
//     }

//     await Enrollment.create({
//       userId,
//       fullName,
//       email,
//       courseId
//     });

//     res.json({ message: "Enrolled successfully!" });
//   } catch (err) {
//     console.error("Enroll Error:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

// // ✅ Route to get students enrolled in a course
// app.get("/api/courses/:id/students", async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.id)
//     .populate("students", "name email");
//         // Only required fields

//     if (!course) return res.status(404).json({ message: "Course not found" });

//     res.json(course.students || []);
//   } catch (err) {
//     console.error("Error loading students", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// ❌ இந்த API: Enrollment Model-ஐ உருவாக்கவில்லை!
app.post("/api/enroll", async (req, res) => {
    const { userId, courseId } = req.body;
    // Enrollment Model-ஐ உருவாக்காமல், நேரடியாக Course-ஐ அப்டேட் செய்கிறது
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { students: userId },
      $inc: { studentsEnrolled: 1 } // இந்த லாஜிக் கூட தவறாகப் போக வாய்ப்புள்ளது.
    });
    res.json({ success: true });
  });

// STUDENT ENROLL API
// ENROLL STUDENT
/* ==============================
    ✅ ENROLL STUDENT: FINAL WORKING API
================================*/
// app.post("/api/courses/:id/enroll", async (req, res) => {
//     try {
//       const courseId = req.params.id;
//       const { userId, fullName, email, dob, school } = req.body;
  
//       if (!userId || !fullName || !email) {
//         return res.status(400).json({ message: "Missing required fields" });
//       }
  
//       // Check for duplicate enrollment
//       const exists = await Enrollment.findOne({ userId, courseId });
//       if (exists) return res.status(400).json({ message: "Already enrolled" });
  
//       // 1. Save enrollment
//       await Enrollment.create({ userId, fullName, email, dob, school, courseId });
  
//       // 2. Update course students count (This is what updates the dashboard)
//       const count = await Enrollment.countDocuments({ courseId }); 
//       // count-ஐப் பயன்படுத்தி அப்டேட் செய்வதே மிகவும் பாதுகாப்பான முறை.
//       await Course.findByIdAndUpdate(courseId, { studentsEnrolled: count }); 
  
//       res.json({ message: "✅ Enrollment successful!", enrollment: { courseId, userId } });
//     } catch (err) { 
//       console.error("Enroll error:", err);
//       res.status(500).json({ message: "Server error" });
//     }
//   });


  /* ===================================================================
    ✅ POST /api/students/:userId/enroll/:courseId (Enrollment API)
    - கோர்ஸ் மற்றும் யூசர் ID-ஐ URL-ல் இருந்து பெறுகிறது.
    - Enrollment-ஐ உருவாக்குகிறது.
=================================================================== */
app.post("/api/students/:userId/enroll/:courseId", async (req, res) => {
            try {
              // ✅ 1. URL-இல் இருந்து userId மற்றும் courseId-ஐப் பெறுகிறது (req.params)
              const { userId, courseId } = req.params; 
  
              // ✅ 2. Enrollment செய்வதற்கு முன், மாணவர் விவரங்களை User Model-லிருந்து பெறுகிறது
              // User Model-இல் fullName மற்றும் email இருப்பதாகக் கருதுகிறோம்.
              const user = await User.findById(userId);
              if (!user) {
                  return res.status(404).json({ message: "User not found." });
              }
  
              // 3. Enrollment Document-ஐ உருவாக்குதல்
              const newEnrollment = await Enrollment.create({ 
                  userId, 
                  courseId, 
                  fullName: user.name, // User.name-ஐப் பயன்படுத்துக
                  email: user.email 
              });
              
              // 4. Enrollment எண்ணிக்கையைப் புதுப்பித்தல் (Course Collection-இல் உள்ள Count)
              const count = await Enrollment.countDocuments({ courseId }); 
              await Course.findByIdAndUpdate(courseId, { studentsEnrolled: count }); 
              
              // 5. வெற்றிகரமான பதிலை அனுப்புதல்
              res.json({ message: "✅ Enrollment successed!", enrollment: newEnrollment });
  
            } catch (err) { 
                  console.error("Enrollment error:", err);
                  res.status(500).json({ message: "Failed to enroll student." }); 
            }
          });
// 📊 Get only enrollments for chart
router.get("/enrollments", async (req, res) => {
  try {
    const courses = await Course.find({}, "title studentsEnrolled");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/enroll", async (req, res) => {
  try {
    const enrollment = new Enrollment({
      userId: req.body.userId,
      courseId: req.body.courseId,
      fullName: req.body.fullName,
      dob: req.body.dob,
      school: req.body.school,
      email: req.body.email,
      password: req.body.password
    });

    await enrollment.save();

    // ⭐ UPDATE COURSE COUNT (add here)
    const count = await Enrollment.countDocuments({ courseId: req.body.courseId });

    await Course.findByIdAndUpdate(req.body.courseId, {
      studentsEnrolled: count
    });

    res.json({ success: true });

  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Enrollment failed" });
  }
});


app.post("/api/reset-password", async (req, res) => {
  const { username, newPassword } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password reset successful" });
});


router.post("/", async (req, res) => {
  try {
    const { title, description, teacher } = req.body;

    const course = await Course.create({
      title,
      description,
      teacher,
      studentsEnrolled: 0
    });

    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Error creating course" });
  }
});

/* ==============================
   START SERVER
================================*/
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
