// ====================================================
// SavedRoadmap Model — CareerPilot AI
//
// Persists customized AI career roadmaps generated for candidates.
// ====================================================

const mongoose = require('mongoose');

const SavedRoadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      required: true,
    },
    currentSkillLevel: {
      type: String,
      default: 'Beginner',
    },
    preferredLanguage: {
      type: String,
      default: 'JavaScript',
    },
    overview: {
      type: String,
      default: '',
    },
    estimatedDuration: {
      type: String,
      default: '',
    },
    preparationGoal: {
      type: String,
      default: 'both',
    },
    dreamCompany: {
      type: String,
      default: '',
    },
    placementTrack: {
      type: String,
      default: 'product',
    },
    milestones: [mongoose.Schema.Types.Mixed],
    stages: [
      {
        stageName: String,
        duration: String,
        topics: [String],
        projects: [String],
      },
    ],
    suggestedProjects: [mongoose.Schema.Types.Mixed],
    interviewPrepSteps: [String],
    realisticTimelineNote: {
      type: String,
      default: '',
    },
    companyDisclaimer: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

SavedRoadmapSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SavedRoadmap', SavedRoadmapSchema);
