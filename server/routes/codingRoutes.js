// ====================================================
// Coding Routes — CareerPilot AI
//
// Mounted at /api/coding
// Endpoints for coding challenges, sandboxed execution, and submission history.
// ====================================================

const express = require('express');
const router = express.Router();
const {
  getProblems,
  getProblemBySlug,
  runCode,
  submitSolution,
  getUserSubmissions,
} = require('../controllers/codingController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Optional auth middleware: extracts user if token is present, otherwise lets guest browse problems
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

// Problem listings & details
router.get('/problems', optionalAuth, getProblems);
router.get('/problems/:slug', optionalAuth, getProblemBySlug);

// Code execution & submission (Candidate and Admin for testing)
router.post('/run', protect, authorizeRoles('candidate', 'admin'), runCode);
router.post('/submit', protect, authorizeRoles('candidate', 'admin'), submitSolution);
router.get('/submissions', protect, authorizeRoles('candidate', 'admin'), getUserSubmissions);

module.exports = router;
