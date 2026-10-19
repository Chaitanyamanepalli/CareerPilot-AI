// ====================================================
// CodingSubmission Model — CareerPilot AI
//
// Records student code submissions against coding problems.
// Stores evaluation verdicts, runtime metrics, and test case breakdowns.
// ====================================================

const mongoose = require('mongoose');

const CodingSubmissionSchema = new mongoose.Schema(
  {
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
        'Pending'
      ],
      default: 'Pending',
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
    runtime: {
      type: Number, // Execution time in milliseconds
      default: 0,
    },
    memory: {
      type: Number, // Memory usage in KB
      default: 0,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    testResults: [
      {
        testCaseIndex: Number,
        passed: Boolean,
        input: String,
        expectedOutput: String,
        actualOutput: String,
        error: String,
        executionTime: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for user problem submission history
CodingSubmissionSchema.index({ user: 1, problem: 1, createdAt: -1 });

module.exports = mongoose.model('CodingSubmission', CodingSubmissionSchema);
