// ====================================================
// AuditLog Model (Database Schema)
//
// Records critical administrative actions on the platform:
// - Job creation, edits, publishing, closing, and deletion
// - Student account activation, suspension, and role changes
// - Application workflow status changes
//
// Strictly excludes sensitive data such as passwords or tokens.
// ====================================================

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminEmail: {
      type: String,
      required: true,
    },
    adminName: {
      type: String,
      default: 'Admin',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'JOB_CREATE',
        'JOB_UPDATE',
        'JOB_STATUS_CHANGE',
        'JOB_DELETE',
        'STUDENT_STATUS_CHANGE',
        'USER_ROLE_CHANGE',
        'STUDENT_PROFILE_UPDATE',
        'APPLICATION_STATUS_CHANGE',
        'APPLICATION_DELETE',
        'QUIZ_QUESTION_CREATE',
        'QUIZ_QUESTION_UPDATE',
        'QUIZ_QUESTION_STATUS',
        'QUIZ_QUESTION_DELETE',
        'CODING_PROBLEM_CREATE',
        'CODING_PROBLEM_UPDATE',
        'CODING_PROBLEM_STATUS',
        'CODING_PROBLEM_DELETE',
      ],
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Job', 'User', 'Application', 'QuizQuestion', 'CodingProblem'],
    },
    targetId: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for performant querying of recent audit trails
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
