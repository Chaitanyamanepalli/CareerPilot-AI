import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FileText,
  Compass,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Upload,
  Brain,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Check,
  X,
  Play,
  RotateCcw,
  Bookmark,
  Trash2,
  History,
  MessageSquare,
  CheckCircle,
  Star,
  Target,
  Briefcase,
  Building2,
  Code2,
  CheckSquare,
  Boxes,
  Calendar,
  Zap,
  Layers,
  Mic,
  MicOff,
  Send,
  SkipForward,
  RefreshCw,
  Lightbulb,
  Flag,
  ArrowLeft
} from 'lucide-react';

const SUBJECT_SUBTOPICS = {
  'Data Structures & Algorithms': [
    'Arrays',
    'Strings',
    'Linked Lists',
    'Stacks and Queues',
    'Trees',
    'Graphs',
    'Sorting',
    'Searching',
    'Dynamic Programming',
    'Mixed Practice'
  ],
  'Python Programming': [
    'Data Structures (Lists, Dicts, Sets)',
    'OOP & Classes',
    'Decorators & Generators',
    'File I/O & Exceptions',
    'Lambda & Comprehensions',
    'Mixed Practice'
  ],
  'Java & OOP': [
    'OOP Principles (Inheritance, Polymorphism)',
    'Collections Framework',
    'Multithreading & Concurrency',
    'Exception Handling',
    'JVM & Memory Management',
    'Mixed Practice'
  ],
  'C++ & STL': [
    'Pointers & Memory Management',
    'STL Containers (Vector, Map, Set)',
    'Iterators & Algorithms',
    'OOP & Templates',
    'Move Semantics & Smart Pointers',
    'Mixed Practice'
  ],
  'JavaScript (ES6+)': [
    'Scope & Closures',
    'Promises & Async/Await',
    'Prototypes & this',
    'Event Loop & Web APIs',
    'Array Methods & ES6+',
    'DOM & Events',
    'Mixed Practice'
  ],
  'React & Frontend': [
    'Components & Props',
    'Hooks (useState, useEffect, useMemo)',
    'State Management & Context',
    'Virtual DOM & Lifecycle',
    'Routing & Performance',
    'Mixed Practice'
  ],
  'Node.js & Backend': [
    'Event Loop & Streams',
    'Express Routing & Middleware',
    'REST API Design',
    'Authentication & JWT',
    'Error Handling & Logging',
    'Mixed Practice'
  ],
  'SQL & Relational DB': [
    'Joins & Subqueries',
    'Indexing & Query Plans',
    'Aggregations & GROUP BY',
    'Transactions & ACID',
    'Schema Design & Normalization',
    'Mixed Practice'
  ],
  'MongoDB & NoSQL': [
    'Document Modeling & Embedding',
    'Aggregation Pipelines',
    'Indexing & Performance',
    'CRUD & Transactions',
    'Mixed Practice'
  ],
  'Operating Systems': [
    'Processes & Threads',
    'Deadlocks & Synchronization',
    'Virtual Memory & Paging',
    'CPU Scheduling',
    'Mixed Practice'
  ],
  'Computer Networks': [
    'TCP vs UDP & 3-Way Handshake',
    'HTTP/HTTPS & TLS Handshake',
    'DNS Resolution',
    'OSI & TCP/IP Model',
    'Mixed Practice'
  ],
  'Object-Oriented Design': [
    'SOLID Principles',
    'Factory & Singleton Patterns',
    'Observer & Strategy Patterns',
    'Design Pattern Tradeoffs',
    'Mixed Practice'
  ],
  'System Design': [
    'Caching & Redis',
    'Load Balancing & Proxies',
    'Database Sharding & Replication',
    'Message Queues (Kafka/RabbitMQ)',
    'Microservices vs Monolith',
    'Mixed Practice'
  ],
  'Cloud & DevOps': [
    'Docker & Containerization',
    'CI/CD Pipelines',
    'Kubernetes Fundamentals',
    'AWS Core Services (S3, EC2, IAM)',
    'Mixed Practice'
  ],
  'Machine Learning': [
    'Supervised vs Unsupervised',
    'Loss Functions & Optimizers',
    'Overfitting & Regularization',
    'Model Evaluation Metrics',
    'Mixed Practice'
  ],
  'Web Security': [
    'SQL Injection & XSS',
    'CSRF & CORS',
    'Authentication & Passwords (Bcrypt)',
    'OWASP Top 10 Best Practices',
    'Mixed Practice'
  ]
};

const AIPreparation = ({ onPageChange, user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dashboard Stats State
  const [stats, setStats] = useState(null);

  // Resume Analysis State
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  // Roadmap Form & Result State
  const [roadmapForm, setRoadmapForm] = useState({
    targetRole: 'Full Stack Developer',
    currentSkillLevel: 'Beginner',
    preferredLanguage: 'JavaScript',
    preparationGoal: 'both', // 'general' | 'targeted' | 'both'
    dreamCompany: '',
    placementTrack: 'Product-Based', // 'Product-Based' | 'Service-Based' | 'Startup' | 'Other'
    targetTimeline: '3_months', // '1_month' | '3_months' | '6_months' | 'recommend'
    knownSkills: '',
    dailyStudyTime: '1_hour' // '30_min' | '1_hour' | '2_hours' | '3_hours_plus'
  });
  const [roadmap, setRoadmap] = useState(null);

  // Saved Roadmaps State
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [selectedSavedRoadmap, setSelectedSavedRoadmap] = useState(null);

  // Interactive Interview Simulator State
  const [interviewStep, setInterviewStep] = useState('setup'); // 'setup' | 'active' | 'feedback' | 'report' | 'history'
  const [interviewForm, setInterviewForm] = useState({
    interviewType: 'technical', // 'hr' | 'technical' | 'resume'
    targetRole: 'Full Stack Developer',
    candidateLevel: 'Student/Fresher', // 'Student/Fresher' | 'Intern' | 'Experienced'
    difficulty: 'Medium', // 'Easy' | 'Medium' | 'Challenging'
    sessionLength: 5, // 5 | 10
    practiceMode: 'practice', // 'practice' | 'mock'
    focusAreas: [],
    dreamCompany: '',
    placementTrack: 'Product-Based',
    customResumeText: '',
    useProfileResume: true,
  });
  const [activeSession, setActiveSession] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSavedSuccess, setSessionSavedSuccess] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [isAnsweringFollowUp, setIsAnsweringFollowUp] = useState(false);
  const [evaluatingFollowUp, setEvaluatingFollowUp] = useState(false);

  // Backward compatibility legacy state
  const [interviewType, setInterviewType] = useState('technical');
  const [interviewQuestions, setInterviewQuestions] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [mockAnswers, setMockAnswers] = useState({});
  const [evaluatingIdx, setEvaluatingIdx] = useState(null);
  const [mockEvaluations, setMockEvaluations] = useState({});

  // Quiz Form & Live State
  const [quizForm, setQuizForm] = useState({
    topic: 'Data Structures & Algorithms',
    difficulty: 'Medium',
    numQuestions: 5,
    subtopics: ['Mixed Practice'],
    quizMode: 'practice' // 'practice' | 'test'
  });
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [reviewedQuestions, setReviewedQuestions] = useState({});
  const [practiceChecked, setPracticeChecked] = useState({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [showUnansweredConfirm, setShowUnansweredConfirm] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [retryMode, setRetryMode] = useState(false);
  const [resultFilter, setResultFilter] = useState('all'); // 'all' | 'missed' | 'review'

  // Quiz History State
  const [quizHistory, setQuizHistory] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  // Skill Recommendations State
  const [recommendations, setRecommendations] = useState(null);

  // Fetch Dashboard Stats & Recommendations on Mount
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const statsRes = await api.getAIDashboardStats();
      setStats(statsRes.data);

      const recsRes = await api.getAIRecommendations();
      setRecommendations(recsRes.data);
    } catch (err) {
      console.error('Error fetching AI prep dashboard:', err.message);
      setError('Could not load preparation details. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Speech Recognition for Interactive Verbal Answers
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      setSpeechSupported(true);
      try {
        const sr = new SpeechRec();
        sr.continuous = true;
        sr.interimResults = true;
        sr.lang = 'en-US';
        sr.onresult = (event) => {
          let text = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              text += event.results[i][0].transcript + ' ';
            }
          }
          if (text) {
            setCurrentAnswer(prev => prev ? `${prev.trim()} ${text.trim()}` : text.trim());
          }
        };
        sr.onerror = (e) => {
          console.warn('Speech recognition error:', e.error);
          setIsRecording(false);
        };
        sr.onend = () => {
          setIsRecording(false);
        };
        setRecognition(sr);
      } catch (err) {
        console.warn('Speech recognition init error:', err);
      }
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognition) {
      setError('Voice recognition is not supported in this browser. You can type your answer in the box.');
      return;
    }
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech start error:', err);
        setIsRecording(false);
      }
    }
  };

  const fetchSavedRoadmaps = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getSavedRoadmaps();
      setSavedRoadmaps(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load saved roadmaps');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteSavedRoadmap = async (id) => {
    try {
      await api.deleteSavedRoadmap(id);
      setSavedRoadmaps(prev => prev.filter(r => r._id !== id));
      if (selectedSavedRoadmap && selectedSavedRoadmap._id === id) {
        setSelectedSavedRoadmap(null);
      }
      setSuccess('Roadmap removed from your profile.');
    } catch (err) {
      setError(err.message || 'Failed to delete roadmap');
    }
  };

  const fetchQuizHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getQuizHistory();
      setQuizHistory(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load quiz history');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateMockAnswer = async (idx, questionText) => {
    const candidateAnswer = mockAnswers[idx];
    if (!candidateAnswer || !candidateAnswer.trim()) {
      setError('Please type your answer before requesting evaluation.');
      return;
    }
    setError('');
    setEvaluatingIdx(idx);
    try {
      const res = await api.evaluateMockAnswer({
        question: questionText,
        answer: candidateAnswer,
        category: interviewType,
        targetRole: roadmapForm.targetRole || 'Software Engineer'
      });
      setMockEvaluations(prev => ({
        ...prev,
        [idx]: res.data
      }));
    } catch (err) {
      setError(err.message || 'Failed to evaluate answer with AI');
    } finally {
      setEvaluatingIdx(null);
    }
  };

  // 1. Analyze Resume Handler
  const handleAnalyzeResume = async (e, useProfile = false) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (!useProfile && !resumeFile) {
      setError('Please select a PDF resume file to upload.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      if (!useProfile) {
        formData.append('resume', resumeFile);
      }
      // If we want a specific target role, pass it as text parameter
      formData.append('targetRole', roadmapForm.targetRole);

      const res = await api.analyzeResume(formData);
      setResumeAnalysis(res.data);
      setSuccess('Resume analyzed successfully!');
      
      // Refresh general stats
      const statsRes = await api.getAIDashboardStats();
      setStats(statsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to analyze resume.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Roadmap Handler
  const handleGenerateRoadmap = async (e) => {
    if (e) e.preventDefault();
    if (!roadmapForm.targetRole || !roadmapForm.targetRole.trim()) {
      setError('Please provide a target role or career goal.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const res = await api.getCareerRoadmap({
        ...roadmapForm,
        targetRole: roadmapForm.targetRole.trim()
      });
      setRoadmap(res.data);
      setSuccess('Career roadmap generated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to generate career roadmap.');
    } finally {
      setLoading(false);
    }
  };

  // Sync known skills from candidate profile or resume
  const handleSyncProfileSkills = () => {
    const skills = user?.skills || user?.parsedResumeData?.skills || [];
    if (skills.length > 0) {
      setRoadmapForm(prev => ({
        ...prev,
        knownSkills: skills.join(', ')
      }));
      setSuccess('Loaded ' + skills.length + ' skills from your profile!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('No skills found in profile. You can enter your skills manually above.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Save generated roadmap to candidate profile
  const handleSaveRoadmap = async () => {
    if (!roadmap) return;
    try {
      setSavingRoadmap(true);
      setError('');
      await api.saveRoadmap({
        targetRole: roadmap.role || roadmapForm.targetRole,
        currentSkillLevel: roadmap.skillLevel || roadmapForm.currentSkillLevel,
        preferredLanguage: roadmap.language || roadmapForm.preferredLanguage,
        preparationGoal: roadmap.preparationGoal || roadmapForm.preparationGoal,
        dreamCompany: roadmap.dreamCompany || roadmapForm.dreamCompany,
        placementTrack: roadmap.placementTrack || roadmapForm.placementTrack,
        overview: roadmap.realisticTimelineNote || '',
        estimatedDuration: roadmap.estimatedDuration || '',
        milestones: roadmap.milestones || roadmap.learningOrder || [],
        stages: (roadmap.milestones || roadmap.learningOrder || []).map(m => ({
          stageName: m.title,
          duration: m.timeline,
          topics: m.skills || [],
          projects: m.deliverable ? [m.deliverable] : []
        })),
        suggestedProjects: roadmap.suggestedProjects || [],
        interviewPrepSteps: roadmap.interviewPrepSteps || [],
        realisticTimelineNote: roadmap.realisticTimelineNote || '',
        companyDisclaimer: roadmap.companyDisclaimer || ''
      });
      setSuccess('Roadmap saved to your profile successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error saving roadmap:', err.message);
      setError('Could not save roadmap to profile.');
    } finally {
      setSavingRoadmap(false);
    }
  };

  // Interactive Interview Simulator Session Handlers
  const handleStartInterviewSession = async (overrideType) => {
    setError('');
    setSuccess('');
    setLoading(true);

    const typeToUse = overrideType || interviewForm.interviewType;
    try {
      const res = await api.getInterviewQuestions({
        interviewType: typeToUse,
        targetRole: interviewForm.targetRole,
        candidateLevel: interviewForm.candidateLevel,
        difficulty: interviewForm.difficulty,
        sessionLength: interviewForm.sessionLength,
        practiceMode: interviewForm.practiceMode,
        focusAreas: interviewForm.focusAreas,
        dreamCompany: interviewForm.dreamCompany,
        placementTrack: interviewForm.placementTrack,
        customResumeText: interviewForm.useProfileResume ? '' : interviewForm.customResumeText
      });

      const list = Array.isArray(res.data) ? res.data : (res.data?.questions || res.data?.data || []);
      if (!list || list.length === 0) {
        throw new Error('Failed to generate interview questions. Please try again.');
      }

      setActiveSession({
        config: { ...interviewForm, interviewType: typeToUse },
        questions: list,
        currentIndex: 0,
        answers: {},
        skipped: {},
        evaluations: {},
        followUps: {},
        report: null,
      });
      setCurrentAnswer('');
      setShowBlueprint(false);
      setIsAnsweringFollowUp(false);
      setFollowUpAnswer('');
      setInterviewStep('active');
    } catch (err) {
      setError(err.message || 'Failed to start interview session');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer || !currentAnswer.trim()) {
      setError('Please type or speak your answer before submitting.');
      return;
    }
    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
    }
    setError('');

    const currentIndex = activeSession.currentIndex;
    const currentQ = activeSession.questions[currentIndex];
    const candidateAns = currentAnswer.trim();

    if (activeSession.config.practiceMode === 'practice') {
      // Practice Mode: Evaluate immediately
      setEvaluatingAnswer(true);
      try {
        const evalRes = await api.evaluateMockAnswer({
          question: currentQ.q || currentQ.question,
          answer: candidateAns,
          category: activeSession.config.interviewType,
          targetRole: activeSession.config.targetRole,
          candidateLevel: activeSession.config.candidateLevel,
          difficulty: activeSession.config.difficulty,
        });

        setActiveSession(prev => ({
          ...prev,
          answers: { ...prev.answers, [currentIndex]: candidateAns },
          evaluations: { ...prev.evaluations, [currentIndex]: evalRes.data }
        }));
        setInterviewStep('feedback');
      } catch (err) {
        setError(err.message || 'Failed to evaluate answer with AI');
      } finally {
        setEvaluatingAnswer(false);
      }
    } else {
      // Mock Interview Mode: quiet recording without immediate feedback
      const updatedAnswers = { ...activeSession.answers, [currentIndex]: candidateAns };
      if (currentIndex === activeSession.questions.length - 1) {
        // Last question in Mock Mode! Proceed to final report compilation
        handleFinishSession({
          ...activeSession,
          answers: updatedAnswers
        });
      } else {
        setActiveSession(prev => ({
          ...prev,
          answers: updatedAnswers,
          currentIndex: prev.currentIndex + 1
        }));
        setCurrentAnswer('');
        setShowBlueprint(false);
      }
    }
  };

  const handleSkipQuestion = () => {
    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
    }
    setError('');
    const currentIndex = activeSession.currentIndex;
    const updatedSkipped = { ...activeSession.skipped, [currentIndex]: true };

    if (currentIndex === activeSession.questions.length - 1) {
      handleFinishSession({
        ...activeSession,
        skipped: updatedSkipped
      });
    } else {
      setActiveSession(prev => ({
        ...prev,
        skipped: updatedSkipped,
        currentIndex: prev.currentIndex + 1
      }));
      setCurrentAnswer('');
      setShowBlueprint(false);
      setIsAnsweringFollowUp(false);
      setFollowUpAnswer('');
      setInterviewStep('active');
    }
  };

  const handleNextFromFeedback = () => {
    const currentIndex = activeSession.currentIndex;
    if (currentIndex === activeSession.questions.length - 1) {
      handleFinishSession();
    } else {
      setActiveSession(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1
      }));
      setCurrentAnswer('');
      setShowBlueprint(false);
      setIsAnsweringFollowUp(false);
      setFollowUpAnswer('');
      setInterviewStep('active');
    }
  };

  const handleFinishSession = async (sessionDataToFinalize) => {
    const s = sessionDataToFinalize || activeSession;
    if (!s) return;
    setSavingSession(true);
    setLoading(true);

    try {
      // Build question records for saving
      const finalQuestionsList = s.questions.map((q, idx) => ({
        questionNumber: idx + 1,
        question: q.q || q.question,
        blueprint: q.a || q.blueprint || '',
        candidateAnswer: s.answers[idx] || '',
        isSkipped: !!s.skipped[idx],
        evaluation: s.evaluations[idx] || (s.answers[idx] ? {
          score: 7,
          rating: 'Completed',
          strengths: ['Addressed the placement question during simulation'],
          improvements: ['Review suggested structure to add concrete metrics'],
          actionableAdvice: 'Quantify your technical and business impacts in interview responses.',
          idealAnswerSnippet: q.a || q.blueprint || '',
          feedbackSummary: 'Completed during full Mock Interview session.'
        } : null),
        followUpQuestion: s.followUps[idx]?.question || '',
        followUpAnswer: s.followUps[idx]?.answer || ''
      }));

      const saveRes = await api.saveInterviewSession({
        interviewType: s.config.interviewType,
        targetRole: s.config.targetRole,
        candidateLevel: s.config.candidateLevel,
        difficulty: s.config.difficulty,
        sessionLength: s.config.sessionLength,
        practiceMode: s.config.practiceMode,
        focusAreas: s.config.focusAreas,
        dreamCompany: s.config.dreamCompany,
        placementTrack: s.config.placementTrack,
        questions: finalQuestionsList
      });

      setActiveSession(prev => ({
        ...prev,
        report: saveRes.data?.overallReport || null,
        savedId: saveRes.data?._id
      }));
      setSessionSavedSuccess(true);
      setInterviewStep('report');
      // Refresh general dashboard stats so interview counter updates
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to save interview session report:', err);
      // Even if network fails to save, show local report
      setInterviewStep('report');
    } finally {
      setSavingSession(false);
      setLoading(false);
    }
  };

  const fetchInterviewHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getInterviewSessions();
      setInterviewHistory(res.data || []);
      setInterviewStep('history');
    } catch (err) {
      setError(err.message || 'Failed to fetch interview history');
    } finally {
      setLoading(false);
    }
  };

  // Backward compatibility alias for legacy triggers
  const handleGetInterviewPrep = (type) => {
    setInterviewForm(prev => ({ ...prev, interviewType: type }));
    handleStartInterviewSession(type);
  };

  // 4. Generate & Manage Quiz Handlers
  const handleToggleSubtopic = (subtopic) => {
    setQuizForm(prev => {
      const current = prev.subtopics || [];
      if (subtopic === 'Mixed Practice') {
        return { ...prev, subtopics: ['Mixed Practice'] };
      }

      let nextSubtopics;
      if (current.includes(subtopic)) {
        nextSubtopics = current.filter(s => s !== subtopic);
        if (nextSubtopics.length === 0) {
          nextSubtopics = ['Mixed Practice'];
        }
      } else {
        nextSubtopics = [...current.filter(s => s !== 'Mixed Practice'), subtopic];
      }
      return { ...prev, subtopics: nextSubtopics };
    });
  };

  const handleTopicChange = (newTopic) => {
    setQuizForm(prev => ({
      ...prev,
      topic: newTopic,
      subtopics: ['Mixed Practice']
    }));
  };

  const toggleMarkReview = (idx) => {
    setReviewedQuestions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleCheckAnswerInPractice = (idx) => {
    setPracticeChecked(prev => ({
      ...prev,
      [idx]: true
    }));
  };

  const handleStartQuiz = async (e, customConfig = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSelectedAnswers({});
    setReviewedQuestions({});
    setPracticeChecked({});
    setCurrentQuizIndex(0);
    setQuizResult(null);
    setShowUnansweredConfirm(false);
    setRetryMode(false);
    setResultFilter('all');

    const config = customConfig || quizForm;
    try {
      setLoading(true);
      const res = await api.getQuizQuestions(
        config.topic,
        config.difficulty,
        config.numQuestions,
        config.subtopics,
        config.quizMode
      );
      const list = Array.isArray(res.data) ? res.data : (res.data?.questions || res.data?.data || []);
      if (!list || list.length === 0) {
        throw new Error('No questions could be generated. Please try again.');
      }
      setQuizQuestions(list);
      setQuizActive(true);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleQuizSubmit = async () => {
    if (!quizQuestions || quizQuestions.length === 0 || isSubmittingQuiz) return;
    setIsSubmittingQuiz(true);

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const subtopicStats = {};

    const answerDetails = quizQuestions.map((q, idx) => {
      const selectedAnswer = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
      const isUnanswered = selectedAnswer === -1;
      const isCorrect = !isUnanswered && selectedAnswer === q.correctAnswer;
      const subtopicName = q.subtopic || quizForm.topic;

      if (isCorrect) {
        correctCount++;
      } else if (isUnanswered) {
        unansweredCount++;
      } else {
        incorrectCount++;
      }

      if (!subtopicStats[subtopicName]) {
        subtopicStats[subtopicName] = { total: 0, correct: 0 };
      }
      subtopicStats[subtopicName].total++;
      if (isCorrect) {
        subtopicStats[subtopicName].correct++;
      }

      return {
        question: q.question,
        selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
        subtopic: subtopicName,
        markedForReview: Boolean(reviewedQuestions[idx]),
        isSkipped: isUnanswered
      };
    });

    const total = quizQuestions.length;
    const percent = Math.round((correctCount / total) * 100);

    const subtopicBreakdown = {};
    Object.keys(subtopicStats).forEach(st => {
      const { total: stTotal, correct: stCorrect } = subtopicStats[st];
      subtopicBreakdown[st] = {
        total: stTotal,
        correct: stCorrect,
        percentage: Math.round((stCorrect / stTotal) * 100)
      };
    });

    let feedback = '';
    if (percent >= 80) {
      feedback = 'Outstanding practice run! You demonstrated solid command of these core concepts. Review any edge cases below.';
    } else if (percent >= 60) {
      feedback = 'Good practice session! Solid foundational understanding, with a few concept gaps to target in weak areas.';
    } else {
      feedback = 'Valuable diagnostic session! Use the explanations below and the "Practise weak areas" button to build confidence.';
    }

    setQuizResult({
      score: correctCount,
      total,
      percentage: percent,
      correctCount,
      incorrectCount,
      unansweredCount,
      subtopicBreakdown,
      feedback,
      answers: answerDetails,
      quizMode: quizForm.quizMode
    });
    setQuizActive(false);
    setShowUnansweredConfirm(false);

    try {
      await api.saveQuizAttempt({
        topic: quizForm.topic,
        difficulty: quizForm.difficulty,
        score: correctCount,
        totalQuestions: total,
        unansweredCount,
        subtopics: quizForm.subtopics,
        quizMode: quizForm.quizMode,
        answers: answerDetails,
        feedback
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to save quiz attempt:', err.message);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleRetryMissedQuestions = () => {
    if (!quizResult || !quizQuestions) return;
    const missed = quizQuestions.filter((q, idx) => {
      const selected = selectedAnswers[idx];
      return selected === undefined || selected !== q.correctAnswer;
    });

    if (missed.length === 0) {
      setSelectedAnswers({});
      setReviewedQuestions({});
      setPracticeChecked({});
      setCurrentQuizIndex(0);
      setQuizResult(null);
      setQuizActive(true);
      return;
    }

    setQuizQuestions(missed);
    setSelectedAnswers({});
    setReviewedQuestions({});
    setPracticeChecked({});
    setCurrentQuizIndex(0);
    setQuizResult(null);
    setQuizActive(true);
    setRetryMode(true);
  };

  const handlePracticeWeakAreas = () => {
    if (!quizResult) return;
    const breakdown = quizResult.subtopicBreakdown || {};
    const subtopicKeys = Object.keys(breakdown);
    let weakSubtopics = subtopicKeys.filter(st => breakdown[st].percentage < 70);

    if (weakSubtopics.length === 0 && subtopicKeys.length > 0) {
      weakSubtopics = [subtopicKeys.sort((a, b) => breakdown[a].percentage - breakdown[b].percentage)[0]];
    }

    if (weakSubtopics.length === 0) {
      weakSubtopics = quizForm.subtopics;
    }

    const updatedForm = {
      ...quizForm,
      subtopics: weakSubtopics,
      numQuestions: Math.max(weakSubtopics.length * 2, 5)
    };
    setQuizForm(updatedForm);
    handleStartQuiz(null, updatedForm);
  };

  // Render Sub-Sections
  const renderDashboardTab = () => {
    if (!stats) return <div style={{ color: 'var(--text-secondary)' }}>No statistics recorded. Please try again.</div>;

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          
          {/* Resume Score Card */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" stroke="var(--border-color)" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="var(--accent)" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.resumeScore / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '1.5rem', fontWeight: 800 }}>{stats.resumeScore}</span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Resume Score</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Based on profile matching</span>
            <button className="btn-text-action" onClick={() => setActiveTab('resume')} style={{ marginTop: '0.75rem' }}>
              Optimize Resume <ArrowRight size={12} />
            </button>
          </div>

          {/* Quiz Score Card */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" stroke="var(--border-color)" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#38bdf8" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - (stats.quizzesTaken > 0 ? stats.quizScore : 0) / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '1.5rem', fontWeight: 800 }}>
                {stats.quizzesTaken > 0 ? `${stats.quizScore}%` : '0%'}
              </span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Quiz Performance</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {stats.quizzesTaken > 0 ? `Avg accuracy across ${stats.quizzesTaken} quiz${stats.quizzesTaken > 1 ? 'zes' : ''}` : 'No quizzes attempted yet'}
            </span>
            <button className="btn-text-action" onClick={() => setActiveTab('quiz')} style={{ marginTop: '0.75rem', color: '#38bdf8' }}>
              Take A Quiz <ArrowRight size={12} />
            </button>
          </div>

          {/* Skills Learned Card */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', marginBottom: '1rem', fontSize: '2rem', fontWeight: 800 }}>
              {stats.skillsLearned}
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Skills Acquired</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Registered in profile</span>
            <button className="btn-text-action" onClick={() => onPageChange('/profile')} style={{ marginTop: '0.75rem', color: 'var(--success)' }}>
              Edit Skills <ArrowRight size={12} />
            </button>
          </div>

          {/* Prep Progress Card */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', padding: '1.75rem', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Preparation Stage</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Readiness</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-hover)' }}>{stats.preparationProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ width: `${stats.preparationProgress}%`, height: '100%', backgroundColor: 'var(--accent)', borderRadius: '6px', transition: 'width 0.6s ease' }}></div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Continue learning and testing to approach 100% job-readiness.
            </p>
          </div>
        </div>

        {/* Dashboard Lower Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Next Steps Recommendations Card */}
          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-hover)' }}>
              <Sparkles size={20} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Recommended Next Step</h2>
            </div>
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid var(--accent)', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {stats.recommendedNextStep}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => setActiveTab('roadmap')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Build Career Roadmap <Compass size={16} />
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveTab('interview')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Practice Mock Interviews <Brain size={16} />
              </button>
            </div>
          </div>

          {/* Quick Stats list / tips */}
          <div className="card-glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>AI Preparation Advantage</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Job seekers who complete custom roadmaps and resume scoring are 3.5x more likely to secure first-round technical interviews.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Identify hidden tech skills missing from your resume layouts.</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expand technical answers under structured role simulations.</span>
                </div>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => setActiveTab('recommendations')} style={{ width: '100%', marginTop: '1.5rem' }}>
              View Skill Recommendations
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResumeTab = () => {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }} className="tab-container-row">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* File Upload panel */}
          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.7rem' }}>Upload Resume PDF</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Upload your resume in PDF format to evaluate content coverage, identify key missing keywords, and verify strengths.
            </p>

            <form onSubmit={(e) => handleAnalyzeResume(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '2rem 1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-primary)', cursor: 'pointer', position: 'relative' }}>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                <Upload size={36} style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', opacity: 0.7 }} />
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  {resumeFile ? resumeFile.name : 'Click or Drag PDF here'}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Maximum file size: 5MB</span>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !resumeFile}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Analyze Uploaded PDF <Sparkles size={16} />
              </button>
            </form>

            {user.resumeUrl && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Profile Resume Detected</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  You have already uploaded a resume to your CareerPilot AI Profile.
                </p>
                <button 
                  onClick={() => handleAnalyzeResume(null, true)} 
                  className="btn btn-secondary" 
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  Analyze Profile Resume
                </button>
              </div>
            )}
          </div>

          {/* Analysis Results View */}
          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>Analysis Report</h2>

            {!resumeAnalysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ fontWeight: 600 }}>No Analysis Generated Yet</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Upload a PDF resume or click Analyze Profile Resume to evaluate your resume details.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
                
                {/* Score section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111111', fontSize: '1.5rem', fontWeight: 800 }}>
                    {resumeAnalysis.resumeScore}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Overall Score</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Role: {resumeAnalysis.targetRole}</p>
                  </div>
                </div>

                {/* Extracted Skills */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> Extracted Skills
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {resumeAnalysis.extractedSkills.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>None found. Update your profile settings.</span>
                    ) : (
                      resumeAnalysis.extractedSkills.map(skill => (
                        <span key={skill} className="badge badge-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.25rem 0.6rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={16} style={{ color: 'var(--error)' }} /> Missing Key Skills
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {resumeAnalysis.missingSkills.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--success)' }}>Your resume matches the target skills perfectly!</span>
                    ) : (
                      resumeAnalysis.missingSkills.map(skill => (
                        <span key={skill} className="badge badge-error" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.25rem 0.6rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>Key Strengths</h3>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {resumeAnalysis.strengths.map((str, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>{str}</li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>Areas for Improvement</h3>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {resumeAnalysis.areasForImprovement.map((area, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ROLE_SUGGESTIONS = [
    'Full Stack',
    'Backend',
    'AI/ML',
    'Cloud / DevOps',
    'Mobile Dev',
    'Data Engineer'
  ];

  const renderRoadmapTab = () => {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Roadmap Form panel */}
          <div className="card-glass" style={{ padding: '1.75rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(163, 230, 53, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <Compass size={18} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Roadmap Criteria</h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Configure your placement target, preparation strategy, and study habits to generate a tailored milestone roadmap.
            </p>

            <form onSubmit={handleGenerateRoadmap} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* 1. Target Role: Text Input + Quick-Pick Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Target size={14} style={{ color: 'var(--accent)' }} /> Target Role / Career Goal *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Custom or predefined</span>
                </div>
                <input
                  type="text"
                  value={roadmapForm.targetRole}
                  onChange={(e) => setRoadmapForm(prev => ({ ...prev, targetRole: e.target.value }))}
                  placeholder="e.g. Full Stack Developer, SDE-1 at a product-based company..."
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                
                {/* Quick-Pick Role Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '0.2rem' }}>
                    Quick suggestions:
                  </span>
                  {ROLE_SUGGESTIONS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setRoadmapForm(prev => ({ ...prev, targetRole: `${chip} Developer` }))}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: roadmapForm.targetRole.toLowerCase().includes(chip.toLowerCase())
                          ? 'rgba(163, 230, 53, 0.15)'
                          : 'var(--bg-primary)',
                        color: roadmapForm.targetRole.toLowerCase().includes(chip.toLowerCase())
                          ? 'var(--accent-hover)'
                          : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Preparation Goal: General, Targeted, or Both */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Preparation Goal *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { id: 'both', label: 'Both (Recommended)', desc: 'General foundation + focused company/track modules' },
                    { id: 'general', label: 'General Placement', desc: 'Broad, transferable fundamentals across hiring tracks' },
                    { id: 'targeted', label: 'Company / Track', desc: 'Optimized specifically for a company or hiring track' }
                  ].map((goal) => {
                    const isSelected = roadmapForm.preparationGoal === goal.id;
                    return (
                      <div
                        key={goal.id}
                        onClick={() => setRoadmapForm(prev => ({ ...prev, preparationGoal: goal.id }))}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'rgba(163, 230, 53, 0.08)' : 'var(--bg-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.2rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? 'var(--accent-hover)' : 'var(--text-primary)' }}>
                            {goal.label}
                          </span>
                          <span style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                            backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                            display: 'inline-block'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                          {goal.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Progressive Disclosure: Dream Company & Track (when targeted or both) */}
              {(roadmapForm.preparationGoal === 'both' || roadmapForm.preparationGoal === 'targeted') && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  animation: 'fadeIn 0.25s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                    <Building2 size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Company & Placement Track Focus</span>
                  </div>

                  {/* Dream Company (Optional) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Dream Company (Optional)
                    </label>
                    <input
                      type="text"
                      value={roadmapForm.dreamCompany}
                      onChange={(e) => setRoadmapForm(prev => ({ ...prev, dreamCompany: e.target.value }))}
                      placeholder="e.g. Google, Amazon, Microsoft, Swiggy, or leave blank"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      Guidance notice: If company-specific proprietary criteria is unavailable, a track-based plan will be provided.
                    </span>
                  </div>

                  {/* Placement Track & Target Timeline */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        <Briefcase size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Hiring Track
                      </label>
                      <select
                        value={roadmapForm.placementTrack}
                        onChange={(e) => setRoadmapForm(prev => ({ ...prev, placementTrack: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--input-bg)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      >
                        <option value="Product-Based">Product-Based (DSA & System Design)</option>
                        <option value="Service-Based">Service-Based (Core CS & Aptitude)</option>
                        <option value="Startup">Startup (Full-Stack MVPs & Autonomy)</option>
                        <option value="Other">Other / General Technology Track</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Target Timeline
                      </label>
                      <select
                        value={roadmapForm.targetTimeline}
                        onChange={(e) => setRoadmapForm(prev => ({ ...prev, targetTimeline: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--input-bg)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      >
                        <option value="3_months">3 Months (Intensive Preparation)</option>
                        <option value="1_month">1 Month (Fast-Track Sprint)</option>
                        <option value="6_months">6 Months (Comprehensive Mastery)</option>
                        <option value="recommend">Recommend ideal timeline</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Personalization: Current Level & Preferred Language */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Current Level</label>
                  <select 
                    value={roadmapForm.currentSkillLevel}
                    onChange={(e) => setRoadmapForm(prev => ({ ...prev, currentSkillLevel: e.target.value }))}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
                  >
                    <option value="Beginner">Beginner (Foundations)</option>
                    <option value="Intermediate">Intermediate (Building projects)</option>
                    <option value="Advanced">Advanced (Interview ready)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Preferred Language</label>
                  <select 
                    value={roadmapForm.preferredLanguage}
                    onChange={(e) => setRoadmapForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
                  >
                    <option value="JavaScript">JavaScript</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="C++">C++</option>
                    <option value="Go">Go</option>
                  </select>
                </div>
              </div>

              {/* 5. Personalization: Skills I Already Know (Optional) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Skills I Already Know (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleSyncProfileSkills}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Zap size={12} /> Sync from Profile / Resume
                  </button>
                </div>
                <input
                  type="text"
                  value={roadmapForm.knownSkills}
                  onChange={(e) => setRoadmapForm(prev => ({ ...prev, knownSkills: e.target.value }))}
                  placeholder="e.g. React, Node.js, SQL, Git, Python basics..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* 6. Daily Study Time */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} style={{ color: 'var(--accent)' }} /> Daily Study Time Commitment
                </label>
                <select
                  value={roadmapForm.dailyStudyTime}
                  onChange={(e) => setRoadmapForm(prev => ({ ...prev, dailyStudyTime: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
                >
                  <option value="30_min">30 minutes / day (Light consistency)</option>
                  <option value="1_hour">1 hour / day (Balanced standard)</option>
                  <option value="2_hours">2 hours / day (Intensive commitment)</option>
                  <option value="3_hours_plus">3+ hours / day (Accelerated placement boot)</option>
                </select>
              </div>

              {/* Submit button */}
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !roadmapForm.targetRole.trim()}
                style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem' }}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" /> Generating Custom Roadmap...
                  </>
                ) : (
                  <>
                    Generate Career Roadmap <Compass size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Roadmap Results display */}
          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Your Custom Learning Path</h2>
                {roadmap && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {roadmap.role} • {roadmap.estimatedDuration || 'Tailored Timeline'}
                  </span>
                )}
              </div>
              {roadmap && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveRoadmap}
                  disabled={savingRoadmap}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
                >
                  <Bookmark size={15} />
                  {savingRoadmap ? 'Saving to Profile...' : 'Save Roadmap to Profile'}
                </button>
              )}
            </div>

            {!roadmap ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Compass size={48} style={{ opacity: 0.2, marginBottom: '1rem', color: 'var(--accent)' }} />
                <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>No Roadmap Generated Yet</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', maxWidth: '360px', lineHeight: 1.5 }}>
                  Enter your target role and parameters on the left to generate an actionable step-by-step milestone timeline.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.3s ease' }}>
                
                {/* Overview & Metadata Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px', backgroundColor: 'rgba(163, 230, 53, 0.15)', color: 'var(--accent-hover)', fontWeight: 700 }}>
                    🎯 {roadmap.role}
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                    ⏱️ {roadmap.estimatedDuration}
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                    📍 {roadmap.placementTrack}
                  </span>
                  {roadmap.dreamCompany && (
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                      🏢 {roadmap.dreamCompany}
                    </span>
                  )}
                </div>

                {/* Realistic Timeline & Study Pacing Note */}
                {roadmap.realisticTimelineNote && (
                  <div style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem'
                  }}>
                    <Clock size={16} style={{ color: '#60a5fa', marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                      <strong>Pacing Guide:</strong> {roadmap.realisticTimelineNote}
                    </p>
                  </div>
                )}

                {/* Company Disclaimer Notice if targeted company specified */}
                {roadmap.companyDisclaimer && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(234, 179, 8, 0.08)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem'
                  }}>
                    <AlertCircle size={15} style={{ color: '#eab308', marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      {roadmap.companyDisclaimer}
                    </p>
                  </div>
                )}

                {/* Ordered Milestones Vertical Timeline */}
                <div style={{ position: 'relative', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Vertical Connecting Line */}
                  <div style={{ position: 'absolute', top: '14px', bottom: '14px', left: '7px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
                  
                  {(roadmap.milestones || roadmap.learningOrder || []).map((step) => {
                    const isFoundation = step.type === 'foundation';
                    return (
                      <div key={step.step} style={{ position: 'relative' }}>
                        {/* Timeline Node Dot */}
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: '-2.15rem',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: isFoundation ? '#3b82f6' : 'var(--accent)',
                          border: '4px solid var(--bg-secondary)',
                          zIndex: 2,
                          boxShadow: `0 0 10px ${isFoundation ? 'rgba(59, 130, 246, 0.4)' : 'rgba(163, 230, 53, 0.4)'}`
                        }}></div>
                        
                        {/* Step Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                backgroundColor: isFoundation ? 'rgba(59, 130, 246, 0.15)' : 'rgba(163, 230, 53, 0.15)',
                                color: isFoundation ? '#60a5fa' : 'var(--accent-hover)'
                              }}>
                                {isFoundation ? 'General Foundation' : 'Targeted Track Module'}
                              </span>
                            </div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                              Step {step.step}: {step.title}
                            </h3>
                          </div>
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-primary)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '100px',
                            border: '1px solid var(--border-color)',
                            fontWeight: 700
                          }}>
                            {step.timeline}
                          </span>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', lineHeight: 1.5 }}>
                          {step.description}
                        </p>
                        
                        {/* Skills & Topics Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                          {(step.skills || []).map(skill => (
                            <span key={skill} style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {skill}
                            </span>
                          ))}
                          {(step.topics || []).map(topic => (
                            <span key={topic} style={{ fontSize: '0.72rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px dashed var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                              • {topic}
                            </span>
                          ))}
                        </div>

                        {/* Practical Coding Tasks */}
                        {step.codingExercises && step.codingExercises.length > 0 && (
                          <div style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            marginBottom: '0.5rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                              <Code2 size={13} style={{ color: 'var(--accent)' }} /> Practical Tasks & Coding Drills:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {step.codingExercises.map((ex, i) => (
                                <li key={i}>{ex}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Mini-Project Deliverable */}
                        {step.deliverable && (
                          <div style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(163, 230, 53, 0.06)',
                            border: '1px solid rgba(163, 230, 53, 0.2)',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.45rem'
                          }}>
                            <Boxes size={14} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
                              <strong style={{ color: 'var(--accent-hover)' }}>Milestone Deliverable: </strong>
                              <span style={{ color: 'var(--text-primary)' }}>{step.deliverable}</span>
                            </div>
                          </div>
                        )}

                        {/* Completion Criteria */}
                        {step.completionCriteria && (
                          <div style={{
                            padding: '0.55rem 0.85rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            fontSize: '0.76rem',
                            color: 'var(--text-secondary)'
                          }}>
                            <CheckSquare size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
                            <span><strong>Completion Criteria:</strong> {step.completionCriteria}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Suggested Capstone Projects */}
                {roadmap.suggestedProjects && roadmap.suggestedProjects.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                      <Layers size={17} style={{ color: 'var(--accent)' }} />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Recommended Capstone Projects</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                      {roadmap.suggestedProjects.map((project, idx) => (
                        <div key={idx} style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>{project.title}</h4>
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                color: project.complexity === 'Hard' ? '#f87171' : 'var(--accent-hover)',
                                backgroundColor: project.complexity === 'Hard' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(163, 230, 53, 0.1)',
                                fontWeight: 700
                              }}>
                                {project.complexity}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                              {project.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview Preparation Milestones */}
                {roadmap.interviewPrepSteps && roadmap.interviewPrepSteps.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                      <Award size={17} style={{ color: 'var(--accent)' }} />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Interview Readiness Checkpoints</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {roadmap.interviewPrepSteps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          <CheckCircle2 size={15} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ====================================================
  // INTERACTIVE INTERVIEW SIMULATOR RENDERING
  // ====================================================

  // Helper to toggle focus areas in setup
  const toggleInterviewFocusArea = (tag) => {
    setInterviewForm(prev => {
      const exists = prev.focusAreas.includes(tag);
      return {
        ...prev,
        focusAreas: exists ? prev.focusAreas.filter(t => t !== tag) : [...prev.focusAreas, tag]
      };
    });
  };

  // 1. Setup View
  const renderInterviewSetup = () => {
    const hrFocusOptions = [
      'Teamwork & Collaboration',
      'Conflict Resolution',
      'Communication Skills',
      'Handling Pressure & Deadlines',
      'Strengths & Weaknesses',
      'Leadership & Ownership',
      'Ethical Decision Making'
    ];

    const techFocusOptions = [
      'Data Structures & Algorithms',
      'System Design & Architecture',
      'Databases & SQL Optimization',
      'Frontend & React Internals',
      'Backend, Node & Microservices',
      'Cloud, DevOps & Containers',
      'Web Security & Auth'
    ];

    const roleSuggestions = [
      'Full Stack Developer',
      'Backend Engineer',
      'AI/ML Engineer',
      'Cloud / DevOps',
      'Mobile Dev',
      'Data Engineer',
      'Frontend Engineer'
    ];

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        {/* Top Banner with History Button */}
        <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Brain size={22} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>AI Interview Preparation Simulator</h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '720px' }}>
                Practice placement interviews with an interactive AI interviewer. Rehearse spoken or written answers one question at a time with instant feedback or realistic end-of-session evaluation.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchInterviewHistory}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}
            >
              <History size={16} /> Past Practice Sessions
            </button>
          </div>

          {/* 1. Round Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.6rem' }}>
              Select Interview Round Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              
              {/* HR Card */}
              <div
                onClick={() => setInterviewForm(prev => ({ ...prev, interviewType: 'hr' }))}
                style={{
                  padding: '1.15rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: interviewForm.interviewType === 'hr' ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                  backgroundColor: interviewForm.interviewType === 'hr' ? 'rgba(163, 230, 53, 0.08)' : 'var(--bg-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Briefcase size={18} style={{ color: interviewForm.interviewType === 'hr' ? 'var(--accent)' : 'var(--text-secondary)' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>HR / Behavioral Interview</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Master situational questions, team dynamics, handling failure, and culture fit using the <strong>STAR</strong> methodology.
                </p>
              </div>

              {/* Technical Card */}
              <div
                onClick={() => setInterviewForm(prev => ({ ...prev, interviewType: 'technical' }))}
                style={{
                  padding: '1.15rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: interviewForm.interviewType === 'technical' ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                  backgroundColor: interviewForm.interviewType === 'technical' ? 'rgba(163, 230, 53, 0.08)' : 'var(--bg-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Code2 size={18} style={{ color: interviewForm.interviewType === 'technical' ? 'var(--accent)' : 'var(--text-secondary)' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Technical Interview</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Core engineering concepts, algorithmic complexity, architectural trade-offs, databases, and language internals.
                </p>
              </div>

              {/* Resume Card */}
              <div
                onClick={() => setInterviewForm(prev => ({ ...prev, interviewType: 'resume' }))}
                style={{
                  padding: '1.15rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: interviewForm.interviewType === 'resume' ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                  backgroundColor: interviewForm.interviewType === 'resume' ? 'rgba(163, 230, 53, 0.08)' : 'var(--bg-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <FileText size={18} style={{ color: interviewForm.interviewType === 'resume' ? 'var(--accent)' : 'var(--text-secondary)' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Resume-Based Interview</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Probe specifically into your claimed projects, tech stacks, individual ownership, and problem-solving decisions.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Target Role Input + Chips */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
              Target Job Role or Position <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              type="text"
              value={interviewForm.targetRole}
              onChange={(e) => setInterviewForm(prev => ({ ...prev, targetRole: e.target.value }))}
              placeholder="e.g. Full Stack Developer, SDE-1 at Amazon, Data Engineer..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                marginBottom: '0.5rem'
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginRight: '0.2rem' }}>Quick Pick:</span>
              {roleSuggestions.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInterviewForm(prev => ({ ...prev, targetRole: r }))}
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    border: interviewForm.targetRole === r ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                    backgroundColor: interviewForm.targetRole === r ? 'rgba(163, 230, 53, 0.15)' : 'var(--bg-secondary)',
                    color: interviewForm.targetRole === r ? 'var(--accent-hover)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Candidate Level & Difficulty Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Level */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.45rem' }}>
                Candidate Experience Level
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['Student/Fresher', 'Intern', 'Experienced'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setInterviewForm(prev => ({ ...prev, candidateLevel: lvl }))}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: interviewForm.candidateLevel === lvl ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                      backgroundColor: interviewForm.candidateLevel === lvl ? 'rgba(163, 230, 53, 0.12)' : 'var(--bg-primary)',
                      color: interviewForm.candidateLevel === lvl ? 'var(--accent-hover)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.45rem' }}>
                Question Difficulty
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { id: 'Easy', label: 'Easy (Basics)' },
                  { id: 'Medium', label: 'Medium (Standard)' },
                  { id: 'Challenging', label: 'Challenging (Tier-1)' }
                ].map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setInterviewForm(prev => ({ ...prev, difficulty: d.id }))}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: interviewForm.difficulty === d.id ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                      backgroundColor: interviewForm.difficulty === d.id ? 'rgba(163, 230, 53, 0.12)' : 'var(--bg-primary)',
                      color: interviewForm.difficulty === d.id ? 'var(--accent-hover)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Session Length & Practice Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Length */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.45rem' }}>
                Session Length
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setInterviewForm(prev => ({ ...prev, sessionLength: 5 }))}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: interviewForm.sessionLength === 5 ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                    backgroundColor: interviewForm.sessionLength === 5 ? 'rgba(163, 230, 53, 0.12)' : 'var(--bg-primary)',
                    color: interviewForm.sessionLength === 5 ? 'var(--accent-hover)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Quick Practice (5 Questions)
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewForm(prev => ({ ...prev, sessionLength: 10 }))}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: interviewForm.sessionLength === 10 ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                    backgroundColor: interviewForm.sessionLength === 10 ? 'rgba(163, 230, 53, 0.12)' : 'var(--bg-primary)',
                    color: interviewForm.sessionLength === 10 ? 'var(--accent-hover)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  🎯 Full Interview (10 Questions)
                </button>
              </div>
            </div>

            {/* Practice Mode */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.45rem' }}>
                Practice Mode
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setInterviewForm(prev => ({ ...prev, practiceMode: 'practice' }))}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: interviewForm.practiceMode === 'practice' ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                    backgroundColor: interviewForm.practiceMode === 'practice' ? 'rgba(163, 230, 53, 0.12)' : 'var(--bg-primary)',
                    color: interviewForm.practiceMode === 'practice' ? 'var(--accent-hover)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  💡 Practice Mode (Instant Advice)
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewForm(prev => ({ ...prev, practiceMode: 'mock' }))}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: interviewForm.practiceMode === 'mock' ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                    backgroundColor: interviewForm.practiceMode === 'mock' ? 'rgba(163, 230, 53, 0.12)' : 'var(--bg-primary)',
                    color: interviewForm.practiceMode === 'mock' ? 'var(--accent-hover)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  🎙️ Mock Interview (Report at End)
                </button>
              </div>
            </div>
          </div>

          {/* 5. Type-Specific Focus Areas (Progressive Disclosure) */}
          {interviewForm.interviewType === 'hr' && (
            <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.45rem' }}>
                Optional Behavioral Focus Areas
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {hrFocusOptions.map(tag => {
                  const selected = interviewForm.focusAreas.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterviewFocusArea(tag)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: selected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                        backgroundColor: selected ? 'rgba(163, 230, 53, 0.15)' : 'var(--bg-secondary)',
                        color: selected ? 'var(--accent-hover)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      {selected && <Check size={12} />} {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {interviewForm.interviewType === 'technical' && (
            <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.45rem' }}>
                Optional Technical Topic Focus
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {techFocusOptions.map(tag => {
                  const selected = interviewForm.focusAreas.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterviewFocusArea(tag)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: selected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                        backgroundColor: selected ? 'rgba(163, 230, 53, 0.15)' : 'var(--bg-secondary)',
                        color: selected ? 'var(--accent-hover)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      {selected && <Check size={12} />} {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {interviewForm.interviewType === 'resume' && (
            <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.25s ease', padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Resume & Profile Grounding
                </span>
                <button
                  type="button"
                  onClick={() => setInterviewForm(prev => ({ ...prev, useProfileResume: !prev.useProfileResume }))}
                  className="btn-text-action"
                  style={{ fontSize: '0.78rem' }}
                >
                  {interviewForm.useProfileResume ? 'Provide Custom Resume Text' : 'Use Profile Resume Data'}
                </button>
              </div>

              {interviewForm.useProfileResume ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <p style={{ margin: '0 0 0.4rem 0' }}>
                    Questions will be grounded in verified skills from your profile:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {(user?.skills && user.skills.length > 0 ? user.skills : ['JavaScript', 'React', 'Node.js', 'MongoDB']).map((s, idx) => (
                      <span key={idx} style={{ padding: '0.15rem 0.55rem', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--accent-hover)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={3}
                    value={interviewForm.customResumeText}
                    onChange={(e) => setInterviewForm(prev => ({ ...prev, customResumeText: e.target.value }))}
                    placeholder="Paste key project bullet points or experience summary here..."
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>The AI will only question details contained in this text.</span>
                </div>
              )}
            </div>
          )}

          {/* 6. Optional Company & Placement Track */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Dream Company (Optional)
              </label>
              <input
                type="text"
                value={interviewForm.dreamCompany}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, dreamCompany: e.target.value }))}
                placeholder="e.g. Google, Amazon, Microsoft, TCS, Infosys..."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Placement Track (Optional)
              </label>
              <select
                value={interviewForm.placementTrack}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, placementTrack: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="Product-Based">Product-Based Track (In-depth DSA & System Design)</option>
                <option value="Service-Based">Service-Based Track (Aptitude, Core CS & Versatility)</option>
                <option value="Startup">Startup Track (Rapid Delivery, Full Stack, Ownership)</option>
                <option value="Other">General Placement Track</option>
              </select>
            </div>
          </div>

          {/* Start CTA Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleStartInterviewSession()}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', fontSize: '0.95rem', fontWeight: 700 }}
            >
              {loading ? (
                <>
                  <LoadingSpinner size={16} /> Generating Tailored Questions...
                </>
              ) : (
                <>
                  <Play size={16} /> Start Interactive Interview
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 2. Active Session View (One Question at a Time)
  const renderInterviewActive = () => {
    if (!activeSession) return null;

    const currentIdx = activeSession.currentIndex;
    const currentQ = activeSession.questions[currentIdx];
    const totalQ = activeSession.questions.length;
    const progressPct = Math.round(((currentIdx + 1) / totalQ) * 100);

    const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

    // Contextual guidance placeholder based on category
    let dynamicPlaceholder = 'Type or speak your answer here...';
    if (activeSession.config.interviewType === 'hr') {
      dynamicPlaceholder = 'Structure using STAR method: \n- Situation: Describe the context\n- Task: What was your objective?\n- Action: What specific actions did YOU take?\n- Result: What was the measurable outcome?';
    } else if (activeSession.config.interviewType === 'technical') {
      dynamicPlaceholder = 'Explain your approach clearly: \n- Core concept & algorithmic reasoning\n- Time and space complexity trade-offs\n- Concrete edge cases considered';
    } else {
      dynamicPlaceholder = 'Explain your personal contribution: \n- Technologies and architecture used\n- Challenges you personally solved\n- Measurable impact of your feature';
    }

    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {/* Top Cockpit Header */}
        <div className="card-glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                backgroundColor: 'rgba(163, 230, 53, 0.15)',
                color: 'var(--accent-hover)'
              }}>
                {activeSession.config.interviewType.toUpperCase()} ROUND
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeSession.config.targetRole}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
              }}>
                {activeSession.config.practiceMode === 'practice' ? '💡 Practice Mode' : '🎙️ Mock Interview Mode'}
              </span>
              <button
                type="button"
                className="btn-text-action"
                onClick={() => {
                  if (window.confirm('Are you sure you want to exit? Your current session progress will be lost.')) {
                    setInterviewStep('setup');
                    setActiveSession(null);
                  }
                }}
                style={{ fontSize: '0.75rem', color: '#f87171' }}
              >
                Exit Session
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, height: '7px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  backgroundColor: 'var(--accent)',
                  borderRadius: '10px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', minWidth: '85px', textAlign: 'right' }}>
              Question {currentIdx + 1} of {totalQ}
            </span>
          </div>
        </div>

        {/* Current Question Card */}
        <div className="card-glass" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--accent-hover)',
              letterSpacing: '0.05em'
            }}>
              Topic: {currentQ.category || 'Core Question'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Difficulty: {activeSession.config.difficulty}
            </span>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.45, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            {currentQ.q || currentQ.question}
          </h3>

          {/* Optional Blueprint / Hint in Practice Mode */}
          {activeSession.config.practiceMode === 'practice' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setShowBlueprint(!showBlueprint)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-hover)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: 0
                }}
              >
                <Lightbulb size={14} />
                {showBlueprint ? 'Hide Answer Structure Blueprint' : 'Need a hint? View Answer Structure Blueprint'}
              </button>

              {showBlueprint && (
                <div style={{
                  marginTop: '0.6rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <strong style={{ color: 'var(--accent-hover)' }}>Blueprint: </strong>
                  {currentQ.a || currentQ.blueprint}
                </div>
              )}
            </div>
          )}

          {/* Interactive Answer Box */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <textarea
              rows={6}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={dynamicPlaceholder}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />

            {/* Word count & voice status bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', padding: '0 0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {wordCount} words {wordCount >= 30 ? '• Good length' : '• Aim for at least 30-40 words'}
              </span>

              {/* Voice input button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'none',
                    border: isRecording ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    color: isRecording ? '#ef4444' : 'var(--text-secondary)',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isRecording ? (
                    <>
                      <MicOff size={13} /> Recording (Click to stop)
                    </>
                  ) : (
                    <>
                      <Mic size={13} /> Speak Answer
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSkipQuestion}
              disabled={evaluatingAnswer || savingSession}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <SkipForward size={14} /> Skip Question
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmitAnswer}
              disabled={evaluatingAnswer || savingSession || !currentAnswer.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.6rem', fontSize: '0.9rem', fontWeight: 700 }}
            >
              {evaluatingAnswer ? (
                <>
                  <LoadingSpinner size={15} /> Evaluating Answer...
                </>
              ) : activeSession.config.practiceMode === 'practice' ? (
                <>
                  <Send size={15} /> Submit & Get Evaluation
                </>
              ) : currentIdx === totalQ - 1 ? (
                <>
                  <CheckCircle size={15} /> Complete & Generate Report
                </>
              ) : (
                <>
                  <ArrowRight size={15} /> Next Question
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 3. Question Feedback View (Practice Mode only)
  const renderInterviewFeedback = () => {
    if (!activeSession) return null;

    const currentIdx = activeSession.currentIndex;
    const currentQ = activeSession.questions[currentIdx];
    const candidateAns = activeSession.answers[currentIdx];
    const evalData = activeSession.evaluations[currentIdx];
    const isLastQ = currentIdx === activeSession.questions.length - 1;

    if (!evalData) {
      return (
        <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
          <LoadingSpinner size={30} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Evaluating your answer...</p>
        </div>
      );
    }

    const scoreColor = evalData.score >= 8 ? 'var(--success)' : evalData.score >= 6 ? 'var(--accent-hover)' : 'var(--error)';
    const scoreBg = evalData.score >= 8 ? 'rgba(16, 185, 129, 0.15)' : evalData.score >= 6 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';

    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {/* Question & Evaluation Card */}
        <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
              Feedback on Question {currentIdx + 1} of {activeSession.questions.length}
            </span>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 800,
              backgroundColor: scoreBg,
              color: scoreColor
            }}>
              Practice Score: {evalData.score} / 10 • {evalData.rating}
            </span>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            {currentQ.q || currentQ.question}
          </h3>

          {/* Candidate's submitted answer */}
          <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
              Your Submitted Answer:
            </span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
              "{candidateAns}"
            </p>
          </div>

          {/* Feedback Summary */}
          <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(163, 230, 53, 0.08)', border: '1px solid rgba(163, 230, 53, 0.2)', marginBottom: '1.25rem' }}>
            <strong style={{ fontSize: '0.82rem', color: 'var(--accent-hover)', display: 'block', marginBottom: '0.2rem' }}>
              Interviewer Assessment:
            </strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
              {evalData.feedbackSummary}
            </p>
          </div>

          {/* Strengths & Improvements Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Strengths */}
            <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--success)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={14} /> What You Did Well
              </h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {(evalData.strengths || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertCircle size={14} /> Areas to Strengthen
              </h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {(evalData.improvements || []).map((imp, idx) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Advice */}
          {evalData.actionableAdvice && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--accent)', marginBottom: '1.25rem' }}>
              <strong style={{ fontSize: '0.8rem', color: 'var(--accent-hover)', display: 'block', marginBottom: '0.2rem' }}>
                Concrete Advice for Real Interviews:
              </strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0 }}>
                {evalData.actionableAdvice}
              </p>
            </div>
          )}

          {/* Model Response Phrasing */}
          {evalData.idealAnswerSnippet && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <strong style={{ fontSize: '0.8rem', color: '#38bdf8', display: 'block', marginBottom: '0.2rem' }}>
                Recommended Model Answer Structure:
              </strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {evalData.idealAnswerSnippet}
              </p>
            </div>
          )}

          {/* Follow-up question banner (if generated by AI) */}
          {evalData.followUpQuestion && (
            <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <MessageSquare size={15} style={{ color: '#38bdf8' }} />
                <strong style={{ fontSize: '0.82rem', color: '#38bdf8' }}>Follow-Up Inquiry from Interviewer:</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 0.65rem 0' }}>
                "{evalData.followUpQuestion}"
              </p>

              {!isAnsweringFollowUp ? (
                <button
                  type="button"
                  onClick={() => setIsAnsweringFollowUp(true)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Answer Follow-Up Question
                </button>
              ) : (
                <div>
                  <textarea
                    rows={2}
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                    placeholder="Type quick follow-up response..."
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setActiveSession(prev => ({
                          ...prev,
                          followUps: {
                            ...prev.followUps,
                            [currentIdx]: {
                              question: evalData.followUpQuestion,
                              answer: followUpAnswer
                            }
                          }
                        }));
                        setIsAnsweringFollowUp(false);
                      }}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                    >
                      Save Follow-Up
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsAnsweringFollowUp(false)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextFromFeedback}
              disabled={savingSession}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.6rem', fontSize: '0.9rem', fontWeight: 700 }}
            >
              {savingSession ? (
                <>
                  <LoadingSpinner size={15} /> Compiling Final Report...
                </>
              ) : isLastQ ? (
                <>
                  <CheckCircle size={15} /> Finish & View Final Report
                </>
              ) : (
                <>
                  Next Question <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 4. Final Evaluation Report View
  const renderInterviewReport = () => {
    const reportData = activeSession?.report || (selectedHistorySession?.overallReport);
    const sessionConfig = activeSession?.config || selectedHistorySession;
    const questionsList = activeSession?.questions || selectedHistorySession?.questions || [];

    if (!reportData) {
      return (
        <div className="card-glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <Brain size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Generating Placement Assessment Report...</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Summarizing answers, strengths, and recommended revision topics.</p>
        </div>
      );
    }

    const overallScore = reportData.score || 0;
    const scoreColor = overallScore >= 8 ? 'var(--success)' : overallScore >= 6 ? 'var(--accent-hover)' : 'var(--error)';

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        {/* Hero Score Banner */}
        <div className="card-glass" style={{ padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '110px', height: '110px', borderRadius: '50%', border: `4px solid ${scoreColor}`, marginBottom: '1rem', backgroundColor: 'var(--bg-primary)' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: scoreColor }}>
              {overallScore}
            </span>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            {reportData.rating || 'Practice Session Completed'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 auto 1.5rem auto', maxWidth: '640px' }}>
            {reportData.summaryNote || `Performance report for ${sessionConfig?.targetRole || 'Software Engineer'}.`}
          </p>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Questions Answered</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{reportData.questionsAnswered || 0}</strong>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Questions Skipped</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{reportData.questionsSkipped || 0}</strong>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Practice Mode</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--accent-hover)' }}>
                {sessionConfig?.practiceMode === 'mock' ? 'Mock Simulation' : 'Guided Practice'}
              </strong>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Session Status</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--success)' }}>Saved to Profile</strong>
            </div>
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Key Strengths */}
          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Demonstrated Strengths</h3>
            </div>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {(reportData.keyStrengths || []).map((str, idx) => (
                <li key={idx} style={{ marginBottom: '0.35rem' }}>{str}</li>
              ))}
            </ul>
          </div>

          {/* Areas to Improve */}
          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
              <AlertCircle size={18} style={{ color: '#f59e0b' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Primary Areas for Growth</h3>
            </div>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {(reportData.areasToImprove || []).map((imp, idx) => (
                <li key={idx} style={{ marginBottom: '0.35rem' }}>{imp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommended Revision Topics & Next Steps */}
        <div className="card-glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-hover)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={16} /> Recommended Topics to Revise
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(reportData.topicsToRevise || []).map((topic, idx) => (
                  <span key={idx} style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    • {topic}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={16} /> Next Placement Practice Steps
              </h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {(reportData.nextSteps || []).map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Question-by-Question Accordion Breakdown */}
        <div className="card-glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem' }}>Question-by-Question Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {questionsList.map((qItem, idx) => {
              const qText = qItem.question || qItem.q;
              const aText = qItem.candidateAnswer || (activeSession?.answers && activeSession.answers[idx]) || '';
              const isSkipped = qItem.isSkipped || (activeSession?.skipped && activeSession.skipped[idx]);
              const evalObj = qItem.evaluation || (activeSession?.evaluations && activeSession.evaluations[idx]);
              const isExpanded = expandedQuestion === idx;

              return (
                <div key={idx} style={{ borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
                  <div
                    onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                    style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent-hover)', fontSize: '0.95rem' }}>#{idx + 1}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{qText}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {isSkipped ? (
                        <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                          Skipped
                        </span>
                      ) : evalObj ? (
                        <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', backgroundColor: 'rgba(163, 230, 53, 0.15)', color: 'var(--accent-hover)', fontWeight: 800 }}>
                          {evalObj.score}/10
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Answered</span>
                      )}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.82rem' }}>
                      {aText ? (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Your Answer:</strong>
                          <p style={{ color: 'var(--text-primary)', margin: 0, fontStyle: 'italic' }}>"{aText}"</p>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 0.75rem 0' }}>This question was skipped.</p>
                      )}

                      {qItem.blueprint || qItem.a ? (
                        <div>
                          <strong style={{ color: 'var(--accent-hover)', display: 'block', marginBottom: '0.2rem' }}>Model Blueprint:</strong>
                          <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>{qItem.blueprint || qItem.a}</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchInterviewHistory}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <History size={16} /> All Practice Sessions
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setInterviewStep('setup');
              setActiveSession(null);
              setSelectedHistorySession(null);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
          >
            <RotateCcw size={16} /> Begin New Interview Session
          </button>
        </div>
      </div>
    );
  };

  // 5. Past Practice History View
  const renderInterviewHistory = () => {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>Interview Practice History</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Review past mock interview sessions, scores, and areas to improve.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setInterviewStep('setup')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700 }}
            >
              <Play size={14} /> Start New Practice
            </button>
          </div>

          {interviewHistory.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Brain size={40} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600 }}>No Practice Sessions Recorded Yet</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Complete an HR, Technical, or Resume interview to build your readiness history.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {interviewHistory.map((sess, idx) => {
                const rep = sess.overallReport || {};
                const score = rep.score || 0;
                const scoreColor = score >= 8 ? 'var(--success)' : score >= 6 ? 'var(--accent-hover)' : 'var(--error)';

                return (
                  <div
                    key={sess._id || idx}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{
                          padding: '0.15rem 0.55rem',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(163, 230, 53, 0.15)',
                          color: 'var(--accent-hover)'
                        }}>
                          {sess.interviewType?.toUpperCase()}
                        </span>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                          {sess.targetRole}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          ({sess.difficulty})
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem' }}>
                        <span>📅 {new Date(sess.createdAt).toLocaleDateString()}</span>
                        <span>🎯 {sess.sessionLength} Questions</span>
                        <span>⚡ {sess.practiceMode === 'mock' ? 'Mock Simulation' : 'Guided Practice'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: scoreColor, display: 'block' }}>
                          {score} / 10
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {rep.rating || 'Completed'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const res = await api.getInterviewSessionById(sess._id);
                            setSelectedHistorySession(res.data);
                            setActiveSession(null);
                            setInterviewStep('report');
                          } catch (err) {
                            setError('Failed to load session details');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                      >
                        Review Report
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInterviewTab = () => {
    if (interviewStep === 'history') return renderInterviewHistory();
    if (interviewStep === 'active') return renderInterviewActive();
    if (interviewStep === 'feedback') return renderInterviewFeedback();
    if (interviewStep === 'report') return renderInterviewReport();
    return renderInterviewSetup();
  };

  const renderQuizTab = () => {
    // Available subtopics for current topic
    const availableSubtopics = SUBJECT_SUBTOPICS[quizForm.topic] || ['Core Principles', 'Mixed Practice'];

    // 1. Quiz Settings view
    if (!quizActive && !quizResult) {
      return (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <div className="card-glass" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(163, 230, 53, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                <HelpCircle size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Topic Practice Quiz</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '440px', margin: '0.35rem auto 0 auto', lineHeight: 1.45 }}>
                Master placement concepts, learn from mistakes, and target your weak areas through guided practice.
              </p>
            </div>

            <form onSubmit={handleStartQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Topic / Subject */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Topic / Subject
                </label>
                <select 
                  value={quizForm.topic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                >
                  <option value="Data Structures & Algorithms">Data Structures & Algorithms (DSA)</option>
                  <option value="Python Programming">Python Programming</option>
                  <option value="Java & OOP">Java & Object-Oriented Programming</option>
                  <option value="C++ & STL">C++ & Standard Template Library (STL)</option>
                  <option value="JavaScript (ES6+)">JavaScript (Modern ES6+)</option>
                  <option value="React & Frontend">React.js & Frontend Architecture</option>
                  <option value="Node.js & Backend">Node.js, Express & Microservices</option>
                  <option value="SQL & Relational DB">SQL & Relational Databases (PostgreSQL / MySQL)</option>
                  <option value="MongoDB & NoSQL">MongoDB & NoSQL Data Modeling</option>
                  <option value="Operating Systems">Operating Systems (Threads, Memory, Concurrency)</option>
                  <option value="Computer Networks">Computer Networks (TCP/IP, HTTP/HTTPS, DNS)</option>
                  <option value="Object-Oriented Design">Object-Oriented Design & Design Patterns</option>
                  <option value="System Design">System Design & High-Scalability Architectures</option>
                  <option value="Cloud & DevOps">Cloud Computing & DevOps (AWS, Docker, CI/CD)</option>
                  <option value="Machine Learning">Machine Learning & AI Fundamentals</option>
                  <option value="Web Security">Web Security, Authentication & OWASP Top 10</option>
                </select>
              </div>

              {/* Subtopic Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Subtopic Selection
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-hover)', fontWeight: 600 }}>
                    {quizForm.subtopics.includes('Mixed Practice') ? 'Mixed Practice' : `${quizForm.subtopics.length} selected`}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', maxHeight: '150px', overflowY: 'auto', padding: '0.4rem 0' }}>
                  {availableSubtopics.map(st => {
                    const isSelected = quizForm.subtopics.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleToggleSubtopic(st)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '100px',
                          fontSize: '0.78rem',
                          fontWeight: isSelected ? 700 : 500,
                          border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'rgba(163, 230, 53, 0.15)' : 'var(--bg-secondary)',
                          color: isSelected ? 'var(--accent-hover)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {isSelected && <Check size={12} />}
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quiz Mode */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Quiz Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    onClick={() => setQuizForm(prev => ({ ...prev, quizMode: 'practice' }))}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: quizForm.quizMode === 'practice' ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                      backgroundColor: quizForm.quizMode === 'practice' ? 'rgba(163, 230, 53, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                      <BookOpen size={16} style={{ color: quizForm.quizMode === 'practice' ? 'var(--accent-hover)' : 'var(--text-secondary)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: quizForm.quizMode === 'practice' ? 'var(--accent-hover)' : 'var(--text-primary)' }}>
                        Practice Mode
                      </span>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
                      Instant feedback and concept explanations after each question.
                    </p>
                  </div>

                  <div
                    onClick={() => setQuizForm(prev => ({ ...prev, quizMode: 'test' }))}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: quizForm.quizMode === 'test' ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                      backgroundColor: quizForm.quizMode === 'test' ? 'rgba(163, 230, 53, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                      <Clock size={16} style={{ color: quizForm.quizMode === 'test' ? 'var(--accent-hover)' : 'var(--text-secondary)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: quizForm.quizMode === 'test' ? 'var(--accent-hover)' : 'var(--text-primary)' }}>
                        Test Mode
                      </span>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
                      Complete without reveals; full score and analysis at the end.
                    </p>
                  </div>
                </div>
              </div>

              {/* Difficulty and Question Count Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Difficulty */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Difficulty</label>
                  <select 
                    value={quizForm.difficulty}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Number of questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Questions Count</label>
                  <select 
                    value={quizForm.numQuestions}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, numQuestions: parseInt(e.target.value, 10) }))}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
                style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, padding: '0.85rem' }}
              >
                {loading ? (
                  <>Generating Practice Quiz...</>
                ) : (
                  <>Start Quiz <Play size={16} /></>
                )}
              </button>
            </form>
          </div>

          {/* Quick past attempts history banner */}
          {quizHistory && quizHistory.length > 0 && (
            <div className="card-glass" style={{ padding: '1.25rem 1.5rem', maxWidth: '640px', margin: '1.5rem auto 0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <History size={15} style={{ color: 'var(--accent)' }} /> Recent Practice Sessions
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {quizHistory.length} attempts recorded
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {quizHistory.slice(0, 3).map((att, aIdx) => (
                  <div key={aIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{att.topic}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>({att.difficulty})</span>
                      {att.quizMode && (
                        <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '100px', backgroundColor: 'rgba(163, 230, 53, 0.1)', color: 'var(--accent-hover)' }}>
                          {att.quizMode}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: att.accuracy >= 70 ? 'var(--success)' : 'var(--accent-hover)' }}>
                        {att.score}/{att.totalQuestions} ({att.accuracy}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 2. Active Quiz Screen (One question at a time)
    if (quizActive && quizQuestions && quizQuestions.length > 0) {
      const currentQuestion = quizQuestions[currentQuizIndex];
      const selectedOption = selectedAnswers[currentQuizIndex];
      const isReviewed = Boolean(reviewedQuestions[currentQuizIndex]);
      const isPracticeMode = quizForm.quizMode === 'practice';
      const isCheckedInPractice = Boolean(practiceChecked[currentQuizIndex]);
      const hasUnanswered = quizQuestions.some((_, idx) => selectedAnswers[idx] === undefined);
      const unansweredCount = quizQuestions.filter((_, idx) => selectedAnswers[idx] === undefined).length;

      return (
        <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '760px', margin: '0 auto' }}>
          
          {/* Top Progress Bar & Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '100px', backgroundColor: 'rgba(163, 230, 53, 0.12)', color: 'var(--accent-hover)', fontWeight: 700 }}>
                  {quizForm.topic}
                </span>
                {currentQuestion.subtopic && (
                  <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '100px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                    {currentQuestion.subtopic}
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {isPracticeMode ? '• Practice Mode' : '• Test Mode'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Question {currentQuizIndex + 1} of {quizQuestions.length}
              </h2>
            </div>

            {/* Visual Progress percentage */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%`, height: '100%', backgroundColor: 'var(--accent)', borderRadius: '3px', transition: 'width 0.25s ease' }}></div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {Math.round(((currentQuizIndex + 1) / quizQuestions.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Question Navigator Strip / Palette */}
          <div className="card-glass" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {quizQuestions.map((_, qIdx) => {
                const isCurrent = qIdx === currentQuizIndex;
                const isAnswered = selectedAnswers[qIdx] !== undefined;
                const isFlagged = reviewedQuestions[qIdx];

                let pillBg = 'var(--bg-secondary)';
                let pillBorder = '1px solid var(--border-color)';
                let pillColor = 'var(--text-secondary)';

                if (isCurrent) {
                  pillBorder = '2px solid var(--accent)';
                  pillColor = 'var(--accent-hover)';
                  pillBg = 'rgba(163, 230, 53, 0.12)';
                } else if (isFlagged) {
                  pillBorder = '1.5px solid #f59e0b';
                  pillColor = '#f59e0b';
                  pillBg = 'rgba(245, 158, 11, 0.1)';
                } else if (isAnswered) {
                  pillBorder = '1px solid rgba(163, 230, 53, 0.4)';
                  pillColor = 'var(--accent-hover)';
                  pillBg = 'rgba(163, 230, 53, 0.08)';
                }

                return (
                  <button
                    key={qIdx}
                    type="button"
                    onClick={() => setCurrentQuizIndex(qIdx)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: pillBorder,
                      backgroundColor: pillBg,
                      color: pillColor,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Question ${qIdx + 1}${isFlagged ? ' (Flagged for Review)' : ''}${isAnswered ? ' (Answered)' : ' (Unanswered)'}`}
                  >
                    {qIdx + 1}
                    {isFlagged && (
                      <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Status Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} /> Answered: {Object.keys(selectedAnswers).length}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Flagged: {Object.values(reviewedQuestions).filter(Boolean).length}
              </span>
            </div>
          </div>

          {/* Active Question Card */}
          <div className="card-glass" style={{ padding: '2rem', marginBottom: '1.25rem', position: 'relative' }}>
            {isReviewed && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', borderRadius: '100px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <Flag size={12} /> Marked for Review
              </div>
            )}

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
              {currentQuestion.question}
            </h3>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrect = oIdx === currentQuestion.correctAnswer;
                
                let optBorder = '1px solid var(--border-color)';
                let optBg = 'var(--bg-secondary)';
                let optColor = 'var(--text-primary)';
                let optDotBorder = '1px solid var(--border-color)';
                let optDotBg = 'transparent';

                // Practice Mode: After checking answer, reveal correctness
                if (isPracticeMode && isCheckedInPractice) {
                  if (isCorrect) {
                    optBorder = '1.5px solid var(--success)';
                    optBg = 'rgba(16, 185, 129, 0.12)';
                    optColor = 'var(--success)';
                    optDotBorder = '5px solid var(--success)';
                  } else if (isSelected && !isCorrect) {
                    optBorder = '1.5px solid var(--error)';
                    optBg = 'rgba(239, 68, 68, 0.12)';
                    optColor = 'var(--error)';
                    optDotBorder = '5px solid var(--error)';
                  } else {
                    optColor = 'var(--text-secondary)';
                  }
                } else if (isSelected) {
                  optBorder = '1.5px solid var(--accent)';
                  optBg = 'rgba(163, 230, 53, 0.1)';
                  optDotBorder = '5px solid var(--accent)';
                  optDotBg = 'transparent';
                }

                return (
                  <button 
                    key={oIdx}
                    type="button"
                    onClick={() => {
                      // In practice mode, allow changing only before checking
                      if (!isPracticeMode || !isCheckedInPractice) {
                        handleAnswerSelect(currentQuizIndex, oIdx);
                      }
                    }}
                    disabled={isPracticeMode && isCheckedInPractice}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      borderRadius: '8px',
                      border: optBorder,
                      backgroundColor: optBg,
                      textAlign: 'left',
                      cursor: (isPracticeMode && isCheckedInPractice) ? 'default' : 'pointer',
                      fontSize: '0.92rem',
                      color: optColor,
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      opacity: (isPracticeMode && isCheckedInPractice && !isSelected && !isCorrect) ? 0.6 : 1
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: optDotBorder,
                      backgroundColor: optDotBg,
                      flexShrink: 0
                    }} />
                    <span style={{ flex: 1 }}>{opt}</span>
                    {isPracticeMode && isCheckedInPractice && isCorrect && (
                      <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    )}
                    {isPracticeMode && isCheckedInPractice && isSelected && !isCorrect && (
                      <AlertCircle size={18} style={{ color: 'var(--error)', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Practice Mode: Immediate Conceptual Explanation */}
            {isPracticeMode && isCheckedInPractice && (
              <div style={{ marginTop: '1.5rem', animation: 'fadeIn 0.25s ease', padding: '1rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                  <Lightbulb size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-hover)' }}>Concept Explanation</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentQuizIndex(prev => prev - 1)}
                disabled={currentQuizIndex === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ArrowLeft size={16} /> Previous
              </button>

              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => toggleMarkReview(currentQuizIndex)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: isReviewed ? '#f59e0b' : 'var(--text-secondary)',
                  borderColor: isReviewed ? '#f59e0b' : 'var(--border-color)'
                }}
              >
                <Flag size={14} /> {isReviewed ? 'Flagged' : 'Mark for Review'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Practice Mode Button Sequence */}
              {isPracticeMode && !isCheckedInPractice ? (
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleCheckAnswerInPractice(currentQuizIndex)}
                  disabled={selectedOption === undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  Check Answer <Check size={16} />
                </button>
              ) : null}

              {/* Next Question or Submit Answers */}
              {currentQuizIndex < quizQuestions.length - 1 ? (
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentQuizIndex(prev => prev + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (hasUnanswered) {
                      setShowUnansweredConfirm(true);
                    } else {
                      handleQuizSubmit();
                    }
                  }}
                  disabled={isSubmittingQuiz}
                  style={{ backgroundColor: 'var(--success)', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {isSubmittingQuiz ? 'Submitting...' : 'Finish Quiz'} <CheckCircle2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Unanswered Questions Confirmation Modal */}
          {showUnansweredConfirm && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
              <div className="card-glass" style={{ padding: '2rem', maxWidth: '440px', width: '100%', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
                <AlertCircle size={36} style={{ color: '#f59e0b', margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Unanswered Questions</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.5rem' }}>
                  You still have <strong style={{ color: 'var(--text-primary)' }}>{unansweredCount} question{unansweredCount > 1 ? 's' : ''}</strong> unanswered. Would you like to review them before completing?
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const firstUnanswered = quizQuestions.findIndex((_, idx) => selectedAnswers[idx] === undefined);
                      if (firstUnanswered !== -1) {
                        setCurrentQuizIndex(firstUnanswered);
                      }
                      setShowUnansweredConfirm(false);
                    }}
                  >
                    Review Questions
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleQuizSubmit()}
                    style={{ backgroundColor: 'var(--success)', color: '#fff' }}
                  >
                    Submit Anyway
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 3. Quiz Score & Practice Feedback Screen
    if (quizResult && quizQuestions) {
      const breakdown = quizResult.subtopicBreakdown || {};
      const subtopicList = Object.keys(breakdown);
      const flaggedCount = Object.values(reviewedQuestions).filter(Boolean).length;

      // Filter questions according to active tab
      const displayedQuestions = quizQuestions.map((q, idx) => ({ ...q, originalIndex: idx })).filter((q) => {
        if (resultFilter === 'missed') {
          const selected = selectedAnswers[q.originalIndex];
          return selected === undefined || selected !== q.correctAnswer;
        }
        if (resultFilter === 'review') {
          return Boolean(reviewedQuestions[q.originalIndex]);
        }
        return true;
      });

      return (
        <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '820px', margin: '0 auto' }}>
          
          {/* Practice Diagnostics Header Card */}
          <div className="card-glass" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
            <Award size={48} style={{ color: quizResult.percentage >= 70 ? 'var(--success)' : 'var(--accent)', marginBottom: '0.75rem' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Practice Feedback & Diagnostics</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '520px', margin: '0.35rem auto 1.5rem auto', lineHeight: 1.45 }}>
              {quizResult.feedback}
            </p>

            {/* Score Ring & Performance Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', maxWidth: '560px', margin: '0 auto 2rem auto' }}>
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: quizResult.percentage >= 70 ? 'var(--success)' : 'var(--accent-hover)' }}>
                  {quizResult.percentage}%
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.2rem' }}>Accuracy</span>
              </div>
              
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
                  {quizResult.correctCount}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.2rem' }}>Correct</span>
              </div>

              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--error)' }}>
                  {quizResult.incorrectCount}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.2rem' }}>Incorrect</span>
              </div>

              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  {quizResult.unansweredCount}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.2rem' }}>Skipped</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {quizResult.incorrectCount + quizResult.unansweredCount > 0 ? (
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRetryMissedQuestions}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
                >
                  <RotateCcw size={16} /> Retry Missed Questions ({quizResult.incorrectCount + quizResult.unansweredCount})
                </button>
              ) : null}

              <button 
                type="button"
                className="btn btn-secondary"
                onClick={handlePracticeWeakAreas}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, color: 'var(--accent-hover)', borderColor: 'rgba(163, 230, 53, 0.4)' }}
              >
                <Target size={16} /> Practise Weak Areas
              </button>

              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setQuizResult(null);
                  setQuizQuestions(null);
                  setRetryMode(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Play size={16} /> New Quiz Setup
              </button>
            </div>
          </div>

          {/* Subtopic Performance Breakdown */}
          {subtopicList.length > 0 && (
            <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Layers size={18} style={{ color: 'var(--accent)' }} /> Performance by Subtopic
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {subtopicList.map((st) => {
                  const data = breakdown[st];
                  const pct = data.percentage;
                  let badgeText = 'Needs Work';
                  let badgeColor = 'var(--error)';
                  let badgeBg = 'rgba(239, 68, 68, 0.12)';

                  if (pct >= 80) {
                    badgeText = 'Strong';
                    badgeColor = 'var(--success)';
                    badgeBg = 'rgba(16, 185, 129, 0.12)';
                  } else if (pct >= 60) {
                    badgeText = 'Solid';
                    badgeColor = 'var(--accent-hover)';
                    badgeBg = 'rgba(163, 230, 53, 0.12)';
                  }

                  return (
                    <div key={st} style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{st}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '100px', backgroundColor: badgeBg, color: badgeColor }}>
                          {badgeText}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', margin: '0.5rem 0' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 80 ? 'var(--success)' : (pct >= 60 ? 'var(--accent)' : 'var(--error)'), borderRadius: '3px' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>{data.correct} of {data.total} correct</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Question Review with Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Review Questions & Explanations</h3>
            
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setResultFilter('all')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: resultFilter === 'all' ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  backgroundColor: resultFilter === 'all' ? 'rgba(163, 230, 53, 0.12)' : 'var(--bg-secondary)',
                  color: resultFilter === 'all' ? 'var(--accent-hover)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                All ({quizQuestions.length})
              </button>
              <button
                type="button"
                onClick={() => setResultFilter('missed')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: resultFilter === 'missed' ? '1px solid var(--error)' : '1px solid var(--border-color)',
                  backgroundColor: resultFilter === 'missed' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary)',
                  color: resultFilter === 'missed' ? 'var(--error)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Missed ({quizResult.incorrectCount + quizResult.unansweredCount})
              </button>
              {flaggedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setResultFilter('review')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: resultFilter === 'review' ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                    backgroundColor: resultFilter === 'review' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                    color: resultFilter === 'review' ? '#f59e0b' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Flagged ({flaggedCount})
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {displayedQuestions.map((q) => {
              const origIdx = q.originalIndex;
              const selectedIdx = selectedAnswers[origIdx];
              const correctIdx = q.correctAnswer;
              const isUnanswered = selectedIdx === undefined;
              const isCorrect = !isUnanswered && selectedIdx === correctIdx;
              const isFlagged = reviewedQuestions[origIdx];

              return (
                <div key={origIdx} className="card-glass" style={{ padding: '1.5rem', borderLeft: isCorrect ? '4px solid var(--success)' : (isUnanswered ? '4px solid var(--text-secondary)' : '4px solid var(--error)') }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isCorrect ? (
                        <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                      ) : isUnanswered ? (
                        <AlertCircle size={18} style={{ color: 'var(--text-secondary)' }} />
                      ) : (
                        <AlertCircle size={18} style={{ color: 'var(--error)' }} />
                      )}
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isCorrect ? 'var(--success)' : (isUnanswered ? 'var(--text-secondary)' : 'var(--error)') }}>
                        {isCorrect ? 'Correct' : isUnanswered ? 'Skipped / Unanswered' : 'Incorrect'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {q.subtopic && (
                        <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '100px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                          {q.subtopic}
                        </span>
                      )}
                      {isFlagged && (
                        <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '100px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 600 }}>
                          Flagged
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
                    Question {origIdx + 1}: {q.question}
                  </h4>

                  {/* Options status */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {q.options.map((opt, oIdx) => {
                      let optionStyle = {
                        padding: '0.6rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      };

                      if (oIdx === correctIdx) {
                        optionStyle.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                        optionStyle.border = '1px solid var(--success)';
                        optionStyle.color = 'var(--success)';
                        optionStyle.fontWeight = '600';
                      } else if (oIdx === selectedIdx && !isCorrect) {
                        optionStyle.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                        optionStyle.border = '1px solid var(--error)';
                        optionStyle.color = 'var(--error)';
                        optionStyle.fontWeight = '600';
                      }

                      return (
                        <div key={oIdx} style={optionStyle}>
                          <span>{opt}</span>
                          {oIdx === correctIdx && <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>✓ Correct Answer</span>}
                          {oIdx === selectedIdx && !isCorrect && <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>✗ Your Choice</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation box */}
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Concept Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  const renderRecommendationsTab = () => {
    if (!recommendations) return <div style={{ color: 'var(--text-secondary)' }}>No recommendations found.</div>;

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Skills & Next Tech */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Skills to improve */}
            <div className="card-glass" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>Skills to Refine</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommendations.skillsToImprove.map((item, idx) => (
                  <div key={idx} style={{ paddingBottom: '1rem', borderBottom: idx < recommendations.skillsToImprove.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{item.focusArea}</span>
                      <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(163, 230, 53, 0.1)', color: 'var(--accent-hover)', border: '1px solid rgba(163, 230, 53, 0.2)', padding: '0.15rem 0.5rem', borderRadius: '100px', fontWeight: 600 }}>
                        {item.skill}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {item.platforms.map(plat => (
                        <span key={plat} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          • {plat}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Tech */}
            <div className="card-glass" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>Technologies to Learn Next</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommendations.technologiesToLearnNext.map((tech, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--accent-hover)' }}>{tech.name}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{tech.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications & Platform details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Recommended Certifications */}
            <div className="card-glass" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={20} style={{ color: 'var(--accent)' }} /> Industry Certifications
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommendations.certifications.map((cert, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.75rem', borderBottom: idx < recommendations.certifications.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{cert.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Platform: {cert.platform}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                      <Clock size={12} /> {cert.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice platforms list */}
            <div className="card-glass" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>General Guidelines</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyOrigin: 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Practice Platforms:</span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {recommendations.practicePlatforms.map(p => (
                      <span key={p} style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyOrigin: 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated Preparation Time:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-hover)' }}>{recommendations.estimatedPrepTime}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Recommendations are generated by scanning your profile description and evaluating missing credentials relative to entry-level software positions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 6. Saved Roadmaps Tab
  const renderSavedRoadmapsTab = () => {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>Saved Career Roadmaps</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Curated preparation tracks saved to your profile for structured placement preparation.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchSavedRoadmaps}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
          >
            <RotateCcw size={14} /> Refresh
          </button>
        </div>

        {savedRoadmaps.length === 0 ? (
          <div className="card-glass" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Bookmark size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600 }}>No Saved Roadmaps Yet</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              Generate a custom career roadmap in the "Career Roadmap" tab and click "Save Roadmap to Profile".
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setActiveTab('roadmap')}>
              Generate A Roadmap
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedSavedRoadmap ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {selectedSavedRoadmap ? (
              <div className="card-glass" style={{ padding: '2rem', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-hover)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {selectedSavedRoadmap.preferredLanguage} • {selectedSavedRoadmap.currentSkillLevel}
                    </span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedSavedRoadmap.targetRole}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedSavedRoadmap(null)}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Back to All
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDeleteSavedRoadmap(selectedSavedRoadmap._id)}
                      style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.85rem' }}
                      title="Delete roadmap"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ position: 'relative', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '7px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
                  {selectedSavedRoadmap.stages?.map((stage, sIdx) => (
                    <div key={sIdx} style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '4px', left: '-2.15rem', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--accent)', border: '4px solid var(--bg-secondary)', zIndex: 2 }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Stage {sIdx + 1}: {stage.stageName}</h4>
                        {stage.duration && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '0.15rem 0.5rem', borderRadius: '100px', border: '1px solid var(--border-color)' }}>
                            {stage.duration}
                          </span>
                        )}
                      </div>
                      {stage.projects?.length > 0 && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                          {stage.projects[0]}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {stage.topics?.map((topic, tIdx) => (
                          <span key={tIdx} style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              savedRoadmaps.map((sRoadmap) => (
                <div key={sRoadmap._id} className="card-glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-hover)', fontWeight: 700 }}>
                        {sRoadmap.preferredLanguage} • {sRoadmap.currentSkillLevel}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedRoadmap(sRoadmap._id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Delete roadmap"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{sRoadmap.targetRole}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {sRoadmap.stages?.length || 0} Stages • {sRoadmap.estimatedDuration || 'Multi-month track'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedSavedRoadmap(sRoadmap)}
                    style={{ width: '100%', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    View Roadmap Timeline <ArrowRight size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // 7. Quiz History Tab
  const renderQuizHistoryTab = () => {
    const totalQuizzes = quizHistory.length;
    const avgScore = totalQuizzes > 0
      ? Math.round(quizHistory.reduce((acc, q) => acc + (q.accuracy || 0), 0) / totalQuizzes)
      : 0;

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        {/* Header Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="card-glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Quizzes Completed</span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>{totalQuizzes}</h3>
          </div>
          <div className="card-glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Accuracy</span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', color: avgScore >= 70 ? 'var(--success)' : 'var(--accent-hover)' }}>
              {avgScore}%
            </h3>
          </div>
        </div>

        {quizHistory.length === 0 ? (
          <div className="card-glass" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <History size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600 }}>No Past Quizzes Found</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              Take a practice quiz in the "Practice Quiz" tab to test and track your skill retention over time.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setActiveTab('quiz')}>
              Take Practice Quiz
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {quizHistory.map((attempt) => {
              const isExpanded = selectedAttempt === attempt._id;
              const formattedDate = new Date(attempt.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div key={attempt._id} className="card-glass" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '10px',
                        backgroundColor: attempt.accuracy >= 70 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: attempt.accuracy >= 70 ? 'var(--success)' : 'var(--error)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem'
                      }}>
                        {attempt.accuracy}%
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                          {attempt.topic}
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {attempt.difficulty} • {attempt.score}/{attempt.totalQuestions} correct • {formattedDate}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedAttempt(isExpanded ? null : attempt._id)}
                      style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {isExpanded ? 'Hide Review' : 'Review Questions'}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {isExpanded && attempt.answers && (
                    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeIn 0.25s ease' }}>
                      {attempt.answers.map((ans, aIdx) => (
                        <div key={aIdx} style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-primary)',
                          borderLeft: ans.isCorrect ? '3px solid var(--success)' : '3px solid var(--error)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            {ans.isCorrect ? (
                              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                            ) : (
                              <AlertCircle size={16} style={{ color: 'var(--error)' }} />
                            )}
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                              {aIdx + 1}. {ans.question}
                            </span>
                          </div>
                          {ans.explanation && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.5rem' }}>
                              {ans.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Styles Injection */}
      <style>{`
        .card-glass {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: var(--card-shadow);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
        }
        .card-glass:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
        }
        .ai-sidebar-nav {
          display: flex;
          flex-direction: row;
          gap: 0.5rem;
          margin-bottom: 2rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .ai-nav-item {
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          background-color: transparent;
          border: none;
          color: var(--text-secondary);
          white-space: nowrap;
          transition: all 0.2s ease;
          display: flex;
          alignItems: center;
          gap: 0.5rem;
        }
        .ai-nav-item:hover {
          color: var(--text-primary);
          background-color: var(--bg-primary);
        }
        .ai-nav-item.active {
          color: #111111;
          background-color: var(--accent);
        }
        [data-theme="dark"] .ai-nav-item.active {
          color: #111111;
          background-color: var(--accent);
        }
        .btn-text-action {
          background: none;
          border: none;
          color: var(--accent-hover);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem;
          transition: opacity 0.2s ease;
        }
        .btn-text-action:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-hover)', marginBottom: '0.25rem' }}>
            <Brain size={24} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>AI Portal</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
            AI Preparation Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Enhance your credentials, generate roadmaps, and practice mock technical question queries.
          </p>
        </div>
        <button 
          onClick={() => onPageChange('/candidate/dashboard')} 
          className="btn btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Toast Errors / Success alerts */}
      {error && (
        <div style={{ color: 'var(--error)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '10px', fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ color: 'var(--success)', padding: '1rem', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '10px', fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
          <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
          <span>{success}</span>
        </div>
      )}

      {/* Navigation Sub-menu */}
      <nav className="ai-sidebar-nav">
        <button className={`ai-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setError(''); setSuccess(''); }}>
          Dashboard
        </button>
        <button className={`ai-nav-item ${activeTab === 'resume' ? 'active' : ''}`} onClick={() => { setActiveTab('resume'); setError(''); setSuccess(''); }}>
          Resume Analysis
        </button>
        <button className={`ai-nav-item ${activeTab === 'roadmap' ? 'active' : ''}`} onClick={() => { setActiveTab('roadmap'); setError(''); setSuccess(''); }}>
          Career Roadmap
        </button>
        <button className={`ai-nav-item ${activeTab === 'savedRoadmaps' ? 'active' : ''}`} onClick={() => { setActiveTab('savedRoadmaps'); setError(''); setSuccess(''); fetchSavedRoadmaps(); }}>
          Saved Roadmaps
        </button>
        <button className={`ai-nav-item ${activeTab === 'interview' ? 'active' : ''}`} onClick={() => { setActiveTab('interview'); setError(''); setSuccess(''); }}>
          Interview Prep
        </button>
        <button className={`ai-nav-item ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => { setActiveTab('quiz'); setError(''); setSuccess(''); }}>
          Practice Quiz
        </button>
        <button className={`ai-nav-item ${activeTab === 'quizHistory' ? 'active' : ''}`} onClick={() => { setActiveTab('quizHistory'); setError(''); setSuccess(''); fetchQuizHistory(); }}>
          Quiz History
        </button>
        <button className={`ai-nav-item ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => { setActiveTab('recommendations'); setError(''); setSuccess(''); }}>
          Recommendations
        </button>
      </nav>

      {/* Content views rendering */}
      {loading && !quizActive && <LoadingSpinner />}
      
      <div style={{ display: loading && !quizActive ? 'none' : 'block' }}>
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'resume' && renderResumeTab()}
        {activeTab === 'roadmap' && renderRoadmapTab()}
        {activeTab === 'savedRoadmaps' && renderSavedRoadmapsTab()}
        {activeTab === 'interview' && renderInterviewTab()}
        {activeTab === 'quiz' && renderQuizTab()}
        {activeTab === 'quizHistory' && renderQuizHistoryTab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
      </div>

    </div>
  );
};

export default AIPreparation;
