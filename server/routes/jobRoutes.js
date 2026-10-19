// ====================================================
// Job Listings Routes Configuration
//
// This file configures API endpoints for job listings.
//
// Endpoints:
// - GET  /api/jobs          -> Fetch multiple jobs (public)
// - POST /api/jobs          -> Post a job (protected, recruiter-only)
// - GET  /api/jobs/:id      -> Fetch single job details (public)
// - PUT  /api/jobs/:id      -> Update a job (protected, recruiter-only)
// - DELETE /api/jobs/:id    -> Delete a job (protected, recruiter-only)
//
// Used by:
// - Mounted at /api/jobs in server/server.js.
// ====================================================

const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  saveJob,
  unsaveJob,
  uploadJobLogo,
  closeJob,
  reopenJob,
} = require('../controllers/jobController');
const { uploadLogo } = require('../middleware/uploadMiddleware');
const { validateJob } = require('../validators/jobValidator');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route for handling multiple jobs
router.route('/')
  // Public users can fetch/browse jobs
  .get(getJobs)
  // Logged-in recruiters and admins can post new jobs. Details are validated before creation.
  .post(protect, authorizeRoles('recruiter', 'admin'), validateJob, createJob);

// Route for handling single job operations by ID
router.route('/:id')
  // Public details view
  .get(getJobById)
  // Logged-in recruiters (who own the job) and platform admins can update it
  .put(protect, authorizeRoles('recruiter', 'admin'), validateJob, updateJob)
  // Logged-in recruiters (who own the job) and platform admins can delete it
  .delete(protect, authorizeRoles('recruiter', 'admin'), deleteJob);

// Bookmark/Save job routes
router.route('/:id/save')
  .post(protect, authorizeRoles('candidate'), saveJob)
  .delete(protect, authorizeRoles('candidate'), unsaveJob);

// Logo upload route (Recruiter and Admin)
router.post('/upload-logo', protect, authorizeRoles('recruiter', 'admin'), uploadLogo, uploadJobLogo);

// Job Status Management routes (Recruiter and Admin)
router.patch('/:id/close', protect, authorizeRoles('recruiter', 'admin'), closeJob);
router.patch('/:id/reopen', protect, authorizeRoles('recruiter', 'admin'), reopenJob);

module.exports = router;
