// ====================================================
// AIChat Routes — CareerPilot AI
//
// Mounted at /api/ai-chat
// Provides conversational placement preparation endpoints for candidates.
// ====================================================

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  getConversations,
  getConversationById,
  startConversation,
  sendMessage,
  deleteConversation,
} = require('../controllers/aiChatController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Dedicated rate limiter for AI inference requests to protect local Ollama CPU/GPU
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 messages per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many AI requests. Please take a short break and try again in a few minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Protect all AI chat routes (Candidate only)
router.use(protect, authorizeRoles('candidate'));

router.get('/conversations', getConversations);
router.post('/conversations', chatLimiter, startConversation);
router.get('/conversations/:id', getConversationById);
router.post('/conversations/:id/messages', chatLimiter, sendMessage);
router.delete('/conversations/:id', deleteConversation);

module.exports = router;
