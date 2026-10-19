// ====================================================
// CodingProblem Model — CareerPilot AI
//
// Represents placement coding challenges in the problem database.
// Stores problem statements, constraints, starter templates,
// sample test cases (public) and evaluation test cases (hidden).
// ====================================================

const mongoose = require('mongoose');

const CodingProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
      index: true,
    },
    category: {
      type: String,
      enum: [
        'Arrays',
        'Strings',
        'Linked Lists',
        'Trees',
        'Dynamic Programming',
        'Searching & Sorting',
        'Graphs',
        'Math & Bit Manipulation',
        'Stack & Queue'
      ],
      default: 'Arrays',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      required: [true, 'Problem description is required'],
    },
    constraints: [
      {
        type: String,
      },
    ],
    sampleTestCases: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String, default: '' },
      },
    ],
    evalTestCases: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        isHidden: { type: Boolean, default: true },
      },
    ],
    starterCode: {
      python: { type: String, default: '' },
      javascript: { type: String, default: '' },
      java: { type: String, default: '' },
      cpp: { type: String, default: '' },
    },
    timeLimit: {
      type: Number,
      default: 2.0, // seconds
    },
    memoryLimit: {
      type: Number,
      default: 256, // MB
    },
    editorial: {
      type: String,
      default: '',
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    totalAccepted: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field for acceptance rate calculation
CodingProblemSchema.virtual('acceptanceRate').get(function () {
  if (this.totalSubmissions === 0) return 0;
  return Math.round((this.totalAccepted / this.totalSubmissions) * 100);
});

// Configure JSON serialization to include virtuals
CodingProblemSchema.set('toJSON', { virtuals: true });
CodingProblemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CodingProblem', CodingProblemSchema);
