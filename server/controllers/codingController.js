// ====================================================
// Coding Controller — CareerPilot AI
//
// Manages coding challenges, problem discovery, candidate code runs,
// test case evaluation via Judge0/Sandbox, and submission history.
// ====================================================

const CodingProblem = require('../models/CodingProblem');
const CodingSubmission = require('../models/CodingSubmission');
const { executeCode, batchEvaluate } = require('../utils/judge0Service');

// @desc    Get all coding problems with optional filtering & solved status
// @route   GET /api/coding/problems
// @access  Public / Private (Candidate sees solved status)
const getProblems = async (req, res, next) => {
  try {
    const { difficulty, category, search, page = 1, limit = 25 } = req.query;

    const query = {};

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const skip = (pageNum - 1) * limitNum;

    // Project out evalTestCases and editorial from listing
    const [problems, total] = await Promise.all([
      CodingProblem.find(query)
        .select('-evalTestCases -editorial')
        .sort({ difficulty: 1, createdAt: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CodingProblem.countDocuments(query),
    ]);

    // If candidate is logged in, attach solved status for each problem
    let solvedProblemIds = new Set();
    if (req.user) {
      const solvedSubmissions = await CodingSubmission.find({
        user: req.user._id,
        status: 'Accepted',
      }).select('problem').lean();

      solvedSubmissions.forEach((s) => {
        solvedProblemIds.add(s.problem.toString());
      });
    }

    const enrichedProblems = problems.map((p) => ({
      ...p,
      isSolved: solvedProblemIds.has(p._id.toString()),
    }));

    // Calculate overall statistics
    const stats = {
      totalProblems: await CodingProblem.countDocuments(),
      easyCount: await CodingProblem.countDocuments({ difficulty: 'Easy' }),
      mediumCount: await CodingProblem.countDocuments({ difficulty: 'Medium' }),
      hardCount: await CodingProblem.countDocuments({ difficulty: 'Hard' }),
      userSolvedCount: solvedProblemIds.size,
    };

    res.status(200).json({
      success: true,
      count: enrichedProblems.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      stats,
      data: enrichedProblems,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single problem by slug (safe: evalTestCases stripped)
// @route   GET /api/coding/problems/:slug
// @access  Public / Private
const getProblemBySlug = async (req, res, next) => {
  try {
    const problem = await CodingProblem.findOne({ slug: req.params.slug.toLowerCase() })
      .select('-evalTestCases')
      .lean();

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Coding problem not found',
      });
    }

    // If user is authenticated, retrieve their recent submissions for this problem
    let userSubmissions = [];
    if (req.user) {
      userSubmissions = await CodingSubmission.find({
        user: req.user._id,
        problem: problem._id,
      })
        .select('language status passedTestCases totalTestCases runtime memory createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    }

    res.status(200).json({
      success: true,
      data: {
        ...problem,
        userSubmissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run code against sample test cases or custom input
// @route   POST /api/coding/run
// @access  Private (Candidate)
const runCode = async (req, res, next) => {
  try {
    const { problemId, language, code, customInput } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        success: false,
        message: 'Language and code are required',
      });
    }

    // If customInput is provided, run once with customInput
    if (typeof customInput === 'string' && customInput.trim() !== '') {
      const result = await executeCode(language, code, customInput.trim());
      return res.status(200).json({
        success: true,
        data: {
          isCustom: true,
          stdout: result.stdout,
          stderr: result.stderr,
          runtime: result.time,
          status: result.status,
        },
      });
    }

    // Otherwise, fetch sample test cases from the problem
    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: 'problemId is required when no custom input is provided',
      });
    }

    const problem = await CodingProblem.findById(problemId).select('sampleTestCases timeLimit');
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    const sampleEvaluation = await batchEvaluate(
      language,
      code,
      problem.sampleTestCases,
      problem.timeLimit || 3
    );

    res.status(200).json({
      success: true,
      data: sampleEvaluation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit code solution for full evaluation against hidden test cases
// @route   POST /api/coding/submit
// @access  Private (Candidate)
const submitSolution = async (req, res, next) => {
  try {
    const { problemId, language, code } = req.body;

    if (!problemId || !language || !code) {
      return res.status(400).json({
        success: false,
        message: 'problemId, language, and code are required',
      });
    }

    const problem = await CodingProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Evaluate against complete evalTestCases suite
    const allTestCases = problem.evalTestCases && problem.evalTestCases.length > 0
      ? problem.evalTestCases
      : problem.sampleTestCases.map((s) => ({ input: s.input, output: s.output, isHidden: false }));

    const evaluation = await batchEvaluate(
      language,
      code,
      allTestCases,
      problem.timeLimit || 3
    );

    // Save submission record
    const submission = await CodingSubmission.create({
      user: req.user._id,
      problem: problem._id,
      language,
      code,
      status: evaluation.status,
      passedTestCases: evaluation.passedCount,
      totalTestCases: evaluation.totalCount,
      runtime: evaluation.runtime,
      memory: evaluation.memory,
      errorMessage: evaluation.errorMessage,
      testResults: evaluation.results,
    });

    // Update problem aggregate metrics
    problem.totalSubmissions += 1;
    if (evaluation.status === 'Accepted') {
      problem.totalAccepted += 1;
    }
    await problem.save();

    res.status(201).json({
      success: true,
      data: {
        submissionId: submission._id,
        status: submission.status,
        passedTestCases: submission.passedTestCases,
        totalTestCases: submission.totalTestCases,
        runtime: submission.runtime,
        memory: submission.memory,
        errorMessage: submission.errorMessage,
        testResults: submission.testResults,
        createdAt: submission.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's coding submission history
// @route   GET /api/coding/submissions
// @access  Private (Candidate)
const getUserSubmissions = async (req, res, next) => {
  try {
    const { problemId, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };

    if (problemId) {
      query.problem = problemId;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const [submissions, total] = await Promise.all([
      CodingSubmission.find(query)
        .populate('problem', 'title slug difficulty category')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      CodingSubmission.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProblems,
  getProblemBySlug,
  runCode,
  submitSolution,
  getUserSubmissions,
};
