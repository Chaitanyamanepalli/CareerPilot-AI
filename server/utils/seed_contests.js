// ====================================================
// Contest Seeder Utility — CareerPilot AI
//
// Seeds sample contests (Active Live Sprint, Upcoming Challenge, and Ended Contest)
// and associates them with seeded coding problems.
//
// Usage: `node server/utils/seed_contests.js`
// ====================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const CodingProblem = require('../models/CodingProblem');
const ContestRegistration = require('../models/ContestRegistration');
const User = require('../models/User');

const seedContests = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal_pro';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for contest seeding...');

    // Fetch existing problems to link
    const twoSum = await CodingProblem.findOne({ slug: 'two-sum' });
    const validParentheses = await CodingProblem.findOne({ slug: 'valid-parentheses' });
    const binarySearch = await CodingProblem.findOne({ slug: 'binary-search' });
    const maxSubarray = await CodingProblem.findOne({ slug: 'maximum-subarray' });
    const stockProblem = await CodingProblem.findOne({ slug: 'best-time-to-buy-and-sell-stock' });
    const climbingStairs = await CodingProblem.findOne({ slug: 'climbing-stairs' });

    if (!twoSum || !validParentheses || !binarySearch) {
      console.error('Please run seed_problems.js first to seed coding problems.');
      process.exit(1);
    }

    const now = new Date();

    // 1. Live Active Contest: Started 30 mins ago, ends in 90 mins
    const activeStartTime = new Date(now.getTime() - 30 * 60 * 1000);
    const activeEndTime = new Date(now.getTime() + 90 * 60 * 1000);

    const activeContest = await Contest.findOneAndUpdate(
      { slug: 'placement-sprint-1' },
      {
        title: 'CareerPilot Placement Sprint #1',
        slug: 'placement-sprint-1',
        description: 'Timed 2-hour placement simulation sprint designed to test your core DSA fundamentals under real pressure. Top performers get shortlisted for campus hiring referrals.',
        rules: [
          'All submissions are evaluated against hidden test cases in real-time.',
          'Each incorrect submission incurs a 20-minute penalty applied upon final accepted verdict.',
          'Languages supported: Python 3 and JavaScript.',
          'Rankings are sorted by total score first, then lowest penalty minutes.'
        ],
        startTime: activeStartTime,
        endTime: activeEndTime,
        durationMinutes: 120,
        problems: [
          { problem: twoSum._id, order: 1, points: 100, label: 'Problem A: Two Sum' },
          { problem: validParentheses._id, order: 2, points: 150, label: 'Problem B: Valid Parentheses' },
          { problem: binarySearch._id, order: 3, points: 100, label: 'Problem C: Binary Search' },
        ],
        registeredCount: 42,
        prizes: [
          '1st Place: Direct Placement Referral & Mock Interview Review',
          '2nd & 3rd: CareerPilot AI Placement Pro Badge',
          'Top 10%: Verified Certificate of Excellence'
        ]
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Seeded active contest: ${activeContest.title}`);

    // 2. Upcoming Contest: Starts tomorrow
    const upcomingStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcomingEndTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    const upcomingContest = await Contest.findOneAndUpdate(
      { slug: 'grand-placement-challenge-2026' },
      {
        title: 'Grand Placement Challenge 2026',
        slug: 'grand-placement-challenge-2026',
        description: 'Nationwide campus recruitment battle featuring Dynamic Programming, Two Pointers, and Greedy paradigms. Partner tech companies will evaluate top 50 participants.',
        rules: [
          'Registration is mandatory prior to contest start time.',
          'Contest arena unlocks automatically at the scheduled start time.',
          'Server-side timer is authoritative. Late submissions will not be scored.'
        ],
        startTime: upcomingStartTime,
        endTime: upcomingEndTime,
        durationMinutes: 120,
        problems: [
          { problem: stockProblem._id, order: 1, points: 100, label: 'Problem A: Stock Maximizer' },
          { problem: maxSubarray._id, order: 2, points: 200, label: 'Problem B: Kadane Subarray' },
          { problem: climbingStairs._id, order: 3, points: 150, label: 'Problem C: Step Climbing' },
        ],
        registeredCount: 128,
        prizes: [
          'Top 5: Interview Fast-Track with Tier-1 Partner Companies',
          'All Qualifiers: Detailed AI Skill Assessment Report'
        ]
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Seeded upcoming contest: ${upcomingContest.title}`);

    // 3. Past Ended Contest: Ended 2 days ago
    const pastStartTime = new Date(now.getTime() - 50 * 60 * 60 * 1000);
    const pastEndTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const pastContest = await Contest.findOneAndUpdate(
      { slug: 'placement-warmup-sprint-0' },
      {
        title: 'CareerPilot Placement Warmup Sprint #0',
        slug: 'placement-warmup-sprint-0',
        description: 'Inaugural placement warmup sprint. The contest has completed and final verified leaderboards are published.',
        rules: ['Scoring completed. Final rankings published.'],
        startTime: pastStartTime,
        endTime: pastEndTime,
        durationMinutes: 120,
        problems: [
          { problem: twoSum._id, order: 1, points: 100, label: 'Problem A' },
          { problem: binarySearch._id, order: 2, points: 100, label: 'Problem B' },
        ],
        registeredCount: 85,
        prizes: ['Winner: Placement Prep Kit']
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Seeded past contest: ${pastContest.title}`);

    // Seed sample leaderboard participants for past contest
    const candidateUsers = await User.find({ role: 'candidate' }).limit(5);
    if (candidateUsers.length > 0) {
      for (let i = 0; i < candidateUsers.length; i++) {
        const u = candidateUsers[i];
        await ContestRegistration.findOneAndUpdate(
          { contest: pastContest._id, user: u._id },
          {
            contest: pastContest._id,
            user: u._id,
            score: (candidateUsers.length - i) * 100,
            penaltyMinutes: 25 + i * 18,
            solvedCount: candidateUsers.length - i > 1 ? 2 : 1,
            rank: i + 1,
          },
          { upsert: true }
        );
      }
      console.log(`Seeded sample leaderboard entries for past contest.`);
    }

    console.log('\nSuccessfully seeded all CareerPilot AI Contests!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding contests:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedContests();
}

module.exports = { seedContests };
