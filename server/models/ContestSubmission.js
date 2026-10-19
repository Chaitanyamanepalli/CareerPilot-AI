// ====================================================
// ContestSubmission Model — CareerPilot AI
//
// Records code submissions made during active timed contests.
// Enforces server-side time gates and tracks points and penalty minutes.
// ====================================================

const mongoose = require('mongoose');

const ContestSubmissionSchema = new mongoose.Schema(
  {
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contest',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['python', 'javascript', 'java', 'cpp'],
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'Accepted',
        'Wrong Answer',
        'Time Limit Exceeded',
        'Runtime Error',
        'Compilation Error',
      ],
      required: true,
      index: true,
    },
    passedTestCases: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    runtime: {
      type: Number,
      default: 0,
    },
    memory: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    submissionTimeMinutes: {
      type: Number,
      default: 0,
    },
    testResults: [
      {
        testCaseIndex: Number,
        passed: Boolean,
        status: String,
        input: String,
        expectedOutput: String,
        actualOutput: String,
        error: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

ContestSubmissionSchema.index({ contest: 1, user: 1, problem: 1, createdAt: -1 });

module.exports = mongoose.model('ContestSubmission', ContestSubmissionSchema);
