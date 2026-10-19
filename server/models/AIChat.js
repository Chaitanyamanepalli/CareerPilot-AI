// ====================================================
// AIChat Model — CareerPilot AI
//
// Stores conversational AI chat sessions and messages for candidates.
// Each session belongs to a user and maintains conversation history
// to provide contextual placement preparation assistance.
// ====================================================

const mongoose = require('mongoose');

const MessageSubSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const AIChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
    },
    category: {
      type: String,
      enum: ['General', 'Technical', 'HR', 'Resume', 'Coding'],
      default: 'General',
    },
    messages: [MessageSubSchema],
  },
  {
    timestamps: true,
  }
);

// Index to quickly fetch a user's conversations sorted by latest activity
AIChatSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('AIChat', AIChatSchema);
