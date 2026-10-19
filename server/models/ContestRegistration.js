// ====================================================
// ContestRegistration Model — CareerPilot AI
//
// Tracks candidate participation in contests, scores, penalty minutes,
// and current leaderboard rank.
// ====================================================

const mongoose = require('mongoose');

const ContestRegistrationSchema = new mongoose.Schema(
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
    score: {
      type: Number,
      default: 0,
    },
    penaltyMinutes: {
      type: Number,
      default: 0,
    },
    solvedCount: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate registrations for the same contest
ContestRegistrationSchema.index({ contest: 1, user: 1 }, { unique: true });
// Index for sorting contest leaderboards
ContestRegistrationSchema.index({ contest: 1, score: -1, penaltyMinutes: 1 });

module.exports = mongoose.model('ContestRegistration', ContestRegistrationSchema);
