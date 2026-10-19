// ====================================================
// Job Controller
//
// This file handles all backend operations related to job listings.
// It allows guests to search/filter jobs and lets recruiters manage their own postings.
//
// Features:
// - Fetch Jobs (with search, experience filters, sorting, and pagination)
// - Fetch Single Job Details by ID
// - Create Job Posting (Recruiter-only)
// - Update Job Posting (Recruiter-only, owner checked)
// - Delete Job Posting (Recruiter-only, owner checked)
//
// Used by:
// - jobRoutes.js
// ====================================================

const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

// Purpose:
// Retrieves a list of job postings matching search queries, filters, and paginations.
//
// Input:
// req.query - search (string), location (string), jobType (string), experience (string), sort (string), page (number), limit (number), myJobs (boolean string).
//
// Output:
// Returns JSON containing list of jobs, totalJobs matching query, and totalPages.
//
// Usage:
// Used on Home page, Jobs search page, and Recruiter Dashboard list.
const getJobs = async (req, res, next) => {
  try {
    const { search, location, jobType, experience, sort, page = 1, limit = 6, myJobs, minSalary, maxSalary, company } = req.query;

    const query = { isDeleted: { $ne: true } };

    // Handle optional auth check for recruiter's own jobs on dashboard
    // This allows recruiters to view only the jobs they created.
    if (myJobs === 'true') {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');
          query.postedBy = decoded.id;
        } catch (err) {
          console.error('getJobs auth verify error:', err.message);
        }
      }
    }

    // Real-time Search by Job Title, Company Name, or Location
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    // Explicit Location Filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Explicit Company Filter
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }

    // Filter by Salary range
    if (minSalary || maxSalary) {
      query.salary = {};
      if (minSalary) {
        query.salary.$gte = Number(minSalary);
      }
      if (maxSalary) {
        query.salary.$lte = Number(maxSalary);
      }
    }

    // Filter by Job Type (supports comma-separated list of types)
    if (jobType && jobType !== 'All' && jobType !== 'All Types') {
      const types = jobType.split(',');
      query.jobType = { $in: types };
    }

    // Filter by Experience Level mapping
    if (experience && experience !== 'All' && experience !== 'All Levels') {
      const expLevels = experience.split(',');
      const regexPatterns = [];
      expLevels.forEach(level => {
        if (level === 'Fresher') {
          regexPatterns.push('0-2 Yrs', 'Fresher');
        } else if (level === '1-3 Years') {
          regexPatterns.push('1-3 Yrs', '0-2 Yrs', '2-4 Yrs');
        } else if (level === '3-5 Years') {
          regexPatterns.push('3-5 Yrs', '2-4 Yrs');
        } else if (level === '5+ Years') {
          regexPatterns.push('5+ Yrs', '5 Yrs');
        }
      });
      if (regexPatterns.length > 0) {
        query.experience = { $in: regexPatterns.map(p => new RegExp(p, 'i')) };
      }
    }

    // Pagination calculations
    // Pagination is used to avoid loading all jobs at once, which improves loading times.
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting configurations
    let sortOptions = { createdAt: -1 }; // Default: Show newest jobs first
    if (sort) {
      switch (sort) {
        case 'Oldest':
          sortOptions = { createdAt: 1 };
          break;
        case 'Salary Low To High':
          sortOptions = { salary: 1 };
          break;
        case 'Salary High To Low':
          sortOptions = { salary: -1 };
          break;
        case 'Alphabetical':
          sortOptions = { title: 1 };
          break;
        case 'Latest':
        default:
          sortOptions = { createdAt: -1 };
          break;
      }
    }

    const totalJobs = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: jobs.length,
      totalJobs,
      totalPages: Math.ceil(totalJobs / limitNum),
      currentPage: pageNum,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Fetches the full profile/details of a single job listing.
//
// Input:
// req.params.id (job ObjectId).
//
// Output:
// Returns the matching job document.
//
// Usage:
// Used when navigating to a job's details page.
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Creates a new job posting in the database.
//
// Input:
// req.body - contains { title, company, location, salary, jobType, description, experience, salaryRange, logo }, and req.user._id (recruiter's user ID).
//
// Output:
// Returns the newly created job posting details.
//
// Usage:
// Triggered on the recruiter or admin dashboard when posting a job.
const createJob = async (req, res, next) => {
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

    const job = await Job.create({
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
      closingDate: closingDate ? new Date(closingDate) : null,
      isDeleted: false,
      postedBy: req.user._id, // Set the creator ID to the logged-in user (recruiter or admin)
    });

    // Create Activity Log for Job Created
    const ActivityLog = require('../models/ActivityLog');
    try {
      await ActivityLog.create({
        recruiterId: req.user._id,
        action: `Created ${job.title} Job`,
      });
    } catch (err) {
      console.error('Failed to log job creation activity:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Modifies details of an existing job listing.
//
// Input:
// req.params.id (job ID) and req.body (updated field details).
//
// Output:
// Returns the updated job listing details.
//
// Usage:
// Triggered on the recruiter or admin dashboard when editing a job listing.
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Role and ownership authorization guard:
    // Allow if user is an admin OR if user is the recruiter who posted the job
    const isOwner = job.postedBy && job.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job listing',
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Deletes or safely archives a job posting, preserving application history when candidates have applied.
//
// Input:
// req.params.id (job ID).
//
// Output:
// Returns a confirmation message.
//
// Usage:
// Triggered on recruiter or admin dashboard when deleting a job listing.
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Role and ownership authorization guard:
    // Allow if user is an admin OR if user is the recruiter who posted the job
    const isOwner = job.postedBy && job.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job listing',
      });
    }

    // Check if the job has any candidate applications
    const applicationCount = await Application.countDocuments({ jobId: req.params.id });

    // Requirement: If a job already has applications, prefer closing or archiving it rather than permanently deleting it.
    // Preserve associated application records and history.
    if (applicationCount > 0) {
      job.isDeleted = true;
      job.jobStatus = 'Closed';
      await job.save();

      return res.status(200).json({
        success: true,
        message: `Job has ${applicationCount} applications. It was safely archived and closed to preserve application history.`,
        job,
        archived: true,
      });
    }

    // If no applications exist, safely mark as deleted
    job.isDeleted = true;
    job.jobStatus = 'Closed';
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save a job to bookmarks
// @route   POST /api/jobs/:id/save
// @access  Private (Candidate only)
const saveJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const user = await User.findById(req.user._id);

    if (user.savedJobs.includes(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Job already saved',
      });
    }

    user.savedJobs.push(jobId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Job saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a saved job from bookmarks
// @route   DELETE /api/jobs/:id/save
// @access  Private (Candidate only)
const unsaveJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const user = await User.findById(req.user._id);

    user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId.toString());
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Job removed from saved list successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload Company Logo
// @route   POST /api/jobs/upload-logo
// @access  Private (Recruiter only)
const uploadJobLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file (JPG/PNG)',
      });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close Job
// @route   PATCH /api/jobs/:id/close
// @access  Private (Recruiter only)
const closeJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Role and owner authorization guard: Allow recruiter owner or admin
    const isOwner = job.postedBy && job.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to close this job listing',
      });
    }

    job.jobStatus = 'Closed';
    await job.save();

    // Create Activity Log
    const ActivityLog = require('../models/ActivityLog');
    try {
      await ActivityLog.create({
        recruiterId: req.user._id,
        action: `Closed ${job.title} Job`,
      });
    } catch (err) {
      console.error('Failed to log job close activity:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Job closed successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reopen Job
// @route   PATCH /api/jobs/:id/reopen
// @access  Private (Recruiter only)
const reopenJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Role and owner authorization guard: Allow recruiter owner or admin
    const isOwner = job.postedBy && job.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reopen this job listing',
      });
    }

    job.jobStatus = 'Open';
    job.isDeleted = false;
    await job.save();

    // Create Activity Log
    const ActivityLog = require('../models/ActivityLog');
    try {
      await ActivityLog.create({
        recruiterId: req.user._id,
        action: `Reopened ${job.title} Job`,
      });
    } catch (err) {
      console.error('Failed to log job reopen activity:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Job reopened successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  saveJob,
  unsaveJob,
  uploadJobLogo,
  closeJob,
  reopenJob,
};
