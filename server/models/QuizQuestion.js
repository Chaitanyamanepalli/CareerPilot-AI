// ====================================================
// QuizQuestion Model — CareerPilot AI
//
// Shared, curated multiple-choice practice questions managed by Admins.
// Used in the AI Prep Hub for student placement preparation.
// ====================================================

const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: [true, 'Topic is required (e.g. JavaScript, Python, Data Structures)'],
      trim: true,
      index: true,
    },
    subtopic: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Question prompt is required'],
      trim: true,
    },
    options: {
      type: [String],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length === 4 && val.every(opt => opt && opt.trim().length > 0);
        },
        message: 'Quiz questions must have exactly 4 non-empty options',
      },
      required: true,
    },
    correctAnswer: {
      type: Number,
      required: [true, 'Correct answer index (0, 1, 2, or 3) is required'],
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: [true, 'Explanation for the correct choice is required'],
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);
