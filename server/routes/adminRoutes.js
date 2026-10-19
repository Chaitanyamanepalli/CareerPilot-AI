// ====================================================
// Admin Routes (CareerPilot AI Refined Admin Module)
//
// All endpoints are strictly protected by:
//   protect (validates JWT Bearer token)
//   authorizeRoles('admin') (enforces server-side Admin role authorization)
// ====================================================

const express = require('express');
const router = express.Router();
const {
  // Stats & Audit
  getAdminStats,
  getAuditLogs,

  // Job Management
  getAllJobsForAdmin,
  createJobByAdmin,
  updateJobByAdmin,
  setJobStatusByAdmin,
  deleteJobByAdmin,
  getJobApplicationsForAdmin,

  // Student & User Management
  getAllUsers,
  updateUserStatus,

  // Application Management
  getAllApplications,
  updateApplicationStatusByAdmin,

  // AI Prep Hub Content
  getAllQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  setQuizQuestionStatus,
  deleteQuizQuestion,

  // Code Practice Content
  getAllCodingProblemsForAdmin,
  createCodingProblemByAdmin,
  updateCodingProblemByAdmin,
  setCodingProblemStatus,
  deleteCodingProblem,
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Blanket protection: Admin only
router.use(protect, authorizeRoles('admin'));

// 1. Dashboard Metrics & Audit Log
router.get('/stats', getAdminStats);
router.get('/audit-logs', getAuditLogs);

// 2. Job Management
router.get('/jobs', getAllJobsForAdmin);
router.post('/jobs', createJobByAdmin);
router.put('/jobs/:id', updateJobByAdmin);
router.patch('/jobs/:id/status', setJobStatusByAdmin);
router.delete('/jobs/:id', deleteJobByAdmin);
router.get('/jobs/:id/applications', getJobApplicationsForAdmin);

// 3. Student Account Management
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

// 4. Application Management
router.get('/applications', getAllApplications);
router.patch('/applications/:id/status', updateApplicationStatusByAdmin);

// 5. AI Prep Hub Content Management
router.get('/quiz-questions', getAllQuizQuestions);
router.post('/quiz-questions', createQuizQuestion);
router.put('/quiz-questions/:id', updateQuizQuestion);
router.patch('/quiz-questions/:id/status', setQuizQuestionStatus);
router.delete('/quiz-questions/:id', deleteQuizQuestion);

// 6. Code Practice Content Management
router.get('/coding-problems', getAllCodingProblemsForAdmin);
router.post('/coding-problems', createCodingProblemByAdmin);
router.put('/coding-problems/:id', updateCodingProblemByAdmin);
router.patch('/coding-problems/:id/status', setCodingProblemStatus);
router.delete('/coding-problems/:id', deleteCodingProblem);

module.exports = router;
