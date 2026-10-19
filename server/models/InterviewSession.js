// ====================================================
// InterviewSession Model — CareerPilot AI
//
// Persists candidate interactive mock interview sessions,
// individual question evaluations, candidate responses,
// and the comprehensive end-of-session evaluation report.
// ====================================================

const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    interviewType: {
      type: String,
      enum: ['hr', 'technical', 'resume'],
      required: true,
    },
    targetRole: {
      type: String,
      default: 'Software Engineer',
    },
    candidateLevel: {
      type: String,
      enum: ['Student/Fresher', 'Intern', 'Experienced'],
      default: 'Student/Fresher',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Challenging'],
      default: 'Medium',
    },
    sessionLength: {
      type: Number,
      default: 5,
    },
    practiceMode: {
      type: String,
      enum: ['practice', 'mock'],
      default: 'practice',
    },
    focusAreas: [
      {
        type: String,
      },
    ],
    dreamCompany: {
      type: String,
      default: '',
    },
    placementTrack: {
      type: String,
      default: '',
    },
    // Questions and candidate answers
    questions: [
      {
        questionNumber: Number,
        question: {
          type: String,
          required: true,
        },
        blueprint: {
          type: String,
          default: '',
        },
        candidateAnswer: {
          type: String,
          default: '',
        },
        isSkipped: {
          type: Boolean,
          default: false,
        },
        evaluation: {
          score: { type: Number, default: 0 },
          rating: { type: String, default: '' },
          strengths: [String],
          improvements: [String],
          actionableAdvice: { type: String, default: '' },
          idealAnswerSnippet: { type: String, default: '' },
          feedbackSummary: { type: String, default: '' },
        },
        followUpQuestion: {
          type: String,
          default: '',
        },
        followUpAnswer: {
          type: String,
          default: '',
        },
      },
    ],
    // Final comprehensive evaluation report
    overallReport: {
      score: {
        type: Number,
        default: 0,
      },
      rating: {
        type: String,
        default: 'Pending',
      },
      questionsAnswered: {
        type: Number,
        default: 0,
      },
      questionsSkipped: {
        type: Number,
        default: 0,
      },
      keyStrengths: [String],
      areasToImprove: [String],
      topicsToRevise: [String],
      nextSteps: [String],
      summaryNote: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

InterviewSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
