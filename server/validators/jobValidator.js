// ====================================================
// Job Posting Input Validator Middleware
//
// This middleware validates inputs submitted when creating or updating a Job.
// It acts as a safety barrier to ensure invalid or corrupt data is never saved into MongoDB.
//
// Features:
// - Verifies presence and format of title, company, location, salary, jobType, and description.
// - Asserts that the salary is a positive number.
// - Asserts that the job type falls under the predefined list of types.
// - Returns a 400 Bad Request JSON response with validation errors on failure.
//
// Used by:
// - jobRoutes.js (applied to POST and PUT requests)
// ====================================================

// Purpose:
// Express middleware function that validates the body of a job creation/update request.
//
// Input:
// req.body - contains job details.
//
// Output:
// Calls next() if validation passes, otherwise returns a 400 JSON response with error lists.
//
// Usage:
// Added to job router post/put endpoints in jobRoutes.js.
const validateJob = (req, res, next) => {
  const { title, company, location, salary, jobType, description } = req.body;
  const errors = {};

  // Check job title text
  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.title = 'Job title is required';
  }
  // Check company name text
  if (!company || typeof company !== 'string' || company.trim() === '') {
    errors.company = 'Company name is required';
  }
  // Check location details text
  if (!location || typeof location !== 'string' || location.trim() === '') {
    errors.location = 'Location is required';
  }

  // Pre-process salary if formatted or provided via salaryRange
  if ((req.body.salary === undefined || req.body.salary === null || req.body.salary === '') && req.body.salaryRange) {
    const match = String(req.body.salaryRange).replace(/,/g, '').match(/\d+/);
    if (match) {
      req.body.salary = Number(match[0]);
    }
  } else if (typeof req.body.salary === 'string') {
    const cleaned = req.body.salary.replace(/,/g, '').trim();
    if (!isNaN(Number(cleaned)) && cleaned !== '') {
      req.body.salary = Number(cleaned);
    }
  }

  // Validate that the salary exists and is a positive numeric number
  if (req.body.salary === undefined || req.body.salary === null || req.body.salary === '') {
    errors.salary = 'Salary is required';
  } else {
    const numSalary = Number(req.body.salary);
    if (isNaN(numSalary) || numSalary <= 0) {
      errors.salary = 'Salary must be a positive number';
    }
  }

  // Validate that the job type is matching one of the options
  const validJobTypes = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Remote'];
  if (!jobType || !validJobTypes.includes(jobType)) {
    errors.jobType = `Job type is required and must be one of: ${validJobTypes.join(', ')}`;
  }

  // Check job description text
  if (!description || typeof description !== 'string' || description.trim() === '') {
    errors.description = 'Job description is required';
  }

  // If there are validation failures, block the request and return errors to the frontend
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

module.exports = { validateJob };
