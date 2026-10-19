// ====================================================
// QuizAttempt Model — CareerPilot AI
//
// Persists candidate quiz results, accuracy scores, and question breakdown
// for performance tracking and placement readiness analytics.
// ====================================================

const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    unansweredCount: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      required: true, // Percentage e.g. 80
    },
    subtopics: [{
      type: String,
    }],
    quizMode: {
      type: String,
      enum: ['practice', 'test'],
      default: 'practice',
    },
    answers: [
      {
        question: String,
        selectedAnswer: Number,
        correctAnswer: Number,
        isCorrect: Boolean,
        explanation: String,
        subtopic: {
          type: String,
          default: '',
        },
        markedForReview: {
          type: Boolean,
          default: false,
        },
        isSkipped: {
          type: Boolean,
          default: false,
        },
      },
    ],
    feedback: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

QuizAttemptSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
