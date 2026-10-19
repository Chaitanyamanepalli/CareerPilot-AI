const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const SavedRoadmap = require('../models/SavedRoadmap');
const CodingSubmission = require('../models/CodingSubmission');
const InterviewSession = require('../models/InterviewSession');
const { parseResume } = require('../utils/resumeParser');
const { generateJSON } = require('../utils/ollamaService');
const {
  notifyResumeAnalysis,
  notifyRoadmapSaved,
  notifyMockInterviewCompleted,
} = require('../services/notificationService');

// Utility to get candidate's current skills
const getCandidateSkills = (user) => {
  let skills = [];
  if (user.parsedResumeData && user.parsedResumeData.skills && user.parsedResumeData.skills.length > 0) {
    skills = user.parsedResumeData.skills;
  } else if (user.skills && user.skills.length > 0) {
    skills = user.skills;
  } else {
    // Default fallback skills if none found
    skills = ['HTML', 'CSS', 'JavaScript', 'React'];
  }
  return skills;
};

// @desc    Analyze Candidate Resume using Gemini
// @route   POST /api/ai/analyze-resume
// @access  Private (Candidate only)
const analyzeResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let skills = [];
    
    if (req.file) {
      // If a new file is uploaded, parse it using the existing parser
      try {
        const parsed = await parseResume(req.file.path);
        if (parsed) {
          user.resumeUrl = `/uploads/resumes/${req.file.filename}`;
          user.parsedResumeData = {
            name: parsed.name || user.fullName,
            skills: parsed.skills || [],
            experience: parsed.experience || 'Fresher',
            education: parsed.education || 'Not specified'
          };
          // Sync user main skills if they are empty
          if (!user.skills || user.skills.length === 0) {
            user.skills = parsed.skills || [];
          }
          await user.save();
          skills = parsed.skills || [];
        }
      } catch (parseErr) {
        console.error('Error parsing uploaded resume in AI controller:', parseErr.message);
        return res.status(400).json({
          success: false,
          message: 'Failed to parse resume file. Ensure it is a valid PDF.'
        });
      }
    } else {
      // Use existing profile resume data
      skills = getCandidateSkills(user);
    }

    const targetRole = req.body.targetRole || 'Full Stack Developer';

    const prompt = `
      You are an expert ATS (Applicant Tracking System) parser and technical hiring consultant.
      Evaluate the candidate's resume/profile details below against the target role: "${targetRole}".
      
      Candidate Profile:
      - Full Name: ${user.fullName}
      - Experience: ${user.experience || 'Fresher'}
      - Education: ${user.education || 'Not specified'}
      - Extracted Skills: ${JSON.stringify(skills)}
      
      Provide a constructive evaluation of their profile. You must respond with JSON-only in the following format:
      {
        "extractedSkills": ["React", "JavaScript", ...],
        "missingSkills": ["TypeScript", "Docker", ...],
        "strengths": [
          "Detailed, specific strength 1...",
          "Detailed, specific strength 2..."
        ],
        "areasForImprovement": [
          "Specific actionable area for improvement 1...",
          "Specific actionable area for improvement 2..."
        ],
        "resumeScore": 75,
        "targetRole": "${targetRole}"
      }
      
      Note: The resumeScore must be an integer between 0 and 100 representing how well the skills align with the target role.
    `;

    const fallback = {
      extractedSkills: skills,
      missingSkills: ['TypeScript', 'Docker', 'Jest'],
      strengths: ['Foundational frontend tools listing', 'Structured profile details'],
      areasForImprovement: ['Incorporate cloud hosting expertise', 'Add unit testing skills'],
      resumeScore: 70,
      targetRole
    };

    const analysisResult = await generateJSON(prompt, fallback);

    // Phase 3 Notification: Dispatch ATS analysis feedback alert & in-app notification
    notifyResumeAnalysis(user, analysisResult, targetRole).catch(err => {
      console.error('[NOTIF] Failed to dispatch resume analysis notification:', err.message);
    });

    res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully',
      data: analysisResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI Career Roadmap using Gemini
// @route   POST /api/ai/career-roadmap
// @access  Private (Candidate only)
const getCareerRoadmap = async (req, res, next) => {
  try {
    const {
      targetRole,
      currentSkillLevel = 'Beginner',
      preferredLanguage = 'JavaScript',
      preparationGoal = 'both', // 'general' | 'targeted' | 'both'
      dreamCompany = '',
      placementTrack = 'Product-Based', // 'Product-Based' | 'Service-Based' | 'Startup' | 'Other'
      targetTimeline = '3_months', // '1_month' | '3_months' | '6_months' | 'recommend'
      knownSkills = [],
      dailyStudyTime = '1_hour' // '30_min' | '1_hour' | '2_hours' | '3_hours_plus'
    } = req.body;
    
    if (!targetRole || !targetRole.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a target role or career goal'
      });
    }

    const trimmedRole = targetRole.trim();
    const user = await User.findById(req.user._id);
    const profileSkills = getCandidateSkills(user);

    // Format known skills
    let userKnownSkills = [];
    if (Array.isArray(knownSkills) && knownSkills.length > 0) {
      userKnownSkills = knownSkills;
    } else if (typeof knownSkills === 'string' && knownSkills.trim()) {
      userKnownSkills = knownSkills.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      userKnownSkills = profileSkills;
    }

    const studyTimeReadable = dailyStudyTime === '30_min' ? '30 minutes daily'
      : dailyStudyTime === '1_hour' ? '1 hour daily'
      : dailyStudyTime === '2_hours' ? '2 hours daily'
      : dailyStudyTime === '3_hours_plus' ? '3+ hours daily'
      : '1-2 hours daily';

    const timelineReadable = targetTimeline === '1_month' ? '1 Month (Fast-Track Sprint)'
      : targetTimeline === '3_months' ? '3 Months (Intensive Placement Preparation)'
      : targetTimeline === '6_months' ? '6 Months (Comprehensive Mastery)'
      : 'Recommend ideal realistic duration';

    const goalStrategy = preparationGoal === 'general'
      ? 'General Placement Preparation: Focus strictly on broad, transferable foundational concepts, core Data Structures & Algorithms, and fundamental architectural principles across industries.'
      : preparationGoal === 'targeted'
      ? `Targeted Preparation: Optimize specifically for ${dreamCompany ? dreamCompany : 'top tier companies'} on the "${placementTrack}" hiring track. Prioritize the specific tech stack, system design, and coding rounds common in this track.`
      : `Combined Preparation (Both - Recommended): Divide the path into foundational milestones (transferable core skills) and targeted milestones tailored for ${dreamCompany ? dreamCompany : 'tier-1 employers'} (${placementTrack} track).`;

    const companyDisclaimer = dreamCompany && dreamCompany.trim()
      ? `Track-based Guidance: Recommendations for ${dreamCompany.trim()} are structured around industry benchmarks for ${placementTrack} companies. We do not claim access to proprietary internal hiring criteria.`
      : '';

    const prompt = `
      You are an elite placement director and software career architect.
      Build a structured, realistic, step-by-step career learning roadmap for a student targeting:
      - Target Role: "${trimmedRole}"
      - Preparation Goal: ${goalStrategy}
      - Dream Company: ${dreamCompany ? `"${dreamCompany.trim()}"` : 'None specified'}
      - Placement Track: "${placementTrack}"
      - Current Experience Level: ${currentSkillLevel}
      - Preferred Language / Primary Stack: ${preferredLanguage}
      - Skills Candidate Already Knows: ${JSON.stringify(userKnownSkills.slice(0, 8))}
      - Daily Study Time: ${studyTimeReadable}
      - Requested Target Duration: ${timelineReadable}

      Guidelines:
      1. Deliver 3 to 4 sequential milestones.
      2. If preparationGoal is 'both', mark early milestones as type: "foundation" and later milestones as type: "targeted".
      3. If preparationGoal is 'general', all milestones should be type: "foundation".
      4. If preparationGoal is 'targeted', milestones should be type: "targeted".
      5. For each milestone, provide:
         - Realistic timeline (e.g. "Weeks 1-3", "Weeks 4-7") taking study time into account.
         - Concrete codingExercises (2 practical problem/algorithm drills).
         - Concrete deliverable (a mini-project or functional repository to build).
         - CompletionCriteria (a clear checkpoint to verify mastery, e.g. "Solve 10 LeetCode Mediums on Trees + Deploy Mini-Project").
      6. Provide 2 Capstone Projects and 3 practical interview prep steps.
      7. In "realisticTimelineNote", comment honestly on pacing (e.g. if requested time is too tight for daily hours, offer encouraging pacing advice).

      Respond strictly with a JSON object in this format:
      {
        "role": "${trimmedRole}",
        "skillLevel": "${currentSkillLevel}",
        "language": "${preferredLanguage}",
        "preparationGoal": "${preparationGoal}",
        "dreamCompany": "${dreamCompany || ''}",
        "placementTrack": "${placementTrack}",
        "estimatedDuration": "e.g. 12 Weeks (3 Months)",
        "realisticTimelineNote": "1-2 sentences on realistic pacing based on ${studyTimeReadable}.",
        "companyDisclaimer": "${companyDisclaimer}",
        "milestones": [
          {
            "step": 1,
            "title": "Milestone Title",
            "type": "foundation",
            "timeline": "Weeks 1-3",
            "description": "What to master and why it matters.",
            "skills": ["Skill 1", "Skill 2", "Skill 3"],
            "topics": ["Core Topic A", "Core Topic B"],
            "codingExercises": ["Specific exercise 1", "Specific exercise 2"],
            "deliverable": "Concrete mini-project to build",
            "completionCriteria": "Specific mastery criteria to pass before moving forward"
          }
        ],
        "suggestedProjects": [
          {
            "title": "Capstone Project Title",
            "description": "Detailed architecture and features to implement.",
            "complexity": "Medium or Hard"
          }
        ],
        "interviewPrepSteps": [
          "Interview readiness action 1",
          "Interview readiness action 2"
        ]
      }
    `;

    // Dynamic role-aware fallback sets
    const fallbackMilestones = [
      {
        step: 1,
        title: `Core Foundations & ${preferredLanguage} Mastery`,
        type: "foundation",
        timeline: "Weeks 1-3",
        description: `Deepen fundamentals in ${preferredLanguage}, memory management, asymptotic complexity (Big-O), and essential data structures.`,
        skills: [preferredLanguage, "Data Structures", "Algorithms", "Git & GitHub"],
        topics: ["Arrays & Hash Maps", "Two Pointers & Sliding Window", "Recursion Basics"],
        codingExercises: ["Implement LRU Cache using Hash Map + Doubly Linked List", "Solve 15 Easy/Medium Two Pointer problems"],
        deliverable: `CLI Utility or algorithmic toolkit repository written in ${preferredLanguage}`,
        completionCriteria: "Able to implement fundamental data structures without referencing documentation and explain Big-O trade-offs."
      },
      {
        step: 2,
        title: preparationGoal === 'general' ? "Advanced Problem Solving & System Design" : `${placementTrack} Track Specialization`,
        type: preparationGoal === 'general' ? "foundation" : "targeted",
        timeline: "Weeks 4-8",
        description: `Build proficiency in the core architectural patterns and framework competencies required for ${trimmedRole}.`,
        skills: [trimmedRole.split(' ')[0], "REST APIs", "Database Indexing", "Caching"],
        topics: ["State Management / Microservices", "Database Schema Optimization", "Asynchronous Pipelines"],
        codingExercises: ["Design rate limiter with Redis token bucket algorithm", "Benchmark database queries with composite B-Tree indexes"],
        deliverable: "Full-stack authenticated service with caching and comprehensive test suites",
        completionCriteria: "Deploy a production-grade service with automated CI/CD and clean architectural boundaries."
      },
      {
        step: 3,
        title: dreamCompany ? `${dreamCompany} & High-Impact Interview Readiness` : "Placement Drills & Mock Evaluation",
        type: "targeted",
        timeline: "Weeks 9-12",
        description: `Simulate high-pressure technical screens, STAR behavioral scenarios, and end-to-end system design for ${trimmedRole}.`,
        skills: ["Mock Interviews", "System Scalability", "Behavioral (STAR)", "Resume Optimization"],
        topics: ["Distributed Caching & Sharding", "Concurrency & Thread Safety", "Engineering Trade-offs"],
        codingExercises: ["Solve 20 curated Medium/Hard placement problems", "Practice mock behavioral interviews with AI mentor"],
        deliverable: "Polished portfolio with live deployed capstones, technical blog writeup, and ATS-optimized resume",
        completionCriteria: "Consistently pass mock interview evaluations with scores of 8/10 or higher under timed conditions."
      }
    ];

    const fallback = {
      role: trimmedRole,
      skillLevel: currentSkillLevel,
      language: preferredLanguage,
      preparationGoal,
      dreamCompany: dreamCompany || '',
      placementTrack,
      estimatedDuration: targetTimeline === '1_month' ? '4 Weeks (Sprint)' : targetTimeline === '6_months' ? '24 Weeks (Mastery)' : '12 Weeks (3 Months)',
      realisticTimelineNote: `With ${studyTimeReadable}, dedicating consistent daily focus will yield strong momentum toward your ${trimmedRole} goal.`,
      companyDisclaimer,
      milestones: fallbackMilestones,
      learningOrder: fallbackMilestones,
      suggestedProjects: [
        {
          title: `${trimmedRole} Production Capstone`,
          description: `Architect a full-stack, distributed application utilizing ${preferredLanguage}, Redis caching, PostgreSQL/MongoDB, and JWT auth with 90%+ test coverage.`,
          complexity: "Hard"
        },
        {
          title: "Real-Time Collaborative Platform",
          description: "Build an event-driven application with WebSockets, optimistic UI updates, and containerized Docker deployment.",
          complexity: "Medium"
        }
      ],
      interviewPrepSteps: [
        "Complete 50 curated LeetCode problems categorized by pattern (Sliding Window, Trees, Graphs, DP).",
        "Record and critique 3 mock behavioral answers using the STAR method (Situation, Task, Action, Result).",
        "Conduct peer system design walkthroughs explaining load balancers, caching layers, and database sharding."
      ]
    };

    const roadmapResult = await generateJSON(
      prompt,
      fallback,
      { num_predict: 650, temperature: 0.35 }
    );

    // Normalize result structure
    let finalMilestones = fallbackMilestones;
    if (roadmapResult && Array.isArray(roadmapResult.milestones) && roadmapResult.milestones.length > 0) {
      finalMilestones = roadmapResult.milestones;
    } else if (roadmapResult && Array.isArray(roadmapResult.learningOrder) && roadmapResult.learningOrder.length > 0) {
      finalMilestones = roadmapResult.learningOrder;
    }

    const validatedRoadmap = {
      role: roadmapResult?.role || trimmedRole,
      skillLevel: roadmapResult?.skillLevel || currentSkillLevel,
      language: roadmapResult?.language || preferredLanguage,
      preparationGoal: roadmapResult?.preparationGoal || preparationGoal,
      dreamCompany: roadmapResult?.dreamCompany || dreamCompany || '',
      placementTrack: roadmapResult?.placementTrack || placementTrack,
      estimatedDuration: roadmapResult?.estimatedDuration || fallback.estimatedDuration,
      realisticTimelineNote: roadmapResult?.realisticTimelineNote || fallback.realisticTimelineNote,
      companyDisclaimer: roadmapResult?.companyDisclaimer || companyDisclaimer,
      milestones: finalMilestones,
      learningOrder: finalMilestones, // Backward compatibility
      suggestedProjects: Array.isArray(roadmapResult?.suggestedProjects) && roadmapResult.suggestedProjects.length > 0
        ? roadmapResult.suggestedProjects
        : fallback.suggestedProjects,
      interviewPrepSteps: Array.isArray(roadmapResult?.interviewPrepSteps) && roadmapResult.interviewPrepSteps.length > 0
        ? roadmapResult.interviewPrepSteps
        : fallback.interviewPrepSteps
    };

    res.status(200).json({
      success: true,
      data: validatedRoadmap
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Interview Questions using Gemma 3 (Custom Role, Level, Difficulty, Length & Focus)
// @route   POST /api/ai/interview-prep
// @access  Private (Candidate only)
const getInterviewQuestions = async (req, res, next) => {
  try {
    const {
      interviewType = 'technical',
      targetRole = 'Software Engineer',
      candidateLevel = 'Student/Fresher',
      difficulty = 'Medium',
      sessionLength = 5,
      practiceMode = 'practice',
      focusAreas = [],
      dreamCompany = '',
      placementTrack = '',
      customResumeText = '',
    } = req.body;

    const count = Number(sessionLength) === 10 ? 10 : 5;
    const user = await User.findById(req.user._id);
    const skills = getCandidateSkills(user);
    const resolvedRole = (targetRole && targetRole.trim()) || user.parsedResumeData?.targetRole || 'Software Engineer';

    // Build grounded resume/skills context
    let candidateContext = `Candidate Level: ${candidateLevel}\nSkills: ${JSON.stringify(skills.slice(0, 10))}\nExperience: ${user.experience || 'Fresher'}`;
    if (customResumeText && customResumeText.trim()) {
      candidateContext += `\nProvided Resume Context: ${customResumeText.trim().slice(0, 500)}`;
    } else if (user.parsedResumeData?.projects?.length > 0) {
      candidateContext += `\nProjects: ${JSON.stringify(user.parsedResumeData.projects.slice(0, 3))}`;
    }

    const companyTrackContext = dreamCompany || placementTrack
      ? `\nTarget Company/Track: ${dreamCompany || 'Unspecified'} (${placementTrack || 'General Tech Track'}). Note: Tailor interview expectations to this track.`
      : '';

    const focusContext = Array.isArray(focusAreas) && focusAreas.length > 0
      ? `\nSpecific Focus Areas to probe: ${focusAreas.join(', ')}`
      : '';

    const prompt = `
      You are a professional placement interviewer conducting a mock interview for the role "${resolvedRole}".
      
      Session Parameters:
      - Interview Type: ${interviewType} (options: hr, technical, resume)
      - Candidate Level: ${candidateLevel} (e.g. Student/Fresher, Intern, Experienced)
      - Difficulty Level: ${difficulty} (Easy, Medium, Challenging)
      - Number of Questions Required: ${count}
      ${candidateContext}
      ${companyTrackContext}
      ${focusContext}

      Specific Guidelines by Interview Type:
      - HR Interview: Focus on real behavioral situations (STAR methodology: Situation, Task, Action, Result), team conflict, tight deadlines, handling ambiguity, failure recovery, ethics, and cultural fit.
      - Technical Interview: Focus on core concepts for "${resolvedRole}", problem solving, algorithmic reasoning (DSA), system design trade-offs, debugging, and framework/database internals appropriate for ${difficulty} difficulty.
      - Resume-Based Interview: Ground questions strictly in the candidate's actual skills and stated background. Ask them to explain architectural choices, personal contributions, challenges overcome, and technical trade-offs. DO NOT invent fictitious past companies or unlisted certifications.

      Provide a concise answer blueprint for each question (2-3 sentences outlining the ideal structured response).

      Respond strictly with a JSON object in this format:
      {
        "questions": [
          {
            "questionNumber": 1,
            "q": "Interview question text here?",
            "a": "Ideal structured response blueprint (STAR structure or technical architectural points).",
            "category": "Specific topic (e.g., Conflict Resolution, Distributed Caching, React State Architecture)"
          }
        ]
      }
    `;

    // Dynamic Fallbacks tailored to configuration
    const hrQuestionsBank = [
      { q: "Tell me about a complex project you worked on under a tight deadline. How did you prioritize deliverables?", a: "Use STAR: Specify the timeline crunch, categorize features into Must-have vs Nice-to-have, and discuss delivering the MVP on time with quantifiable results.", category: "Time Management & Prioritization" },
      { q: "Describe a situation where you had a technical disagreement with a peer or teammate. How was it resolved?", a: "Focus on objective data and benchmarks rather than ego. Explain how you reviewed documentation, agreed on evaluation criteria, and aligned on the best architectural choice.", category: "Conflict Resolution & Teamwork" },
      { q: `Why are you interested in becoming a ${resolvedRole}, and what are your continuous learning habits?`, a: "Connect your specific engineering passions with real-world impact. Mention tech blogs, side projects, open-source reading, and willingness to adapt to new stacks.", category: "Motivation & Culture" },
      { q: "Can you share an experience where a project or feature failed or didn't meet expectations? What did you learn?", a: "Demonstrate extreme ownership. Explain the root cause clearly, the immediate mitigation applied, and the automated safeguards or process improvements instituted.", category: "Failure Recovery & Ownership" },
      { q: "How do you handle ambiguous or rapidly shifting requirements when assigned a new feature?", a: "Explain how you break down the problem, draft initial assumptions, build a quick prototype or design doc, and sync with stakeholders early for alignment.", category: "Adaptability & Communication" },
      { q: "Tell me about a time you had to learn a completely new technology or framework very quickly for a project.", a: "Detail your structured learning strategy: reading official docs, building a prototype sandbox, debugging common pitfalls, and deploying the solution.", category: "Rapid Learning" },
      { q: "Describe a scenario where you received critical or negative feedback on your code or work. How did you respond?", a: "Show open-mindedness and professional maturity. Emphasize viewing code reviews as collective quality control and implementing concrete improvements.", category: "Receptiveness to Feedback" },
      { q: "How do you approach balancing code quality and clean architecture with speed of delivery in a fast-paced environment?", a: "Discuss pragmatic engineering: maintaining clean interfaces and test coverage while deferring premature optimization or complex abstractions.", category: "Engineering Pragmatism" },
      { q: "Tell me about a time you helped or mentored a team member who was struggling with a task.", a: "Highlight empathy, pair programming, breaking the blocker down conceptually, and empowering them rather than simply giving the answer.", category: "Mentorship & Collaboration" },
      { q: "Where do you see your engineering skills evolving over the next 2 to 3 years?", a: "Articulate a clear growth path: deepening core system design knowledge, taking ownership of end-to-end features, and contributing to engineering excellence.", category: "Career Vision" }
    ];

    const techQuestionsBank = [
      { q: `For a ${resolvedRole}, explain how you optimize database query performance and manage connection pooling under high concurrency.`, a: "Explain composite indexing, analyzing query execution plans (EXPLAIN), connection pool reuse (avoiding TCP handshake overhead), and Redis cache-aside invalidation.", category: "Database & Scalability" },
      { q: "Explain the differences between synchronous and asynchronous execution models, and how the Event Loop handles microtasks vs macrotasks.", a: "Explain call stack, Web APIs, microtask queue (Promises, queueMicrotask processed to completion before next task), and macrotask queue (setTimeout, I/O).", category: "Concurrency & Runtime" },
      { q: "How do you design a robust caching strategy for frequently read, infrequently updated resources?", a: "Discuss Redis Cache-Aside, TTL expiration, cache invalidation on write/update, handling cache stampedes with mutex locks, and fallback to primary DB.", category: "Caching Architecture" },
      { q: "Compare monolithic architecture versus microservices. What are the key trade-offs in distributed data consistency?", a: "Compare rapid early iteration and easy transactions in monoliths against independent scaling and deployment in microservices, addressing the CAP theorem and Saga pattern.", category: "System Design & Architecture" },
      { q: "Explain the core principles of RESTful API design versus GraphQL or gRPC, and when you would select each.", a: "Contrast stateless resource-oriented HTTP verbs and caching with GraphQL client-defined query schemas and gRPC low-latency binary protobuf streaming.", category: "API Design" },
      { q: "How does Virtual DOM reconciliation and the 'key' attribute work in modern frontend frameworks like React?", a: "Describe tree diffing algorithm, how stable unique keys prevent destructive unmounting and recreation of DOM nodes, and batched state updates.", category: "Frontend Internals" },
      { q: "What automated testing layers (Unit, Integration, E2E) do you prioritize before deploying to production?", a: "Explain the testing pyramid: high-volume fast unit tests for business logic, integration tests for API contracts and DB queries, and targeted E2E flows.", category: "Testing & Reliability" },
      { q: "How do you secure web applications against common vulnerabilities like SQL Injection, XSS, and CSRF?", a: "Cover parameterized queries/ORMs, contextual output encoding, CSP headers, HttpOnly SameSite cookies, and sanitized user inputs.", category: "Application Security" },
      { q: "Describe the time and space complexity trade-offs of using a Hash Map versus a Balanced Binary Search Tree (AVL / Red-Black).", a: "Contrast amortized O(1) hash map lookups with O(log N) tree operations, noting trees preserve sorted order and range queries without hash collisions.", category: "Data Structures & Algorithms" },
      { q: "How would you design a real-time notification service that handles millions of active connected users?", a: "Discuss WebSocket connections with horizontally scaled gateway servers, Pub/Sub message broker (Redis/Kafka), and persistent storage with message acknowledgments.", category: "Real-Time Systems" }
    ];

    const resumeQuestionsBank = [
      { q: `In your recent projects using ${skills[0] || 'your primary language'}, what was the most difficult architectural bottleneck you encountered and how did you resolve it?`, a: "Ground the response in real project code: state the bottleneck (e.g. slow API latency or memory leak), explain profiling steps taken, and quantify the resulting performance gain.", category: "Project Deep Dive" },
      { q: `Walk me through how you integrated ${skills[1] || 'database layers'} in your application. How did you handle connection errors and data validation?`, a: "Discuss schema validation (Mongoose/Zod), try/catch transaction wrappers, structured error handling middleware, and graceful degradation.", category: "Integration & Architecture" },
      { q: "Explain the authentication and authorization mechanism implemented in your projects. How are user sessions secured?", a: "Detail JWT stateless tokens, short expiration windows, HttpOnly refresh cookies, CSRF protection, and role-based access control (RBAC) middleware.", category: "Security & Auth" },
      { q: "Tell me about a specific feature where you wrote custom algorithmic logic rather than relying entirely on pre-built third-party libraries.", a: "Highlight problem decomposition, chosen data structures, time complexity analysis, and edge case handling (nulls, boundary limits).", category: "Core Problem Solving" },
      { q: "How did you approach version control, branching strategies, and CI/CD pipelines in your collaborative projects?", a: "Explain feature-branch workflows, pull request reviews, automated linting/test gates, and deployment scripts to staging/production.", category: "DevOps & Collaboration" },
      { q: `What automated testing or debugging tools do you personally use when tracking down an elusive runtime bug in ${skills[0] || 'code'}?`, a: "Discuss step-through debuggers, structured loggers, network inspectors, reproducible unit test reproductions, and memory heap snapshots.", category: "Debugging & Tooling" },
      { q: `If you were tasked with scaling your primary portfolio project to 100x its current user base, what would break first and what would you refactor?`, a: "Demonstrate architectural foresight: identify single-instance bottlenecks (e.g. unindexed queries, blocking I/O), add caching, read-replicas, and background queues.", category: "Scalability Planning" },
      { q: "Describe how you managed asynchronous state and error boundaries across your frontend user interface.", a: "Explain loading skeleton states, optimistic UI updates, error boundary fallbacks, and centralizing API service calls.", category: "Frontend Engineering" },
      { q: "What design pattern or software principle (e.g. SOLID, DRY) did you find most beneficial in structuring your codebase?", a: "Cite a concrete example where applying Single Responsibility or Dependency Inversion made the codebase significantly easier to extend and test.", category: "Code Quality & Design Patterns" },
      { q: "Reflecting on your most significant project, what technical decision would you make differently if building it from scratch today?", a: "Exhibit self-reflection and engineering maturity: discuss technical debt, library choices that proved inflexible, and how you would architect it cleanly now.", category: "Technical Retrospective" }
    ];

    const selectedBank = interviewType === 'hr' ? hrQuestionsBank : interviewType === 'technical' ? techQuestionsBank : resumeQuestionsBank;
    const fallbackList = selectedBank.slice(0, count).map((item, idx) => ({
      questionNumber: idx + 1,
      q: item.q,
      a: item.a,
      category: item.category || 'Core Question'
    }));

    const questionsResult = await generateJSON(
      prompt,
      { questions: fallbackList },
      { num_predict: count === 10 ? 950 : 650, temperature: 0.6 }
    );

    let rawQuestions = fallbackList;
    if (Array.isArray(questionsResult)) {
      rawQuestions = questionsResult;
    } else if (questionsResult && Array.isArray(questionsResult.questions)) {
      rawQuestions = questionsResult.questions;
    } else if (questionsResult && Array.isArray(questionsResult.data)) {
      rawQuestions = questionsResult.data;
    }

    // Normalize questions to guarantee standard schema and backward compatibility
    const finalQuestions = rawQuestions.slice(0, count).map((item, idx) => {
      const qText = item.q || item.question || fallbackList[idx % fallbackList.length].q;
      const aText = item.a || item.blueprint || item.answer || fallbackList[idx % fallbackList.length].a;
      const cat = item.category || fallbackList[idx % fallbackList.length].category || 'General';

      return {
        questionNumber: idx + 1,
        q: qText,
        question: qText,
        a: aText,
        blueprint: aText,
        category: cat
      };
    });

    res.status(200).json({
      success: true,
      data: finalQuestions,
      meta: {
        interviewType,
        targetRole: resolvedRole,
        candidateLevel,
        difficulty,
        sessionLength: count,
        practiceMode,
        focusAreas,
        dreamCompany: dreamCompany || null,
        placementTrack: placementTrack || null,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Dynamic MCQs Quiz using Gemma 3
// @route   POST /api/ai/generate-quiz
// @access  Private (Candidate only)
const generateQuiz = async (req, res, next) => {
  try {
    const { topic, difficulty, numQuestions, subtopics, quizMode } = req.body;
    
    if (!topic || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Please provide topic and difficulty'
      });
    }

    const count = Math.min(parseInt(numQuestions, 10) || 5, 15);
    const randomNonce = Math.floor(Math.random() * 1000000);

    const subtopicsList = Array.isArray(subtopics) && subtopics.length > 0
      ? subtopics.filter(s => s && s !== 'Mixed Practice')
      : [];
    const subtopicsText = subtopicsList.join(', ');

    const prompt = `
      You are an expert technical interviewer creating placement practice multiple-choice questions.
      Topic: "${topic}"
      ${subtopicsText ? `Selected Subtopics: "${subtopicsText}"` : `Selected Subtopics: Core concepts of ${topic}`}
      Difficulty: "${difficulty}"
      Quiz Mode: "${quizMode || 'practice'}"
      Session Seed: ${randomNonce}

      Task: Generate exactly ${count} completely unique, realistic questions testing conceptual understanding, edge cases, and best practices.
      ${subtopicsText ? `IMPORTANT: Every question must focus on one of the requested subtopics (${subtopicsText}).` : ''}

      Requirements:
      - Each question must have 4 distinct, plausible options.
      - correctAnswer must be 0, 1, 2, or 3 (0-indexed integer corresponding to the correct option).
      - Include a clear, concise 1-2 sentence concept explanation explaining why the correct choice is right and what principle applies.
      - Include the specific "subtopic" name for each question (e.g. from [${subtopicsText || topic}]).

      Return strictly a valid JSON object in this format:
      {
        "questions": [
          {
            "question": "Question text?",
            "subtopic": "Subtopic Name",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Why this option is correct."
          }
        ]
      }
    `;

    // Curated rich fallbacks with subtopic tags
    const fallbackBank = [
      {
        subtopic: "Arrays",
        question: "What is the time complexity to access an element by index in a contiguous array?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
        correctAnswer: 0,
        explanation: "Arrays store elements in contiguous memory locations, allowing instant O(1) random access by computing base_address + (index * element_size)."
      },
      {
        subtopic: "Strings",
        question: "In most programming languages, why are strings designed to be immutable?",
        options: [
          "Security, thread safety, and memory caching/string interning",
          "To allow faster in-place character mutation",
          "To eliminate the need for UTF-8 character encoding",
          "To ensure strings consume zero heap memory"
        ],
        correctAnswer: 0,
        explanation: "String immutability ensures thread safety, hash code caching for hash tables, and secure sharing across functions without defensive copying."
      },
      {
        subtopic: "Linked Lists",
        question: "What is the primary advantage of a Doubly Linked List over a Singly Linked List?",
        options: [
          "Deletion of a given node in O(1) without needing to traverse from head",
          "Lower memory consumption per node",
          "O(1) random access to arbitrary indices",
          "Automatic cache locality optimization"
        ],
        correctAnswer: 0,
        explanation: "With a pointer to the target node, a doubly linked list can update prev.next and next.prev in O(1) time without searching for the preceding node."
      },
      {
        subtopic: "Stacks & Queues",
        question: "Which data structure is typically used by a compiler or engine to execute recursive function calls and call frames?",
        options: ["Call Stack", "Priority Queue", "Circular Buffer", "B-Tree"],
        correctAnswer: 0,
        explanation: "The runtime call stack operates on Last-In-First-Out (LIFO) semantics, pushing activation frames on function calls and popping upon return."
      },
      {
        subtopic: "Trees",
        question: "In a balanced Binary Search Tree (BST) with N nodes, what is the worst-case time complexity for lookup?",
        options: ["O(log N)", "O(N)", "O(1)", "O(N log N)"],
        correctAnswer: 0,
        explanation: "In a balanced BST (like AVL or Red-Black), the tree height is guaranteed to be O(log N), bounding lookup, insertion, and deletion times."
      },
      {
        subtopic: "Graphs",
        question: "Which algorithm finds the shortest path in a weighted graph with non-negative edge weights?",
        options: ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Tarjan's SCC", "Depth-First Search (DFS)"],
        correctAnswer: 0,
        explanation: "Dijkstra's algorithm uses a priority queue (min-heap) to greedily relax vertices and compute single-source shortest paths in non-negative weighted graphs."
      },
      {
        subtopic: "Sorting",
        question: "What is the worst-case time complexity of standard QuickSort when a naive pivot is chosen on an already sorted array?",
        options: ["O(N^2)", "O(N log N)", "O(N)", "O(log N)"],
        correctAnswer: 0,
        explanation: "If the first or last element is chosen as pivot on already sorted data, the partition becomes maximally unbalanced (1 and N-1 elements), resulting in O(N^2) comparisons."
      },
      {
        subtopic: "Searching",
        question: "Binary search requires which fundamental precondition on the input collection?",
        options: [
          "The elements must be sorted in monotonic order",
          "The collection must be a linked list",
          "All elements must be unique positive integers",
          "The collection size must be an exact power of two"
        ],
        correctAnswer: 0,
        explanation: "Binary search relies on monotonicity (sorted order) to discard half the search space at every comparison."
      },
      {
        subtopic: "Scope & Closures",
        question: "In JavaScript, what is a closure?",
        options: [
          "A function bundled together with references to its surrounding lexical environment",
          "A method that immediately deletes variables after execution to free RAM",
          "A callback that executes only when the browser window closes",
          "A syntax error caused by unmatched curly braces"
        ],
        correctAnswer: 0,
        explanation: "A closure gives an inner function access to an outer enclosing function's scope variables even after the outer function has returned."
      },
      {
        subtopic: "Promises & Async/Await",
        question: "What occurs if an unhandled promise rejection happens in modern Node.js environments?",
        options: [
          "Node.js emits an UnhandledPromiseRejection and terminates the process with non-zero exit code",
          "The runtime silently swallows the error and logs nothing",
          "The error is automatically retried 3 times synchronously",
          "The thread freezes indefinitely until manually interrupted"
        ],
        correctAnswer: 0,
        explanation: "In modern Node.js (v15+), unhandled promise rejections trigger process termination to prevent silent state corruption."
      },
      {
        subtopic: "Indexing & Query Plans",
        question: "Why should you avoid using functions on indexed columns in a SQL WHERE clause (e.g. WHERE YEAR(created_at) = 2024)?",
        options: [
          "It makes the predicate non-sargable, preventing the query engine from using the B-Tree index range scan",
          "It converts the database engine from relational to NoSQL",
          "It automatically drops the table schema",
          "It forces an immediate transaction rollback"
        ],
        correctAnswer: 0,
        explanation: "Wrapping indexed columns in scalar functions forces a full table scan because the engine cannot directly look up computed values in the index structure."
      },
      {
        subtopic: "Caching & Redis",
        question: "What is the 'Cache Aside' (Lazy Loading) pattern in backend architectures?",
        options: [
          "The application reads from cache; on miss, reads from DB, updates cache, and returns data",
          "The database directly syncs itself to cache in real time without application involvement",
          "The application always writes directly to disk before checking cache",
          "The cache deletes all data on every incoming HTTP request"
        ],
        correctAnswer: 0,
        explanation: "Cache-Aside queries cache first; on miss, reads source database, writes into cache with a TTL, and serves subsequent requests rapidly."
      }
    ];

    // Filter fallbacks matching topic or selected subtopics
    let relevantFallbacks = fallbackBank.filter(fb => {
      if (subtopicsList.length > 0) {
        return subtopicsList.some(s => fb.subtopic.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(fb.subtopic.toLowerCase()));
      }
      return true;
    });

    if (relevantFallbacks.length < count) {
      // Complement with other fallbacks tagged with target topic
      const genericTag = subtopicsList[0] || topic;
      const extras = fallbackBank.map(f => ({ ...f, subtopic: genericTag }));
      relevantFallbacks = [...relevantFallbacks, ...extras].slice(0, count);
    } else {
      relevantFallbacks = relevantFallbacks.slice(0, count);
    }

    const quizResult = await generateJSON(
      prompt,
      { questions: relevantFallbacks },
      { num_predict: 850, temperature: 0.7, seed: randomNonce }
    );

    let finalQuestions = relevantFallbacks;
    if (Array.isArray(quizResult)) {
      finalQuestions = quizResult;
    } else if (quizResult && Array.isArray(quizResult.questions)) {
      finalQuestions = quizResult.questions;
    } else if (quizResult && Array.isArray(quizResult.data)) {
      finalQuestions = quizResult.data;
    }

    // Ensure each question has valid fields and subtopic
    finalQuestions = finalQuestions.map((q, idx) => {
      const defaultSubtopic = subtopicsList.length > 0
        ? subtopicsList[idx % subtopicsList.length]
        : topic;

      return {
        question: q.question && typeof q.question === 'string' && q.question.trim().length > 5
          ? q.question.trim()
          : `Question ${idx + 1} on ${defaultSubtopic}`,
        subtopic: q.subtopic && typeof q.subtopic === 'string' && q.subtopic.trim().length > 0
          ? q.subtopic.trim()
          : defaultSubtopic,
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options.map(o => String(o).trim())
          : ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
          ? q.correctAnswer
          : 0,
        explanation: q.explanation && typeof q.explanation === 'string' && q.explanation.trim().length > 5
          ? q.explanation.trim()
          : `Fundamental principle tested under ${defaultSubtopic}.`
      };
    }).slice(0, count);

    res.status(200).json({
      success: true,
      data: finalQuestions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Skill Recommendations using Gemma 3
// @route   GET /api/ai/recommendations
// @access  Private (Candidate only)
const getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const skills = getCandidateSkills(user);
    const targetRole = user.parsedResumeData?.targetRole || 'Full Stack Developer';

    // Check user's actual quiz attempts and solved coding problems to personalize recommendations
    const quizAttempts = await QuizAttempt.find({ user: req.user._id }).limit(5);
    const solvedProblemCount = await CodingSubmission.distinct('problem', { user: req.user._id, status: 'Accepted' });

    const prompt = `
      You are an expert career guidance counselor for technical placements.
      Candidate Profile:
      - Target Role: "${targetRole}"
      - Current Skills: ${JSON.stringify(skills.slice(0, 8))}
      - Quizzes Attempted: ${quizAttempts.length}
      - Coding Problems Solved: ${solvedProblemCount.length}

      Generate a personalized learning recommendation matching their current skills and target role.
      Respond strictly with a JSON object in this exact schema:
      {
        "skillsToImprove": [
          {
            "skill": "${skills[0] || 'Data Structures'}",
            "focusArea": "Specific placement topic to focus on...",
            "platforms": ["LeetCode", "CareerPilot AI"]
          }
        ],
        "technologiesToLearnNext": [
          {
            "name": "Technology Name",
            "reason": "Why this technology boosts placement eligibility for ${targetRole}."
          }
        ],
        "certifications": [
          {
            "name": "Certification Name",
            "platform": "Issuing Authority / Platform",
            "duration": "3-4 weeks"
          }
        ],
        "practicePlatforms": ["CareerPilot Coding Sandbox", "LeetCode", "HackerRank"],
        "estimatedPrepTime": "4-6 Weeks"
      }
    `;

    const primarySkill = skills[0] || 'Full Stack Development';
    const fallback = {
      skillsToImprove: [
        {
          skill: primarySkill,
          focusArea: `Master asynchronous patterns, system design trade-offs, and algorithms in ${primarySkill}.`,
          platforms: ['CareerPilot AI', 'LeetCode']
        },
        {
          skill: 'System Design & Databases',
          focusArea: 'Database indexing, Redis caching, and microservices API architectures.',
          platforms: ['System Design Primer', 'CareerPilot AI']
        }
      ],
      technologiesToLearnNext: [
        {
          name: 'Docker & Containerization',
          reason: `Modern ${targetRole} positions require containerized microservices deployment.`
        },
        {
          name: 'TypeScript',
          reason: 'Strong static typing reduces production runtime errors and is preferred in enterprise teams.'
        }
      ],
      certifications: [
        { name: 'AWS Certified Cloud Practitioner', platform: 'Amazon Web Services', duration: '3-4 weeks' },
        { name: 'Meta Professional Developer Certificate', platform: 'Coursera', duration: '4-6 weeks' }
      ],
      practicePlatforms: ['CareerPilot Coding Hub', 'LeetCode', 'HackerRank'],
      estimatedPrepTime: '4-6 Weeks'
    };

    const recResult = await generateJSON(prompt, fallback, { num_predict: 550 });

    res.status(200).json({
      success: true,
      data: recResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Prep Dashboard Stats (Accurate, Real-Time & Instant)
// @route   GET /api/ai/dashboard
// @access  Private (Candidate only)
const getDashboardStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const skills = getCandidateSkills(user);

    // 1. Resume Score from actual parsed resume or verified profile completeness
    let resumeScore = 0;
    const hasResume = !!user.resumeUrl;
    if (user.parsedResumeData && typeof user.parsedResumeData.resumeScore === 'number') {
      resumeScore = user.parsedResumeData.resumeScore;
    } else if (hasResume) {
      // Base score for having an ATS-parsed resume + bonus for extracted skills
      resumeScore = Math.min(65 + (skills.length * 3), 95);
    } else {
      // No resume uploaded yet: baseline profile score
      resumeScore = Math.min(skills.length * 6, 50);
    }

    // 2. Real Quiz Stats from DB
    const recentAttempts = await QuizAttempt.find({ user: req.user._id }).sort({ createdAt: -1 });
    const quizzesTaken = recentAttempts.length;
    const liveQuizScore = quizzesTaken > 0
      ? Math.round(recentAttempts.reduce((acc, q) => acc + q.accuracy, 0) / quizzesTaken)
      : 0;

    // 3. Real Solved Coding Problems Count from DB
    const acceptedProblemIds = await CodingSubmission.distinct('problem', {
      user: req.user._id,
      status: 'Accepted'
    });
    const solvedProblemsCount = acceptedProblemIds.length;

    // 4. Saved Roadmaps & Completed Mock Interviews Count
    const savedRoadmapsCount = await SavedRoadmap.countDocuments({ user: req.user._id });
    const interviewsCompleted = await InterviewSession.countDocuments({ user: req.user._id });

    // 5. Holistic 0-100% Placement Preparation Progress
    // Component breakdown:
    // - Resume uploaded & scored: 25%
    // - Quiz practice: up to 25% (5% per quiz, max 5)
    // - Coding problems: up to 25% (5% per solved problem, max 5)
    // - Career Roadmaps & Mock prep: up to 25%
    let progress = 0;
    if (hasResume) progress += 20;
    progress += Math.min(quizzesTaken * 4, 20);
    progress += Math.min(solvedProblemsCount * 4, 20);
    if (savedRoadmapsCount > 0) progress += 10;
    progress += Math.min(interviewsCompleted * 10, 30);
    const preparationProgress = Math.min(Math.max(progress, 0), 100);

    // 6. Actionable Next Step (Computed instantly without blocking on LLM)
    let recommendedNextStep = '';
    if (!hasResume) {
      recommendedNextStep = 'Upload your PDF resume in the Resume Analyzer to benchmark your ATS match score.';
    } else if (quizzesTaken === 0) {
      recommendedNextStep = 'Take your first Practice Quiz in Data Structures or JavaScript to test your fundamentals.';
    } else if (solvedProblemsCount === 0) {
      recommendedNextStep = 'Solve your first placement coding challenge in the interactive Code Sandbox.';
    } else if (interviewsCompleted === 0) {
      recommendedNextStep = 'Launch an interactive Mock Interview in the AI Simulator to rehearse technical and behavioral responses.';
    } else if (solvedProblemsCount < 5) {
      recommendedNextStep = `Solve ${5 - solvedProblemsCount} more coding challenges to achieve intermediate problem-solving readiness.`;
    } else if (savedRoadmapsCount === 0) {
      recommendedNextStep = 'Generate and save a custom Career Roadmap to align your preparation milestones.';
    } else if (liveQuizScore < 70) {
      recommendedNextStep = 'Review your Quiz History explanations and retry weaker topics to raise your accuracy above 75%.';
    } else {
      recommendedNextStep = 'Schedule a full 10-question challenging Mock Interview to fine-tune your placement readiness.';
    }

    res.status(200).json({
      success: true,
      data: {
        resumeScore,
        quizScore: liveQuizScore,
        quizzesTaken,
        skillsLearned: skills.length,
        problemsSolved: solvedProblemsCount,
        savedRoadmapsCount,
        interviewsCompleted,
        preparationProgress,
        recommendedNextStep
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save completed quiz attempt
// @route   POST /api/ai/quiz-attempt
// @access  Private (Candidate)
const saveQuizAttempt = async (req, res, next) => {
  try {
    const { topic, difficulty, score, totalQuestions, answers, feedback, subtopics, quizMode, unansweredCount } = req.body;

    const total = parseInt(totalQuestions, 10) || (answers ? answers.length : 1);
    const scoreVal = parseInt(score, 10) || 0;
    const accuracy = Math.round((scoreVal / total) * 100);

    const formattedAnswers = (answers || []).map(a => ({
      question: a.question || '',
      selectedAnswer: typeof a.selectedAnswer === 'number' ? a.selectedAnswer : -1,
      correctAnswer: typeof a.correctAnswer === 'number' ? a.correctAnswer : 0,
      isCorrect: Boolean(a.isCorrect),
      explanation: a.explanation || '',
      subtopic: a.subtopic || '',
      markedForReview: Boolean(a.markedForReview),
      isSkipped: Boolean(a.isSkipped || a.selectedAnswer === -1 || a.selectedAnswer === undefined)
    }));

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      topic: topic || 'General',
      difficulty: difficulty || 'Medium',
      score: scoreVal,
      totalQuestions: total,
      unansweredCount: parseInt(unansweredCount, 10) || 0,
      accuracy,
      subtopics: Array.isArray(subtopics) ? subtopics : (subtopics ? [subtopics] : []),
      quizMode: quizMode === 'test' ? 'test' : 'practice',
      answers: formattedAnswers,
      feedback: feedback || '',
    });

    res.status(201).json({
      success: true,
      message: 'Quiz attempt saved successfully',
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's past quiz history
// @route   GET /api/ai/quiz-history
// @access  Private (Candidate)
const getQuizHistory = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const totalAttempts = attempts.length;
    const avgAccuracy = totalAttempts > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.accuracy, 0) / totalAttempts)
      : 0;

    res.status(200).json({
      success: true,
      count: totalAttempts,
      avgAccuracy,
      data: attempts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save generated roadmap to candidate profile
// @route   POST /api/ai/save-roadmap
// @access  Private (Candidate)
const saveRoadmap = async (req, res, next) => {
  try {
    const { targetRole, currentSkillLevel, preferredLanguage, overview, estimatedDuration, stages } = req.body;

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'targetRole is required',
      });
    }

    const {
      preparationGoal,
      dreamCompany,
      placementTrack,
      milestones,
      suggestedProjects,
      interviewPrepSteps,
      realisticTimelineNote,
      companyDisclaimer,
    } = req.body;

    const saved = await SavedRoadmap.create({
      user: req.user._id,
      targetRole,
      currentSkillLevel: currentSkillLevel || 'Beginner',
      preferredLanguage: preferredLanguage || 'JavaScript',
      preparationGoal: preparationGoal || 'both',
      dreamCompany: dreamCompany || '',
      placementTrack: placementTrack || 'product',
      overview: overview || '',
      estimatedDuration: estimatedDuration || '',
      milestones: milestones || [],
      stages: stages || [],
      suggestedProjects: suggestedProjects || [],
      interviewPrepSteps: interviewPrepSteps || [],
      realisticTimelineNote: realisticTimelineNote || '',
      companyDisclaimer: companyDisclaimer || '',
    });

    // Phase 3 Notification: Dispatch Career Roadmap saved alert & in-app notification
    notifyRoadmapSaved(req.user, saved).catch(err => {
      console.error('[NOTIF] Failed to dispatch roadmap notification:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Roadmap saved to profile successfully',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all saved roadmaps for candidate
// @route   GET /api/ai/saved-roadmaps
// @access  Private (Candidate)
const getSavedRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await SavedRoadmap.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: roadmaps.length,
      data: roadmaps,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved roadmap
// @route   DELETE /api/ai/saved-roadmaps/:id
// @access  Private (Candidate)
const deleteSavedRoadmap = async (req, res, next) => {
  try {
    const deleted = await SavedRoadmap.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Saved roadmap not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Roadmap deleted',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Evaluate candidate mock interview answer using Gemma 3
// @route   POST /api/ai/evaluate-mock-answer
// @access  Private (Candidate)
const evaluateMockAnswer = async (req, res, next) => {
  try {
    const {
      question,
      answer,
      category = 'technical',
      targetRole = 'Software Engineer',
      candidateLevel = 'Student/Fresher',
      difficulty = 'Medium',
      isFollowUp = false,
      candidateContext = ''
    } = req.body;

    if (!question || !answer || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required',
      });
    }

    const trimmedAnswer = answer.trim();

    // Differentiated instructions based on interview type
    let evaluationCriteria = '';
    if (category === 'hr') {
      evaluationCriteria = `
        Round: HR / Behavioral
        Evaluation Criteria:
        1. Relevance to the question asked.
        2. Clarity and structure using the STAR method (Situation, Task, Action, Result).
        3. Specificity of the example (concrete details vs vague generalizations).
        4. Candidate's personal actions and measurable outcome/takeaways.
      `;
    } else if (category === 'technical') {
      evaluationCriteria = `
        Round: Technical Interview (${targetRole})
        Evaluation Criteria:
        1. Conceptual correctness and technical depth.
        2. Reasoning, architecture, data structure choices, and trade-off analysis.
        3. Completeness, edge cases, and performance/scalability considerations.
        4. Communication clarity and articulation of engineering concepts.
      `;
    } else {
      evaluationCriteria = `
        Round: Resume-Based Interview
        Evaluation Criteria:
        1. Consistency with stated background, technologies, and projects.
        2. Clear explanation of personal ownership and concrete contribution (not just team-level).
        3. Technical depth, problem-solving, and architectural rationale.
        4. Honesty and clarity in addressing project challenges.
      `;
    }

    const prompt = `
      You are an expert placement interviewer evaluating a candidate's spoken or written response.
      Role: ${targetRole}
      Level: ${candidateLevel} (Difficulty: ${difficulty})
      ${evaluationCriteria}
      Interview Question: "${question}"
      Candidate's Answer: "${trimmedAnswer}"

      Guidelines:
      - Score the answer realistically from 1 to 10 as practice feedback (1-4: Needs Work, 5-6: Fair, 7-8: Strong, 9-10: Excellent).
      - Clearly identify what the candidate did well (strengths: 2 concise bullet points).
      - Identify concrete opportunities for improvement (improvements: 2 concise bullet points).
      - Provide one concrete actionable suggestion for a stronger response (actionableAdvice: 1 sentence).
      - Provide an exemplary sample phrasing or response blueprint (idealAnswerSnippet: 2-3 sentences).
      - If the candidate's answer was partial, ambiguous, or intriguing, propose one concise follow-up question (followUpQuestion) to probe deeper. If the answer was complete or already a follow-up, set followUpQuestion to null.

      Respond strictly with a JSON object in this format:
      {
        "score": 8,
        "rating": "Strong",
        "strengths": [
          "What candidate did well point 1",
          "What candidate did well point 2"
        ],
        "improvements": [
          "Specific area to strengthen point 1",
          "Specific area to strengthen point 2"
        ],
        "actionableAdvice": "Concrete suggestion for next time.",
        "idealAnswerSnippet": "Model answer phrasing showcasing ideal depth.",
        "feedbackSummary": "1-2 sentence constructive interviewer assessment.",
        "followUpQuestion": null
      }
    `;

    const fallback = {
      score: 7,
      rating: 'Strong',
      strengths: [
        'Addressed the core intent of the question directly',
        'Communicated thoughts in a clear, professional tone'
      ],
      improvements: [
        category === 'hr' ? 'Structure more firmly with the STAR method (quantify the Result)' : 'Explicitly mention time/space complexities and architectural trade-offs',
        'Include a concrete metric or measurable business/engineering impact'
      ],
      actionableAdvice: category === 'hr' 
        ? 'Anchor your story around a specific hurdle and end with the positive team outcome.'
        : 'Highlight why you preferred this approach over alternate algorithms or libraries.',
      idealAnswerSnippet: 'State the problem concisely, your specific technical/operational execution, and the concrete outcome or performance gain.',
      feedbackSummary: 'Solid, credible response with good fundamentals. Elevate it by quantifying your impact with metrics.',
      followUpQuestion: null
    };

    const evaluation = await generateJSON(prompt, fallback, { num_predict: 550, temperature: 0.3 });

    // Validate structure
    const validatedEval = {
      score: typeof evaluation?.score === 'number' && evaluation.score >= 1 && evaluation.score <= 10 ? evaluation.score : fallback.score,
      rating: evaluation?.rating || fallback.rating,
      strengths: Array.isArray(evaluation?.strengths) && evaluation.strengths.length > 0 ? evaluation.strengths : fallback.strengths,
      improvements: Array.isArray(evaluation?.improvements) && evaluation.improvements.length > 0 ? evaluation.improvements : fallback.improvements,
      actionableAdvice: evaluation?.actionableAdvice || fallback.actionableAdvice,
      idealAnswerSnippet: evaluation?.idealAnswerSnippet || fallback.idealAnswerSnippet,
      feedbackSummary: evaluation?.feedbackSummary || fallback.feedbackSummary,
      followUpQuestion: isFollowUp ? null : (evaluation?.followUpQuestion || null)
    };

    res.status(200).json({
      success: true,
      data: validatedEval
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save completed interview session and generated comprehensive report
// @route   POST /api/ai/interview-session/save
// @access  Private (Candidate)
const saveInterviewSession = async (req, res, next) => {
  try {
    const {
      interviewType = 'technical',
      targetRole = 'Software Engineer',
      candidateLevel = 'Student/Fresher',
      difficulty = 'Medium',
      sessionLength = 5,
      practiceMode = 'practice',
      focusAreas = [],
      dreamCompany = '',
      placementTrack = '',
      questions = []
    } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Interview questions and answers are required to save a session'
      });
    }

    const answeredList = questions.filter(q => !q.isSkipped && q.candidateAnswer && q.candidateAnswer.trim());
    const questionsAnswered = answeredList.length;
    const questionsSkipped = questions.length - questionsAnswered;

    let totalScore = 0;
    answeredList.forEach(q => {
      totalScore += (q.evaluation && typeof q.evaluation.score === 'number') ? q.evaluation.score : 6;
    });
    const avgScore = questionsAnswered > 0 ? Number((totalScore / questionsAnswered).toFixed(1)) : 0;

    let rating = 'Needs Practice';
    if (avgScore >= 8.5) rating = 'Placement Ready — Exceptional';
    else if (avgScore >= 7.0) rating = 'Strong Candidate — Recommended';
    else if (avgScore >= 5.5) rating = 'Competent — Minor Revisions';
    else if (questionsAnswered > 0) rating = 'Developing — Needs Focused Drills';
    else rating = 'Incomplete';

    // Aggregate unique strengths and improvement points across answered questions
    const allStrengths = [];
    const allImprovements = [];
    answeredList.forEach(q => {
      if (q.evaluation?.strengths) allStrengths.push(...q.evaluation.strengths);
      if (q.evaluation?.improvements) allImprovements.push(...q.evaluation.improvements);
    });

    const keyStrengths = Array.from(new Set(allStrengths)).slice(0, 4);
    if (keyStrengths.length === 0) {
      keyStrengths.push('Demonstrated persistence through placement interview format');
    }

    const areasToImprove = Array.from(new Set(allImprovements)).slice(0, 4);
    if (areasToImprove.length === 0) {
      areasToImprove.push('Quantify technical and operational outcomes with measurable metrics');
    }

    // Curated recommendations for revision based on role & category
    const topicsToRevise = Array.isArray(focusAreas) && focusAreas.length > 0
      ? focusAreas.slice(0, 3)
      : interviewType === 'hr'
        ? ['STAR Technique for Behavioral Rounds', 'Communicating Technical Conflict', 'Prioritization Frameworks']
        : interviewType === 'technical'
          ? ['Core Algorithmic Complexity', 'Distributed System Trade-offs', 'Database Query Optimization']
          : ['Detailed Project Architecture', 'Key Component Contribution Metrics', 'Debugging Case Studies'];

    const nextSteps = [
      avgScore >= 7.5 ? 'Excellent work! Schedule a full 10-question Mock Interview to test time pressure.' : 'Review weaker questions and practice speaking answers aloud using STAR technique.',
      'Practice coding problems related to your identified weak topics in the Sandbox.',
      'Save this session report to track your interview readiness over time.'
    ];

    const overallReport = {
      score: avgScore,
      rating,
      questionsAnswered,
      questionsSkipped,
      keyStrengths,
      areasToImprove,
      topicsToRevise,
      nextSteps,
      summaryNote: `Completed a ${sessionLength}-question ${interviewType.toUpperCase()} ${practiceMode === 'mock' ? 'Mock Interview' : 'Practice Session'} for ${targetRole} with an average score of ${avgScore}/10.`
    };

    const session = await InterviewSession.create({
      user: req.user._id,
      interviewType,
      targetRole,
      candidateLevel,
      difficulty,
      sessionLength: Number(sessionLength) || 5,
      practiceMode,
      focusAreas,
      dreamCompany,
      placementTrack,
      questions,
      overallReport,
      status: 'completed'
    });

    // Phase 3 Notification: Dispatch Mock Interview performance summary & in-app notification
    notifyMockInterviewCompleted(req.user, session).catch(err => {
      console.error('[NOTIF] Failed to dispatch interview completion notification:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Interview practice session saved successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all interview practice sessions for logged-in candidate
// @route   GET /api/ai/interview-sessions
// @access  Private (Candidate)
const getInterviewSessions = async (req, res, next) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-questions.blueprint')
      .lean();

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single interview session details
// @route   GET /api/ai/interview-sessions/:id
// @access  Private (Candidate)
const getInterviewSessionById = async (req, res, next) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      user: req.user._id
    }).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeResume,
  getCareerRoadmap,
  getInterviewQuestions,
  generateQuiz,
  getRecommendations,
  getDashboardStats,
  saveQuizAttempt,
  getQuizHistory,
  saveRoadmap,
  getSavedRoadmaps,
  deleteSavedRoadmap,
  evaluateMockAnswer,
  saveInterviewSession,
  getInterviewSessions,
  getInterviewSessionById,
};
