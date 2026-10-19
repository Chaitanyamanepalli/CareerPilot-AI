const express = require('express');
const router = express.Router();
const {
  analyzeResume,
  getCareerRoadmap,
  getInterviewQuestions,
  generateQuiz,
  getRecommendations,
  getDashboardStats,
  saveQuizAttempt,
  getQuizHistory,
  saveRoadmap,
  getSavedRoadmaps,
  deleteSavedRoadmap,
  evaluateMockAnswer,
  saveInterviewSession,
  getInterviewSessions,
  getInterviewSessionById,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadResume: uploadResumeMiddleware } = require('../middleware/uploadMiddleware');

// All AI Preparation routes are accessible to Candidates and Admins (for preview/testing)
router.get('/dashboard', protect, authorizeRoles('candidate', 'admin'), getDashboardStats);
router.post('/analyze-resume', protect, authorizeRoles('candidate', 'admin'), uploadResumeMiddleware, analyzeResume);
router.post('/career-roadmap', protect, authorizeRoles('candidate', 'admin'), getCareerRoadmap);
router.post('/interview-prep', protect, authorizeRoles('candidate', 'admin'), getInterviewQuestions);
router.post('/generate-quiz', protect, authorizeRoles('candidate', 'admin'), generateQuiz);
router.get('/recommendations', protect, authorizeRoles('candidate', 'admin'), getRecommendations);

// Quiz persistence, Roadmap saving, Mock interview AI evaluation & Interactive sessions
router.post('/quiz-attempt', protect, authorizeRoles('candidate', 'admin'), saveQuizAttempt);
router.get('/quiz-history', protect, authorizeRoles('candidate', 'admin'), getQuizHistory);
router.post('/save-roadmap', protect, authorizeRoles('candidate', 'admin'), saveRoadmap);
router.get('/saved-roadmaps', protect, authorizeRoles('candidate', 'admin'), getSavedRoadmaps);
router.delete('/saved-roadmaps/:id', protect, authorizeRoles('candidate', 'admin'), deleteSavedRoadmap);
router.post('/evaluate-mock-answer', protect, authorizeRoles('candidate', 'admin'), evaluateMockAnswer);
router.post('/interview-session/save', protect, authorizeRoles('candidate', 'admin'), saveInterviewSession);
router.get('/interview-sessions', protect, authorizeRoles('candidate', 'admin'), getInterviewSessions);
router.get('/interview-sessions/:id', protect, authorizeRoles('candidate', 'admin'), getInterviewSessionById);

module.exports = router;
