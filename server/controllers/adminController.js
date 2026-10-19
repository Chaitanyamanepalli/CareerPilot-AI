// ====================================================
// Admin Controller (CareerPilot AI Refined Admin Experience)
//
// Core Administrative Responsibilities:
// 1. Platform Metrics: Total users, active jobs, total applications, recent activity.
// 2. Job Postings: Create, edit, publish, close, archive (preserves application history).
// 3. Student Accounts: Search, view needed info, suspend/reactivate with guardrails.
// 4. Applications: Review, filter, update status with candidate email notifications.
// 5. AI Prep Hub Content: Maintain quiz topics & questions with validation & preview.
// 6. Code Practice Content: Maintain coding problems & test cases with preview.
// 7. Minimal Audit Logging: Timestamp, admin, action, and target.
// ====================================================

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const QuizQuestion = require('../models/QuizQuestion');
const CodingProblem = require('../models/CodingProblem');
const sendEmail = require('../utils/sendEmail');
const { generateStatusEmail } = require('../utils/statusEmailTemplates');
const { sendEventToUser } = require('../config/socket');
const { notifyAccountStatusChange } = require('../services/notificationService');

// Helper to record minimal audit events safely
const recordAuditLog = async (admin, action, targetType, targetId, details = {}) => {
  try {
    await AuditLog.create({
      adminId: admin._id,
      adminEmail: admin.email,
      adminName: admin.fullName || 'Administrator',
      action,
      targetType,
      targetId: String(targetId),
      details,
    });
  } catch (err) {
    console.error('AuditLog Recording Error:', err.message);
  }
};

// ====================================================
// 1. DASHBOARD METRICS (AUTHENTIC DATABASE DATA ONLY)
// ====================================================

// @desc    Get concise, verified platform metrics & recent application activity
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      activeJobs,
      totalJobs,
      totalApplications,
      recentApplications,
      totalQuizQuestions,
      totalCodingProblems,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'recruiter' }),
      Job.countDocuments({ jobStatus: 'Open', isDeleted: { $ne: true } }),
      Job.countDocuments({ isDeleted: { $ne: true } }),
      Application.countDocuments(),
      Application.find()
        .populate('jobId', 'title company location')
        .populate('candidateId', 'fullName email')
        .sort({ appliedAt: -1 })
        .limit(8),
      QuizQuestion.countDocuments().catch(() => 0),
      CodingProblem.countDocuments().catch(() => 0),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalCandidates,
        totalRecruiters,
        activeJobs,
        totalJobs,
        totalApplications,
        recentApplications,
        contentCounts: {
          quizQuestions: totalQuizQuestions,
          codingProblems: totalCodingProblems,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit trail logs (minimal: admin, action, target, timestamp)
// @route   GET /api/admin/audit-logs
// @access  Private (Admin only)
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, targetType, limit = 40 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================
// 2. JOB MANAGEMENT
// ====================================================

// @desc    Get all jobs for Admin
// @route   GET /api/admin/jobs
// @access  Private (Admin only)
const getAllJobsForAdmin = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = { isDeleted: { $ne: true } };

    if (status && status !== 'all') {
      filter.jobStatus = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const jobs = await Job.find(filter)
      .populate('postedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a job listing as Admin
// @route   POST /api/admin/jobs
// @access  Private (Admin only)
const createJobByAdmin = async (req, res, next) => {
  try {
    const {
      title,
      company,
      location,
      salary,
      jobType,
      description,
      experience,
      salaryRange,
      logo,
      jobStatus = 'Open',
      closingDate,
    } = req.body;

    let numericSalary = 0;
    if (salary !== undefined && salary !== '' && !isNaN(Number(salary))) {
      numericSalary = Number(salary);
    } else if (salaryRange) {
      const match = String(salaryRange).replace(/,/g, '').match(/\d+/);
      numericSalary = match ? parseInt(match[0], 10) : 600000;
    } else {
      numericSalary = 600000;
    }

    const resolvedJobType = jobType || req.body.type || 'Full Time';

    if (!title || !company || !location || !resolvedJobType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title, company, location, jobType, and description are required',
      });
    }

    const job = await Job.create({
      title,
      company,
      location,
      salary: numericSalary,
      jobType: resolvedJobType,
      description,
      experience: experience || '0-2 Yrs',
      salaryRange: salaryRange || `₹ ${(numericSalary / 100000).toFixed(1)} LPA`,
      logo: logo || company.toLowerCase().replace(/\s+/g, ''),
      postedBy: req.user._id,
      jobStatus,
      closingDate: closingDate ? new Date(closingDate) : null,
      isDeleted: false,
    });

    await recordAuditLog(req.user, 'JOB_CREATE', 'Job', job._id, {
      title: job.title,
      company: job.company,
      jobStatus: job.jobStatus,
    });

    res.status(201).json({
      success: true,
      message: 'Job listing created successfully',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing job listing
// @route   PUT /api/admin/jobs/:id
// @access  Private (Admin only)
const updateJobByAdmin = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job listing not found',
      });
    }

    const {
      title,
      company,
      location,
      salary,
      jobType,
      description,
      experience,
      salaryRange,
      logo,
      jobStatus,
      closingDate,
    } = req.body;

    if (title) job.title = title;
    if (company) job.company = company;
    if (location) job.location = location;
    if (salary !== undefined && salary !== '' && !isNaN(Number(salary))) {
      job.salary = Number(salary);
    }
    if (jobType) job.jobType = jobType;
    if (description) job.description = description;
    if (experience !== undefined) job.experience = experience;
    if (salaryRange !== undefined) job.salaryRange = salaryRange;
    if (logo !== undefined) job.logo = logo;
    if (jobStatus) job.jobStatus = jobStatus;
    if (closingDate !== undefined) job.closingDate = closingDate ? new Date(closingDate) : null;

    await job.save();

    await recordAuditLog(req.user, 'JOB_UPDATE', 'Job', job._id, {
      title: job.title,
      company: job.company,
      jobStatus: job.jobStatus,
    });

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle/update job publishing status (Open, Closed, Draft)
// @route   PATCH /api/admin/jobs/:id/status
// @access  Private (Admin only)
const setJobStatusByAdmin = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const status = req.body.status || req.body.jobStatus;

    const validStatuses = ['Open', 'Closed', 'Draft'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job listing not found',
      });
    }

    job.jobStatus = status;
    await job.save();

    await recordAuditLog(req.user, 'JOB_STATUS_CHANGE', 'Job', job._id, {
      title: job.title,
      status,
    });

    res.status(200).json({
      success: true,
      message: `Job status updated to '${status}' successfully`,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete job safely: if job has applications, archive/close to preserve history!
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin only)
const deleteJobByAdmin = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job listing not found',
      });
    }

    const applicationCount = await Application.countDocuments({ jobId });

    // Requirement: If a job has applications, prefer closing/archiving instead of deleting
    if (applicationCount > 0) {
      job.isDeleted = true;
      job.jobStatus = 'Closed';
      await job.save();

      await recordAuditLog(req.user, 'JOB_STATUS_CHANGE', 'Job', jobId, {
        title: job.title,
        action: 'ARCHIVED_PRESERVING_APPLICATIONS',
        applicationCount,
      });

      return res.status(200).json({
        success: true,
        message: `Job has ${applicationCount} applications. It was safely archived and closed to preserve application history.`,
        data: job,
        archived: true,
      });
    }

    // If no applications exist, perform safe soft deletion
    job.isDeleted = true;
    job.jobStatus = 'Closed';
    await job.save();

    await recordAuditLog(req.user, 'JOB_DELETE', 'Job', jobId, {
      title: job.title,
      type: 'SOFT_DELETE',
    });

    res.status(200).json({
      success: true,
      message: 'Job archived successfully',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get applications for a specific job
// @route   GET /api/admin/jobs/:id/applications
// @access  Private (Admin only)
const getJobApplicationsForAdmin = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const applications = await Application.find({ jobId })
      .populate('candidateId', 'fullName email skills education resumeUrl')
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================
// 3. STUDENT & USER MANAGEMENT
// ====================================================

// @desc    Get all student/user accounts (omits passwords, hashes, reset tokens)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.accountStatus = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('fullName email role accountStatus skills experience location education createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or reactivate a student/user account
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const status = req.body.status || req.body.accountStatus;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active or suspended',
      });
    }

    // Safety guardrail: Admin cannot suspend their own account
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot suspend their own account',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Guardrail: Cannot suspend last active administrator
    if (user.role === 'admin' && status === 'suspended') {
      const activeAdminsCount = await User.countDocuments({
        role: 'admin',
        accountStatus: 'active',
      });
      if (activeAdminsCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation prohibited: Cannot suspend the only active administrator account',
        });
      }
    }

    user.accountStatus = status;
    await user.save();

    await recordAuditLog(req.user, 'STUDENT_STATUS_CHANGE', 'User', user._id, {
      fullName: user.fullName,
      email: user.email,
      newStatus: status,
    });

    // Phase 3 Notification: Dispatch account status change notification & email
    notifyAccountStatusChange(user, status, req.user?.fullName || 'Administrator').catch(err => {
      console.error('[NOTIF] Failed to dispatch account status notification:', err.message);
    });

    res.status(200).json({
      success: true,
      message: `Account for ${user.fullName} is now ${status}`,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================
// 4. APPLICATION MANAGEMENT (WITH EMAIL NOTIFICATIONS)
// ====================================================

// @desc    Get all applications across all jobs
// @route   GET /api/admin/applications
// @access  Private (Admin only)
const getAllApplications = async (req, res, next) => {
  try {
    const { status, jobId, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (jobId) {
      filter.jobId = jobId;
    }

    let applications = await Application.find(filter)
      .populate('jobId', 'title company location jobType salaryRange')
      .populate('candidateId', 'fullName email skills education resumeUrl')
      .sort({ appliedAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      applications = applications.filter((app) => {
        const candidateName = (app.name || (app.candidateId && app.candidateId.fullName) || '').toLowerCase();
        const candidateEmail = (app.email || (app.candidateId && app.candidateId.email) || '').toLowerCase();
        const jobTitle = (app.jobId && app.jobId.title || '').toLowerCase();
        const company = (app.jobId && app.jobId.company || '').toLowerCase();
        return (
          candidateName.includes(searchLower) ||
          candidateEmail.includes(searchLower) ||
          jobTitle.includes(searchLower) ||
          company.includes(searchLower)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application review status & trigger applicant email notification
// @route   PATCH /api/admin/applications/:id/status
// @access  Private (Admin only)
const updateApplicationStatusByAdmin = async (req, res, next) => {
  try {
    const appId = req.params.id;
    const {
      status: reqStatus,
      applicationStatus: reqAppStatus,
      interviewDate,
      interviewTime,
      interviewMeetingLink,
      interviewNotes,
    } = req.body;
    const status = reqStatus || reqAppStatus;

    const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid application status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const application = await Application.findById(appId).populate('jobId', 'title company');
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const previousStatus = application.status;
    application.status = status;
    application.applicationStatus = status;

    if (interviewDate !== undefined) {
      application.interviewDate = interviewDate ? new Date(interviewDate) : null;
    }
    if (interviewTime !== undefined) {
      application.interviewTime = interviewTime;
    }
    if (interviewMeetingLink !== undefined) {
      application.interviewMeetingLink = interviewMeetingLink;
    }
    if (interviewNotes !== undefined) {
      application.interviewNotes = interviewNotes;
    }

    await application.save();

    await recordAuditLog(req.user, 'APPLICATION_STATUS_CHANGE', 'Application', application._id, {
      candidateName: application.name,
      jobTitle: application.jobId ? application.jobId.title : 'Job',
      previousStatus,
      newStatus: status,
      interviewDate: application.interviewDate,
      interviewTime: application.interviewTime,
    });

    // Requirement: Dispatch professional, corporate-grade email notification to applicant
    // for all selection process status updates
    if (application.email) {
      const jobTitle = application.jobId ? application.jobId.title : 'Position';
      const company = application.jobId ? application.jobId.company : 'Company';

      const emailPayload = generateStatusEmail({
        application,
        status,
        jobTitle,
        company,
        interviewDate: application.interviewDate,
        interviewTime: application.interviewTime,
        interviewMeetingLink: application.interviewMeetingLink,
        interviewNotes: application.interviewNotes,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
      });

      sendEmail({
        to: application.email,
        subject: emailPayload.subject,
        text: emailPayload.text,
        html: emailPayload.html,
      }).catch((emailErr) => {
        console.error('[EMAIL] Failed to dispatch status email to applicant:', emailErr.message);
      });
    }

    // In-app Notification for student
    try {
      const notification = await Notification.create({
        recipient: application.candidateId,
        sender: req.user._id,
        type: 'status_change',
        title: 'Application Status Updated',
        message: `Your application for "${application.jobId ? application.jobId.title : 'Job'}" has been updated to "${status}"`,
      });
      sendEventToUser(application.candidateId, 'notification', {
        _id: notification._id,
        type: 'status_change',
        title: notification.title,
        message: notification.message,
        isRead: false,
        createdAt: notification.createdAt,
      });
    } catch (notifErr) {
      console.error('Notification dispatch error:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Application status updated to '${status}' successfully`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================
// 5. AI PREP HUB CONTENT ADMINISTRATION
// ====================================================

// @desc    Get all curated quiz questions
// @route   GET /api/admin/quiz-questions
// @access  Private (Admin only)
const getAllQuizQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, search } = req.query;
    const filter = {};

    if (topic && topic !== 'all') {
      filter.topic = topic;
    }

    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { subtopic: { $regex: search, $options: 'i' } },
      ];
    }

    const questions = await QuizQuestion.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a curated quiz practice question
// @route   POST /api/admin/quiz-questions
// @access  Private (Admin only)
const createQuizQuestion = async (req, res, next) => {
  try {
    const { topic, subtopic, difficulty, question, options, correctAnswer, explanation, isPublished = true } = req.body;

    if (!topic || !question || !explanation || correctAnswer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Topic, question text, 4 options, correctAnswer, and explanation are required',
      });
    }

    if (!Array.isArray(options) || options.length !== 4 || options.some(opt => !opt || !opt.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Questions must have exactly 4 non-empty options',
      });
    }

    const answerIdx = parseInt(correctAnswer, 10);
    if (isNaN(answerIdx) || answerIdx < 0 || answerIdx > 3) {
      return res.status(400).json({
        success: false,
        message: 'correctAnswer must be an index between 0 and 3',
      });
    }

    const newQuestion = await QuizQuestion.create({
      topic: topic.trim(),
      subtopic: (subtopic || '').trim(),
      difficulty: difficulty || 'Medium',
      question: question.trim(),
      options: options.map(o => o.trim()),
      correctAnswer: answerIdx,
      explanation: explanation.trim(),
      isPublished,
      createdBy: req.user._id,
    });

    await recordAuditLog(req.user, 'QUIZ_QUESTION_CREATE', 'QuizQuestion', newQuestion._id, {
      topic: newQuestion.topic,
      difficulty: newQuestion.difficulty,
    });

    res.status(201).json({
      success: true,
      message: 'Quiz question created successfully',
      data: newQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a quiz question
// @route   PUT /api/admin/quiz-questions/:id
// @access  Private (Admin only)
const updateQuizQuestion = async (req, res, next) => {
  try {
    const questionId = req.params.id;
    const { topic, subtopic, difficulty, question, options, correctAnswer, explanation, isPublished } = req.body;

    const quizQ = await QuizQuestion.findById(questionId);
    if (!quizQ) {
      return res.status(404).json({
        success: false,
        message: 'Quiz question not found',
      });
    }

    if (topic) quizQ.topic = topic.trim();
    if (subtopic !== undefined) quizQ.subtopic = subtopic.trim();
    if (difficulty) quizQ.difficulty = difficulty;
    if (question) quizQ.question = question.trim();
    if (explanation) quizQ.explanation = explanation.trim();
    if (isPublished !== undefined) quizQ.isPublished = Boolean(isPublished);

    if (options) {
      if (!Array.isArray(options) || options.length !== 4 || options.some(opt => !opt || !opt.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Questions must have exactly 4 non-empty options',
        });
      }
      quizQ.options = options.map(o => o.trim());
    }

    if (correctAnswer !== undefined) {
      const answerIdx = parseInt(correctAnswer, 10);
      if (isNaN(answerIdx) || answerIdx < 0 || answerIdx > 3) {
        return res.status(400).json({
          success: false,
          message: 'correctAnswer must be between 0 and 3',
        });
      }
      quizQ.correctAnswer = answerIdx;
    }

    await quizQ.save();

    await recordAuditLog(req.user, 'QUIZ_QUESTION_UPDATE', 'QuizQuestion', quizQ._id, {
      topic: quizQ.topic,
      difficulty: quizQ.difficulty,
    });

    res.status(200).json({
      success: true,
      message: 'Quiz question updated successfully',
      data: quizQ,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle quiz question publishing status
// @route   PATCH /api/admin/quiz-questions/:id/status
// @access  Private (Admin only)
const setQuizQuestionStatus = async (req, res, next) => {
  try {
    const questionId = req.params.id;
    const { isPublished } = req.body;

    const quizQ = await QuizQuestion.findById(questionId);
    if (!quizQ) {
      return res.status(404).json({
        success: false,
        message: 'Quiz question not found',
      });
    }

    quizQ.isPublished = Boolean(isPublished);
    await quizQ.save();

    await recordAuditLog(req.user, 'QUIZ_QUESTION_STATUS', 'QuizQuestion', quizQ._id, {
      isPublished: quizQ.isPublished,
    });

    res.status(200).json({
      success: true,
      message: `Question publication status set to ${quizQ.isPublished ? 'Published' : 'Unpublished'}`,
      data: quizQ,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or archive a quiz question
// @route   DELETE /api/admin/quiz-questions/:id
// @access  Private (Admin only)
const deleteQuizQuestion = async (req, res, next) => {
  try {
    const questionId = req.params.id;
    const quizQ = await QuizQuestion.findById(questionId);

    if (!quizQ) {
      return res.status(404).json({
        success: false,
        message: 'Quiz question not found',
      });
    }

    await QuizQuestion.findByIdAndDelete(questionId);

    await recordAuditLog(req.user, 'QUIZ_QUESTION_DELETE', 'QuizQuestion', questionId, {
      topic: quizQ.topic,
    });

    res.status(200).json({
      success: true,
      message: 'Quiz question removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================
// 6. CODE PRACTICE CONTENT ADMINISTRATION
// ====================================================

// @desc    Get all coding problems for Admin
// @route   GET /api/admin/coding-problems
// @access  Private (Admin only)
const getAllCodingProblemsForAdmin = async (req, res, next) => {
  try {
    const { difficulty, category, search } = req.query;
    const filter = {};

    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const problems = await CodingProblem.find(filter)
      .select('title slug difficulty category isPublished totalSubmissions totalAccepted createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: problems.length,
      data: problems,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a coding challenge
// @route   POST /api/admin/coding-problems
// @access  Private (Admin only)
const createCodingProblemByAdmin = async (req, res, next) => {
  try {
    const {
      title,
      difficulty,
      category,
      tags = [],
      description,
      constraints = [],
      sampleTestCases = [],
      evalTestCases = [],
      starterCode = {},
      editorial = '',
      isPublished = true,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Problem title and description are required',
      });
    }

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const problem = await CodingProblem.create({
      title: title.trim(),
      slug,
      difficulty: difficulty || 'Easy',
      category: category || 'Arrays',
      tags: Array.isArray(tags) ? tags : [],
      description,
      constraints: Array.isArray(constraints) ? constraints : [],
      sampleTestCases: Array.isArray(sampleTestCases) ? sampleTestCases : [],
      evalTestCases: Array.isArray(evalTestCases) ? evalTestCases : [],
      starterCode: starterCode || {},
      editorial,
      isPublished,
    });

    await recordAuditLog(req.user, 'CODING_PROBLEM_CREATE', 'CodingProblem', problem._id, {
      title: problem.title,
      difficulty: problem.difficulty,
    });

    res.status(201).json({
      success: true,
      message: 'Coding problem created successfully',
      data: problem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a coding challenge
// @route   PUT /api/admin/coding-problems/:id
// @access  Private (Admin only)
const updateCodingProblemByAdmin = async (req, res, next) => {
  try {
    const problemId = req.params.id;
    const problem = await CodingProblem.findById(problemId);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Coding problem not found',
      });
    }

    const {
      title,
      difficulty,
      category,
      tags,
      description,
      constraints,
      sampleTestCases,
      evalTestCases,
      starterCode,
      editorial,
      isPublished,
    } = req.body;

    if (title) problem.title = title.trim();
    if (difficulty) problem.difficulty = difficulty;
    if (category) problem.category = category;
    if (tags !== undefined) problem.tags = Array.isArray(tags) ? tags : [];
    if (description) problem.description = description;
    if (constraints !== undefined) problem.constraints = Array.isArray(constraints) ? constraints : [];
    if (sampleTestCases !== undefined) problem.sampleTestCases = sampleTestCases;
    if (evalTestCases !== undefined) problem.evalTestCases = evalTestCases;
    if (starterCode !== undefined) problem.starterCode = starterCode;
    if (editorial !== undefined) problem.editorial = editorial;
    if (isPublished !== undefined) problem.isPublished = Boolean(isPublished);

    await problem.save();

    await recordAuditLog(req.user, 'CODING_PROBLEM_UPDATE', 'CodingProblem', problem._id, {
      title: problem.title,
      difficulty: problem.difficulty,
    });

    res.status(200).json({
      success: true,
      message: 'Coding problem updated successfully',
      data: problem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle coding challenge publishing status
// @route   PATCH /api/admin/coding-problems/:id/status
// @access  Private (Admin only)
const setCodingProblemStatus = async (req, res, next) => {
  try {
    const problemId = req.params.id;
    const { isPublished } = req.body;

    const problem = await CodingProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Coding problem not found',
      });
    }

    problem.isPublished = Boolean(isPublished);
    await problem.save();

    await recordAuditLog(req.user, 'CODING_PROBLEM_STATUS', 'CodingProblem', problem._id, {
      title: problem.title,
      isPublished: problem.isPublished,
    });

    res.status(200).json({
      success: true,
      message: `Problem publication status set to ${problem.isPublished ? 'Published' : 'Draft/Unpublished'}`,
      data: problem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or archive a coding challenge
// @route   DELETE /api/admin/coding-problems/:id
// @access  Private (Admin only)
const deleteCodingProblem = async (req, res, next) => {
  try {
    const problemId = req.params.id;
    const problem = await CodingProblem.findById(problemId);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Coding problem not found',
      });
    }

    await CodingProblem.findByIdAndDelete(problemId);

    await recordAuditLog(req.user, 'CODING_PROBLEM_DELETE', 'CodingProblem', problemId, {
      title: problem.title,
    });

    res.status(200).json({
      success: true,
      message: 'Coding problem removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Stats & Audit
  getAdminStats,
  getAuditLogs,

  // Job Management
  getAllJobsForAdmin,
  createJobByAdmin,
  updateJobByAdmin,
  setJobStatusByAdmin,
  deleteJobByAdmin,
  getJobApplicationsForAdmin,

  // Student & User Management
  getAllUsers,
  updateUserStatus,

  // Application Management
  getAllApplications,
  updateApplicationStatusByAdmin,

  // AI Prep Hub Content
  getAllQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  setQuizQuestionStatus,
  deleteQuizQuestion,

  // Code Practice Content
  getAllCodingProblemsForAdmin,
  createCodingProblemByAdmin,
  updateCodingProblemByAdmin,
  setCodingProblemStatus,
  deleteCodingProblem,
};
