// ====================================================
// Contest Routes — CareerPilot AI
//
// Mounted at /api/contests
// Endpoints for contest listings, registration, timed arena, and leaderboard.
// ====================================================

const express = require('express');
const router = express.Router();
const {
  getContests,
  getContestBySlug,
  registerForContest,
  getContestArena,
  submitContestProblem,
  getContestLeaderboard,
} = require('../controllers/contestController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Optional auth helper: attaches user if token is provided
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

// Public / optionally authenticated browsing
router.get('/', optionalAuth, getContests);
router.get('/:slug', optionalAuth, getContestBySlug);
router.get('/:slug/leaderboard', getContestLeaderboard);

// Candidate authenticated actions
router.post('/:id/register', protect, authorizeRoles('candidate'), registerForContest);
router.get('/:slug/arena', protect, authorizeRoles('candidate'), getContestArena);
router.post('/:slug/submit', protect, authorizeRoles('candidate'), submitContestProblem);

module.exports = router;
