// ====================================================
// Contest Model — CareerPilot AI
//
// Represents placement coding contests and sprints.
// Features server-authoritative start/end timestamps, problem point values,
// and automatic status calculation (upcoming, active, ended).
// ====================================================

const mongoose = require('mongoose');

const ContestProblemSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: true,
    },
    order: {
      type: Number,
      default: 1,
    },
    points: {
      type: Number,
      default: 100,
    },
    label: {
      type: String,
      default: 'Problem A',
    },
  },
  { _id: true }
);

const ContestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Contest title is required'],
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
    description: {
      type: String,
      required: true,
    },
    rules: [
      {
        type: String,
      },
    ],
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 90,
    },
    problems: [ContestProblemSchema],
    registeredCount: {
      type: Number,
      default: 0,
    },
    prizes: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual field: Server-authoritative status computed strictly by server clock
ContestSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startTime) return 'upcoming';
  if (now >= this.startTime && now <= this.endTime) return 'active';
  return 'ended';
});

// Virtual field: Time remaining in milliseconds (0 if ended)
ContestSchema.virtual('timeRemainingMs').get(function () {
  const now = new Date();
  if (now >= this.endTime) return 0;
  if (now < this.startTime) return this.endTime - this.startTime;
  return this.endTime - now;
});

ContestSchema.set('toJSON', { virtuals: true });
ContestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contest', ContestSchema);
