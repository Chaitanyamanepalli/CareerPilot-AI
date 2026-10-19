// ====================================================
// Contest Controller — CareerPilot AI
//
// Manages timed placement coding contests:
// - Server-authoritative start/end time gates
// - Registration management
// - Protected arena environment (hidden test cases masked)
// - Submissions evaluated under live contest timer
// - Real-time ranked leaderboards with ICPC-style scoring & penalty
// ====================================================

const Contest = require('../models/Contest');
const ContestRegistration = require('../models/ContestRegistration');
const ContestSubmission = require('../models/ContestSubmission');
const CodingProblem = require('../models/CodingProblem');
const { batchEvaluate } = require('../utils/judge0Service');

// @desc    Get all contests grouped by active, upcoming, and ended
// @route   GET /api/contests
// @access  Public / Private (attaches user registration)
const getContests = async (req, res, next) => {
  try {
    const contests = await Contest.find()
      .populate('problems.problem', 'title difficulty category')
      .sort({ startTime: -1 })
      .lean();

    // Check user registrations if candidate is authenticated
    let userRegistrations = new Set();
    if (req.user) {
      const registrations = await ContestRegistration.find({ user: req.user._id })
        .select('contest')
        .lean();
      registrations.forEach((r) => userRegistrations.add(r.contest.toString()));
    }

    const now = new Date();
    const active = [];
    const upcoming = [];
    const ended = [];

    contests.forEach((c) => {
      const start = new Date(c.startTime);
      const end = new Date(c.endTime);
      const isRegistered = userRegistrations.has(c._id.toString());

      let status = 'ended';
      if (now < start) status = 'upcoming';
      else if (now >= start && now <= end) status = 'active';

      const enriched = {
        ...c,
        status,
        isRegistered,
        problemCount: c.problems ? c.problems.length : 0,
        timeRemainingMs: end > now && start <= now ? end - now : 0,
      };

      if (status === 'active') active.push(enriched);
      else if (status === 'upcoming') upcoming.push(enriched);
      else ended.push(enriched);
    });

    res.status(200).json({
      success: true,
      data: {
        active,
        upcoming,
        ended,
        totalContests: contests.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single contest details by slug
// @route   GET /api/contests/:slug
// @access  Public / Private
const getContestBySlug = async (req, res, next) => {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug.toLowerCase() })
      .populate('problems.problem', 'title difficulty category tags')
      .lean();

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    let isRegistered = false;
    let userRegistration = null;

    if (req.user) {
      userRegistration = await ContestRegistration.findOne({
        contest: contest._id,
        user: req.user._id,
      }).lean();
      isRegistered = !!userRegistration;
    }

    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    let status = 'ended';
    if (now < start) status = 'upcoming';
    else if (now >= start && now <= end) status = 'active';

    res.status(200).json({
      success: true,
      data: {
        ...contest,
        status,
        isRegistered,
        userRegistration,
        timeRemainingMs: end > now && start <= now ? end - now : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register authenticated candidate for a contest
// @route   POST /api/contests/:id/register
// @access  Private (Candidate)
const registerForContest = async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    if (new Date() > new Date(contest.endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for a contest that has already ended',
      });
    }

    // Check if already registered
    const existing = await ContestRegistration.findOne({
      contest: contest._id,
      user: req.user._id,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Already registered for this contest',
        data: existing,
      });
    }

    const registration = await ContestRegistration.create({
      contest: contest._id,
      user: req.user._id,
    });

    contest.registeredCount = (contest.registeredCount || 0) + 1;
    await contest.save();

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the contest!',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enter the live contest arena (Enforces server-authoritative time gates & registration)
// @route   GET /api/contests/:slug/arena
// @access  Private (Candidate)
const getContestArena = async (req, res, next) => {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug.toLowerCase() });
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    // Server-Side Guard 1: Candidate must be registered
    const registration = await ContestRegistration.findOne({
      contest: contest._id,
      user: req.user._id,
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You must register for this contest before entering the arena',
      });
    }

    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    // Server-Side Guard 2: Time Gate
    if (now < start) {
      return res.status(403).json({
        success: false,
        message: `Contest has not started yet. Starts at ${start.toLocaleString()}`,
        startTime: start,
      });
    }

    // Fetch problem details for the arena (evalTestCases are completely stripped!)
    const problemIds = contest.problems.map((p) => p.problem);
    const problemDocs = await CodingProblem.find({ _id: { $in: problemIds } })
      .select('-evalTestCases')
      .lean();

    const problemMap = new Map();
    problemDocs.forEach((doc) => problemMap.set(doc._id.toString(), doc));

    // Fetch user's solved status & submissions in this contest
    const userSubmissions = await ContestSubmission.find({
      contest: contest._id,
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const solvedProblemIds = new Set();
    userSubmissions.forEach((sub) => {
      if (sub.status === 'Accepted') {
        solvedProblemIds.add(sub.problem.toString());
      }
    });

    // Assemble arena problem objects
    const arenaProblems = contest.problems.map((cp) => {
      const doc = problemMap.get(cp.problem.toString()) || {};
      return {
        _id: doc._id,
        slug: doc.slug,
        title: doc.title,
        difficulty: doc.difficulty,
        category: doc.category,
        description: doc.description,
        constraints: doc.constraints,
        sampleTestCases: doc.sampleTestCases,
        starterCode: doc.starterCode,
        label: cp.label || `Problem ${cp.order}`,
        order: cp.order,
        points: cp.points,
        isSolved: solvedProblemIds.has(doc._id ? doc._id.toString() : ''),
      };
    });

    const isEnded = now > end;

    res.status(200).json({
      success: true,
      data: {
        contest: {
          _id: contest._id,
          title: contest.title,
          slug: contest.slug,
          startTime: contest.startTime,
          endTime: contest.endTime,
          isEnded,
          timeRemainingMs: isEnded ? 0 : end - now,
        },
        registration,
        problems: arenaProblems,
        userSubmissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit code solution for a problem in an active contest
// @route   POST /api/contests/:slug/submit
// @access  Private (Candidate)
const submitContestProblem = async (req, res, next) => {
  try {
    const { problemId, language, code } = req.body;

    if (!problemId || !language || !code) {
      return res.status(400).json({
        success: false,
        message: 'problemId, language, and code are required',
      });
    }

    const contest = await Contest.findOne({ slug: req.params.slug.toLowerCase() });
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    // Server-Side Guard: Timer strictly enforced
    const now = new Date();
    if (now > new Date(contest.endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Contest has ended! Submissions are no longer accepted for scoring.',
      });
    }
    if (now < new Date(contest.startTime)) {
      return res.status(403).json({
        success: false,
        message: 'Contest has not started yet',
      });
    }

    // Verify registration
    const registration = await ContestRegistration.findOne({
      contest: contest._id,
      user: req.user._id,
    });
    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You are not registered for this contest',
      });
    }

    const contestProblemConfig = contest.problems.find(
      (cp) => cp.problem.toString() === problemId.toString()
    );
    if (!contestProblemConfig) {
      return res.status(400).json({
        success: false,
        message: 'This problem is not part of the active contest',
      });
    }

    const problem = await CodingProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Combine test cases for complete grading
    const allTestCases = problem.evalTestCases && problem.evalTestCases.length > 0
      ? problem.evalTestCases
      : problem.sampleTestCases.map((s) => ({ input: s.input, output: s.output, isHidden: false }));

    const evaluation = await batchEvaluate(language, code, allTestCases, problem.timeLimit || 3);

    // Calculate time offset in minutes from contest start
    const timeOffsetMinutes = Math.max(
      0,
      Math.floor((now - new Date(contest.startTime)) / 60000)
    );

    const isAccepted = evaluation.status === 'Accepted';
    const pointsAwarded = isAccepted ? contestProblemConfig.points : 0;

    // Record submission
    const submission = await ContestSubmission.create({
      contest: contest._id,
      user: req.user._id,
      problem: problem._id,
      language,
      code,
      status: evaluation.status,
      passedTestCases: evaluation.passedCount,
      totalTestCases: evaluation.totalCount,
      points: pointsAwarded,
      runtime: evaluation.runtime,
      memory: evaluation.memory,
      errorMessage: evaluation.errorMessage,
      submissionTimeMinutes: timeOffsetMinutes,
      testResults: evaluation.results,
    });

    // Update Contest Registration score & penalties if Accepted
    if (isAccepted) {
      // Check if user has already solved this problem previously in this contest
      const previousAccepted = await ContestSubmission.findOne({
        contest: contest._id,
        user: req.user._id,
        problem: problem._id,
        status: 'Accepted',
        _id: { $ne: submission._id },
      });

      if (!previousAccepted) {
        // Count previous rejected attempts on this problem to calculate penalty (20 mins per wrong answer)
        const wrongAttemptsCount = await ContestSubmission.countDocuments({
          contest: contest._id,
          user: req.user._id,
          problem: problem._id,
          status: { $ne: 'Accepted' },
          createdAt: { $lt: submission.createdAt },
        });

        const penaltyAdded = timeOffsetMinutes + wrongAttemptsCount * 20;

        registration.score += pointsAwarded;
        registration.penaltyMinutes += penaltyAdded;
        registration.solvedCount += 1;
        await registration.save();
      }
    }

    res.status(201).json({
      success: true,
      data: {
        submissionId: submission._id,
        status: submission.status,
        points: pointsAwarded,
        passedTestCases: submission.passedTestCases,
        totalTestCases: submission.totalTestCases,
        runtime: submission.runtime,
        memory: submission.memory,
        testResults: submission.testResults,
        currentTotalScore: registration.score,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live or final leaderboard for a contest
// @route   GET /api/contests/:slug/leaderboard
// @access  Public
const getContestLeaderboard = async (req, res, next) => {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug.toLowerCase() })
      .populate('problems.problem', 'title')
      .lean();

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    // Query sorted rankings: highest score first, lowest penalty second
    const rankings = await ContestRegistration.find({ contest: contest._id })
      .populate('user', 'fullName email')
      .sort({ score: -1, penaltyMinutes: 1, registeredAt: 1 })
      .limit(100)
      .lean();

    // Attach rank and user's solved problems
    const userIds = rankings.map((r) => r.user?._id).filter(Boolean);
    const acceptedSubs = await ContestSubmission.find({
      contest: contest._id,
      user: { $in: userIds },
      status: 'Accepted',
    }).select('user problem points submissionTimeMinutes').lean();

    const userSolvedMap = new Map();
    acceptedSubs.forEach((sub) => {
      const uId = sub.user.toString();
      if (!userSolvedMap.has(uId)) userSolvedMap.set(uId, new Set());
      userSolvedMap.get(uId).add(sub.problem.toString());
    });

    const leaderboard = rankings.map((r, idx) => {
      const uId = r.user?._id ? r.user._id.toString() : '';
      const solvedProblems = userSolvedMap.get(uId) || new Set();

      return {
        rank: idx + 1,
        userId: uId,
        fullName: r.user?.fullName || 'Anonymous Candidate',
        email: r.user?.email || '',
        score: r.score,
        penaltyMinutes: r.penaltyMinutes,
        solvedCount: r.solvedCount,
        registeredAt: r.registeredAt,
        problemSolvedStatus: contest.problems.map((cp) => ({
          problemId: cp.problem?._id,
          label: cp.label,
          points: cp.points,
          solved: solvedProblems.has(cp.problem?._id ? cp.problem._id.toString() : ''),
        })),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        contest: {
          _id: contest._id,
          title: contest.title,
          slug: contest.slug,
          status: contest.status,
          durationMinutes: contest.durationMinutes,
        },
        totalParticipants: rankings.length,
        leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContests,
  getContestBySlug,
  registerForContest,
  getContestArena,
  submitContestProblem,
  getContestLeaderboard,
};
