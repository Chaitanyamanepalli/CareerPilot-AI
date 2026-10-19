// ====================================================
// Admin Dashboard Component — CareerPilot AI
//
// Refined, focused administrative command center:
// 1. Overview: Useful metrics (users, active jobs, applications) & recent activity
// 2. Jobs: Create, edit, publish, close, archive (preserves application history)
// 3. Students: Search, view essential admin profile, suspend & reactivate
// 4. Applications: Review, filter, update status with candidate email notifications
// 5. Learning Content: Maintain AI Prep Hub quizzes & Code Practice challenges with preview
// 6. Security Audit: Minimal record of administrative actions
// ====================================================

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Shield,
  Users,
  Briefcase,
  FileText,
  Trash2,
  Search,
  AlertCircle,
  RefreshCw,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  Calendar,
  Code2,
  BookOpen,
  Lock,
  Unlock,
  Building,
  Filter,
  Layers,
  ArrowUpRight,
  MessageSquare,
  Send,
  X,
  User,
  Clock,
  Video,
  MailCheck,
} from 'lucide-react';

const AdminDashboard = ({ onPageChange, user, socket }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'jobs' | 'students' | 'applications' | 'content' | 'audit'
  const [contentSubTab, setContentSubTab] = useState('quizzes'); // 'quizzes' | 'coding'

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data Collections
  const [jobs, setJobs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [applications, setApplications] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [codingProblems, setCodingProblems] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [appStatusFilter, setAppStatusFilter] = useState('all');

  // In-Dashboard Candidate Chat State
  const [activeChatApp, setActiveChatApp] = useState(null);
  const [activeChatConv, setActiveChatConv] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const chatMessagesEndRef = useRef(null);

  // Interview Scheduling Modal State
  const [interviewModalApp, setInterviewModalApp] = useState(null);
  const [interviewFormData, setInterviewFormData] = useState({
    interviewDate: '',
    interviewTime: '10:00 AM IST',
    interviewMeetingLink: 'https://meet.google.com/cp-interview',
    interviewNotes: 'Technical & Problem Solving Evaluation. Please join 5 minutes early in a quiet environment.',
    platform: 'Google Meet',
  });

  // Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    salaryRange: '',
    jobType: 'Full Time',
    description: '',
    experience: '0-2 Yrs',
    jobStatus: 'Open',
    closingDate: '',
  });

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizFormData, setQuizFormData] = useState({
    topic: '',
    subtopic: '',
    difficulty: 'Medium',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    isPublished: true,
  });

  const [isCodingModalOpen, setIsCodingModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [codingFormData, setCodingFormData] = useState({
    title: '',
    difficulty: 'Easy',
    category: 'Arrays',
    description: '',
    isPublished: true,
  });

  const [selectedJobApps, setSelectedJobApps] = useState(null);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5500);
  };

  // 1. Fetch Overview Stats
  const fetchStats = async () => {
    try {
      const res = await api.getAdminStats();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err.message);
    }
  };

  // 2. Fetch Tab Specific Data
  const fetchTabData = async () => {
    setTabLoading(true);
    setError('');
    try {
      if (activeTab === 'jobs') {
        const res = await api.getAdminJobs({ status: jobStatusFilter, search: searchQuery });
        setJobs(res.data || []);
      } else if (activeTab === 'students') {
        const res = await api.getAdminUsers({ role: roleFilter, status: userStatusFilter, search: searchQuery });
        setUsersList(res.data || []);
      } else if (activeTab === 'applications') {
        const res = await api.getAdminApplications({ status: appStatusFilter, search: searchQuery });
        setApplications(res.data || []);
      } else if (activeTab === 'content') {
        if (contentSubTab === 'quizzes') {
          const res = await api.getAdminQuizQuestions({ search: searchQuery });
          setQuizQuestions(res.data || []);
        } else {
          const res = await api.getAdminCodingProblems({ search: searchQuery });
          setCodingProblems(res.data || []);
        }
      } else if (activeTab === 'audit') {
        const res = await api.getAdminAuditLogs({ limit: 40 });
        setAuditLogs(res.data || []);
      }
    } catch (err) {
      showError(err.message || 'Failed to load section data');
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchStats();
      await fetchTabData();
      setLoading(false);
    };
    init();
  }, [activeTab, contentSubTab]);

  useEffect(() => {
    if (!loading) {
      fetchTabData();
    }
  }, [jobStatusFilter, roleFilter, userStatusFilter, appStatusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTabData();
  };

  // ====================================================
  // JOB MANAGEMENT
  // ====================================================
  const handleOpenJobModal = (job = null) => {
    if (job) {
      setEditingJob(job);
      setJobFormData({
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        salary: job.salary || '',
        salaryRange: job.salaryRange || '',
        jobType: job.jobType || 'Full Time',
        description: job.description || '',
        experience: job.experience || '0-2 Yrs',
        jobStatus: job.jobStatus || 'Open',
        closingDate: job.closingDate ? new Date(job.closingDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingJob(null);
      setJobFormData({
        title: '',
        company: '',
        location: '',
        salary: '',
        salaryRange: '',
        jobType: 'Full Time',
        description: '',
        experience: '0-2 Yrs',
        jobStatus: 'Open',
        closingDate: '',
      });
    }
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await api.updateAdminJob(editingJob._id, jobFormData);
        showSuccess(`Job '${jobFormData.title}' updated successfully`);
      } else {
        await api.createAdminJob(jobFormData);
        showSuccess(`Job '${jobFormData.title}' published successfully`);
      }
      setIsJobModalOpen(false);
      fetchTabData();
      fetchStats();
    } catch (err) {
      showError(err.message || 'Failed to save job listing');
    }
  };

  const handleJobStatusChange = async (id, status) => {
    try {
      await api.setAdminJobStatus(id, status);
      showSuccess(`Job status updated to ${status}`);
      fetchTabData();
      fetchStats();
    } catch (err) {
      showError(err.message || 'Failed to update job status');
    }
  };

  const handleDeleteJob = async (job) => {
    if (window.confirm(`Archive job '${job.title}' by ${job.company}? (Preserves application history safely)`)) {
      try {
        const res = await api.deleteAdminJob(job._id, false);
        showSuccess(res.message || `Job archived`);
        fetchTabData();
        fetchStats();
      } catch (err) {
        showError(err.message || 'Failed to archive job');
      }
    }
  };

  const handleViewJobApps = async (job) => {
    try {
      const res = await api.getAdminJobApplications(job._id);
      setSelectedJobApps({
        jobTitle: job.title,
        company: job.company,
        apps: res.data || [],
      });
    } catch (err) {
      showError(err.message || 'Failed to fetch applications for this job');
    }
  };

  // ====================================================
  // STUDENT ACCOUNT MANAGEMENT
  // ====================================================
  const handleToggleUserStatus = async (targetUser) => {
    const newStatus = targetUser.accountStatus === 'suspended' ? 'active' : 'suspended';
    const actionLabel = newStatus === 'suspended' ? 'SUSPEND' : 'REACTIVATE';

    if (window.confirm(`Are you sure you want to ${actionLabel} account for ${targetUser.fullName}?`)) {
      try {
        await api.updateAdminUserStatus(targetUser._id, newStatus);
        showSuccess(`Account for ${targetUser.fullName} is now ${newStatus}`);
        fetchTabData();
        fetchStats();
      } catch (err) {
        showError(err.message || `Failed to update status`);
      }
    }
  };

  // ====================================================
  // APPLICATION MANAGEMENT & INLINE CHAT
  // ====================================================
  // Scroll chat messages to bottom
  useEffect(() => {
    if (activeChatApp) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChatApp]);

  // Real-time Socket.IO chat synchronization
  useEffect(() => {
    if (socket && activeChatConv) {
      socket.emit('joinConversation', activeChatConv._id);

      const handleReceiveMessage = (msg) => {
        if (msg.conversationId === activeChatConv._id) {
          setChatMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
      };

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('new_message', handleReceiveMessage);

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('new_message', handleReceiveMessage);
      };
    }
  }, [socket, activeChatConv]);

  const handleOpenAppChat = async (app) => {
    try {
      setActiveChatApp(app);
      setChatLoading(true);
      setChatMessages([]);
      const convRes = await api.createConversation(app._id);
      if (convRes && convRes.data) {
        setActiveChatConv(convRes.data);
        const msgRes = await api.getMessages(convRes.data._id);
        setChatMessages(msgRes.data || []);
      }
    } catch (err) {
      showError(err.message || 'Failed to initialize candidate chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleCloseChat = () => {
    setActiveChatApp(null);
    setActiveChatConv(null);
    setChatMessages([]);
    setChatInputText('');
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeChatConv || chatSending) return;

    const textToSend = chatInputText.trim();
    setChatInputText('');
    setChatSending(true);

    try {
      const res = await api.sendChatMessage(activeChatConv._id, textToSend);
      const newMsg = res.data;
      setChatMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

      if (socket) {
        socket.emit('sendMessage', {
          _id: newMsg._id,
          conversationId: activeChatConv._id,
          sender: user._id,
          senderId: user._id,
          text: textToSend,
          createdAt: newMsg.createdAt,
          readStatus: false,
        });
      }
    } catch (err) {
      showError(err.message || 'Failed to send message');
    } finally {
      setChatSending(false);
    }
  };

  const handleUpdateAppStatus = async (appId, newStatusOrPayload) => {
    const payload = typeof newStatusOrPayload === 'string' ? { status: newStatusOrPayload } : newStatusOrPayload;
    const statusVal = payload.status;

    // Optimistic UI update so status changes immediately without lag
    setApplications((prev) =>
      prev.map((app) => (app._id === appId ? { ...app, ...payload } : app))
    );
    if (selectedJobApps) {
      setSelectedJobApps((prev) =>
        prev
          ? {
              ...prev,
              apps: prev.apps.map((app) => (app._id === appId ? { ...app, ...payload } : app)),
            }
          : null
      );
    }

    try {
      await api.updateAdminApplicationStatus(appId, payload);
      showSuccess(`Status changed to ${statusVal}. Professional notification email dispatched.`);
      fetchTabData();
      fetchStats();
    } catch (err) {
      showError(err.message || 'Failed to update application status');
      fetchTabData();
    }
  };

  const handleStatusChangeSelect = (app, newStatus) => {
    if (newStatus === 'Interview Scheduled') {
      setInterviewModalApp(app);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');

      setInterviewFormData({
        interviewDate: `${yyyy}-${mm}-${dd}`,
        interviewTime: '10:30 AM IST',
        interviewMeetingLink: 'https://meet.google.com/cp-interview',
        interviewNotes: 'Technical & System Design Evaluation. Please join 5 minutes early with your IDE ready.',
        platform: 'Google Meet',
      });
    } else {
      handleUpdateAppStatus(app._id, newStatus);
    }
  };

  const handleConfirmScheduleInterview = async (e) => {
    e.preventDefault();
    if (!interviewModalApp) return;

    const appId = interviewModalApp._id;
    const payload = {
      status: 'Interview Scheduled',
      interviewDate: interviewFormData.interviewDate,
      interviewTime: interviewFormData.interviewTime,
      interviewMeetingLink: interviewFormData.interviewMeetingLink,
      interviewNotes: interviewFormData.interviewNotes,
    };

    // Optimistically update status
    setApplications((prev) =>
      prev.map((app) => (app._id === appId ? { ...app, ...payload } : app))
    );
    if (selectedJobApps) {
      setSelectedJobApps((prev) =>
        prev
          ? {
              ...prev,
              apps: prev.apps.map((app) => (app._id === appId ? { ...app, ...payload } : app)),
            }
          : null
      );
    }

    try {
      await api.updateAdminApplicationStatus(appId, payload);
      showSuccess(`Interview scheduled for ${interviewModalApp.name || 'Candidate'}. Professional invitation email dispatched!`);
      setInterviewModalApp(null);
      fetchTabData();
      fetchStats();
    } catch (err) {
      showError(err.message || 'Failed to schedule interview');
      fetchTabData();
    }
  };

  // ====================================================
  // QUIZ CONTENT MANAGEMENT (AI PREP HUB)
  // ====================================================
  const handleOpenQuizModal = (item = null) => {
    if (item) {
      setEditingQuiz(item);
      setQuizFormData({
        topic: item.topic || '',
        subtopic: item.subtopic || '',
        difficulty: item.difficulty || 'Medium',
        question: item.question || '',
        options: item.options || ['', '', '', ''],
        correctAnswer: item.correctAnswer !== undefined ? item.correctAnswer : 0,
        explanation: item.explanation || '',
        isPublished: item.isPublished !== undefined ? item.isPublished : true,
      });
    } else {
      setEditingQuiz(null);
      setQuizFormData({
        topic: '',
        subtopic: '',
        difficulty: 'Medium',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        isPublished: true,
      });
    }
    setIsQuizModalOpen(true);
  };

  const handleSaveQuizQuestion = async (e) => {
    e.preventDefault();
    if (quizFormData.options.some((opt) => !opt.trim())) {
      showError('All 4 option fields must be non-empty.');
      return;
    }
    try {
      if (editingQuiz) {
        await api.updateAdminQuizQuestion(editingQuiz._id, quizFormData);
        showSuccess('Practice question updated successfully');
      } else {
        await api.createAdminQuizQuestion(quizFormData);
        showSuccess('Practice question published to AI Prep Hub');
      }
      setIsQuizModalOpen(false);
      fetchTabData();
      fetchStats();
    } catch (err) {
      showError(err.message || 'Failed to save question');
    }
  };

  const handleToggleQuizStatus = async (item) => {
    try {
      await api.setAdminQuizQuestionStatus(item._id, !item.isPublished);
      showSuccess(`Question ${!item.isPublished ? 'Published' : 'Unpublished'}`);
      fetchTabData();
    } catch (err) {
      showError(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (window.confirm('Remove this practice question from the question bank?')) {
      try {
        await api.deleteAdminQuizQuestion(id);
        showSuccess('Question removed');
        fetchTabData();
      } catch (err) {
        showError(err.message || 'Failed to remove question');
      }
    }
  };

  // ====================================================
  // CODE PRACTICE CONTENT MANAGEMENT
  // ====================================================
  const handleOpenCodingModal = (problem = null) => {
    if (problem) {
      setEditingProblem(problem);
      setCodingFormData({
        title: problem.title || '',
        difficulty: problem.difficulty || 'Easy',
        category: problem.category || 'Arrays',
        description: problem.description || '',
        isPublished: problem.isPublished !== undefined ? problem.isPublished : true,
      });
    } else {
      setEditingProblem(null);
      setCodingFormData({
        title: '',
        difficulty: 'Easy',
        category: 'Arrays',
        description: '',
        isPublished: true,
      });
    }
    setIsCodingModalOpen(true);
  };

  const handleSaveCodingProblem = async (e) => {
    e.preventDefault();
    try {
      if (editingProblem) {
        await api.updateAdminCodingProblem(editingProblem._id, codingFormData);
        showSuccess(`Coding challenge '${codingFormData.title}' updated`);
      } else {
        await api.createAdminCodingProblem(codingFormData);
        showSuccess(`Coding challenge '${codingFormData.title}' created`);
      }
      setIsCodingModalOpen(false);
      fetchTabData();
      fetchStats();
    } catch (err) {
      showError(err.message || 'Failed to save coding problem');
    }
  };

  const handleToggleCodingStatus = async (problem) => {
    try {
      await api.setAdminCodingProblemStatus(problem._id, !problem.isPublished);
      showSuccess(`Problem ${!problem.isPublished ? 'Published' : 'Archived/Unpublished'}`);
      fetchTabData();
    } catch (err) {
      showError(err.message || 'Failed to toggle problem status');
    }
  };

  const handleDeleteCodingProblem = async (problem) => {
    if (window.confirm(`Remove coding problem '${problem.title}'?`)) {
      try {
        await api.deleteAdminCodingProblem(problem._id);
        showSuccess('Coding problem removed');
        fetchTabData();
      } catch (err) {
        showError(err.message || 'Failed to delete problem');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Alert Toasts */}
      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(163, 230, 53, 0.12)',
          border: '1px solid var(--accent)',
          color: 'var(--text-primary)',
          borderRadius: '10px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}>
          <CheckCircle2 size={18} style={{ color: 'var(--accent-hover)' }} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid #ef4444',
          color: '#f87171',
          borderRadius: '10px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.25rem',
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Shield size={16} /> Admin Command Center
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            CareerPilot Administration
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem', margin: 0 }}>
            Manage job vacancies, student accounts, applications, and platform operations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => { fetchStats(); fetchTabData(); }}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            title="Refresh metrics"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          {activeTab === 'jobs' && (
            <button
              onClick={() => handleOpenJobModal()}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> New Job Posting
            </button>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.75rem',
        marginBottom: '2rem',
        overflowX: 'auto',
      }}>
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Layers },
          { id: 'jobs', label: `Jobs (${stats ? stats.totalJobs : 0})`, icon: Briefcase },
          { id: 'students', label: `Students (${stats ? stats.totalCandidates : 0})`, icon: Users },
          { id: 'applications', label: `Applications (${stats ? stats.totalApplications : 0})`, icon: FileText },
          { id: 'audit', label: 'Audit Records', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#111111' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* TAB 1: OVERVIEW & REAL METRICS */}
      {/* ==================================================== */}
      {activeTab === 'overview' && stats && (
        <div>
          {/* Top 3 Core Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}>
            <div className="dashboard-stat-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Users</span>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(163,230,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <Users size={20} />
                </div>
              </div>
              <h3 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0' }}>{stats.totalUsers}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {stats.totalCandidates} candidates · {stats.totalRecruiters} recruiters
              </span>
            </div>

            <div className="dashboard-stat-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Job Postings</span>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                  <Briefcase size={20} />
                </div>
              </div>
              <h3 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0' }}>{stats.activeJobs}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Accepting student applications ({stats.totalJobs} total listings)
              </span>
            </div>

            <div className="dashboard-stat-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Applications</span>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                  <FileText size={20} />
                </div>
              </div>
              <h3 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0' }}>{stats.totalApplications}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Submitted across all live vacancies
              </span>
            </div>
          </div>

          {/* Recent Application Activity Table */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Recent Application Activity</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Latest candidate submissions requiring administrator or recruiter review
                </p>
              </div>
              <button
                onClick={() => setActiveTab('applications')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                View All <ArrowUpRight size={14} />
              </button>
            </div>

            {(!stats.recentApplications || stats.recentApplications.length === 0) ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No recent applications submitted yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem' }}>Student Applicant</th>
                      <th style={{ padding: '0.75rem' }}>Position & Company</th>
                      <th style={{ padding: '0.75rem' }}>Applied On</th>
                      <th style={{ padding: '0.75rem' }}>Current Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentApplications.map((app) => (
                      <tr key={app._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 700 }}>{app.name || (app.candidateId && app.candidateId.fullName) || 'Candidate'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{app.email || (app.candidateId && app.candidateId.email)}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{app.jobId ? app.jobId.title : 'Archived Listing'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{app.jobId ? app.jobId.company : ''}</div>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '100px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor:
                              app.status === 'Shortlisted' || app.status === 'Hired'
                                ? 'rgba(16,185,129,0.15)'
                                : app.status === 'Rejected'
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(99,102,241,0.15)',
                            color:
                              app.status === 'Shortlisted' || app.status === 'Hired'
                                ? 'var(--success)'
                                : app.status === 'Rejected'
                                ? '#ef4444'
                                : '#6366f1',
                          }}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: JOB MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'jobs' && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
              {['all', 'Open', 'Draft', 'Closed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setJobStatusFilter(st)}
                  className={`btn ${jobStatusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                >
                  {st === 'all' ? 'All Jobs' : st}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.45rem 1rem 0.45rem 2.2rem',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    width: '220px',
                    outline: 'none',
                  }}
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}>
                Search
              </button>
            </form>
          </div>

          {tabLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}><LoadingSpinner /></div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No job postings found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '760px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Role & Company</th>
                    <th style={{ padding: '0.75rem' }}>Location</th>
                    <th style={{ padding: '0.75rem' }}>Salary</th>
                    <th style={{ padding: '0.75rem' }}>Publish Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontWeight: 700 }}>{job.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building size={13} /> {job.company}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div>{job.location}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{job.jobType}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>
                        {job.salaryRange || `₹ ${(job.salary / 100000).toFixed(1)} LPA`}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <select
                          value={job.jobStatus}
                          onChange={(e) => handleJobStatusChange(job._id, e.target.value)}
                          style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: job.jobStatus === 'Open' ? 'rgba(16,185,129,0.15)' : job.jobStatus === 'Draft' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            color: job.jobStatus === 'Open' ? 'var(--success)' : job.jobStatus === 'Draft' ? '#f59e0b' : '#ef4444',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="Open">Open (Published)</option>
                          <option value="Draft">Draft (Unpublished)</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleViewJobApps(job)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Inspect Applicants"
                          >
                            <Eye size={13} /> Applicants
                          </button>
                          <button
                            onClick={() => handleOpenJobModal(job)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Edit Job"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.35rem' }}
                            title="Archive Job"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: STUDENT ACCOUNTS */}
      {/* ==================================================== */}
      {activeTab === 'students' && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                {['all', 'active', 'suspended'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setUserStatusFilter(s)}
                    className={`btn ${userStatusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  >
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.45rem 1rem 0.45rem 2.2rem',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    width: '260px',
                    outline: 'none',
                  }}
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}>
                Search
              </button>
            </form>
          </div>

          {tabLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}><LoadingSpinner /></div>
          ) : usersList.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No accounts found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Student Name</th>
                    <th style={{ padding: '0.75rem' }}>Email Address</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Joined Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isSelf = u._id === user._id;
                    const isSuspended = u.accountStatus === 'suspended';
                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                        <td style={{ padding: '0.85rem 0.75rem' }}>
                          <div style={{ fontWeight: 700 }}>{u.fullName}</div>
                          {u.skills && u.skills.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {u.skills.slice(0, 3).join(', ')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>
                          {u.email}
                        </td>
                        <td style={{ padding: '0.85rem 0.75rem' }}>
                          <span style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '100px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: u.role === 'admin' ? 'rgba(163,230,53,0.15)' : u.role === 'recruiter' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
                            color: u.role === 'admin' ? 'var(--accent)' : u.role === 'recruiter' ? '#6366f1' : 'var(--success)',
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 0.75rem' }}>
                          <span style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '100px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: isSuspended ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                            color: isSuspended ? '#ef4444' : 'var(--success)',
                          }}>
                            {isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={isSelf}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: isSuspended ? 'var(--success)' : '#ef4444',
                              opacity: isSelf ? 0.4 : 1,
                            }}
                            title={isSelf ? 'Cannot suspend self' : isSuspended ? 'Reactivate Student Account' : 'Suspend Account'}
                          >
                            {isSuspended ? <Unlock size={13} /> : <Lock size={13} />}
                            <span>{isSuspended ? 'Reactivate' : 'Suspend'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: APPLICATION MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'applications' && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
              {['all', 'Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired'].map((st) => (
                <button
                  key={st}
                  onClick={() => setAppStatusFilter(st)}
                  className={`btn ${appStatusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                >
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search candidate or job..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.45rem 1rem 0.45rem 2.2rem',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    width: '240px',
                    outline: 'none',
                  }}
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}>
                Filter
              </button>
            </form>
          </div>

          {tabLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}><LoadingSpinner /></div>
          ) : applications.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No applications match the selected criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Applicant</th>
                    <th style={{ padding: '0.75rem' }}>Applied Position</th>
                    <th style={{ padding: '0.75rem' }}>Submitted On</th>
                    <th style={{ padding: '0.75rem' }}>Resume</th>
                    <th style={{ padding: '0.75rem' }}>Status & Email Notification</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontWeight: 700 }}>{app.name || (app.candidateId && app.candidateId.fullName)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.email || (app.candidateId && app.candidateId.email)}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontWeight: 600 }}>{app.jobId ? app.jobId.title : 'Archived Job'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{app.jobId ? app.jobId.company : ''}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        {app.resumeUrl || (app.candidateId && app.candidateId.resumeUrl) ? (
                          <a
                            href={app.resumeUrl || (app.candidateId && app.candidateId.resumeUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}
                          >
                            <ExternalLink size={13} /> Resume
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChangeSelect(app, e.target.value)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor:
                                app.status === 'Shortlisted' || app.status === 'Hired'
                                  ? 'rgba(16,185,129,0.15)'
                                  : app.status === 'Rejected'
                                  ? 'rgba(239,68,68,0.15)'
                                  : 'rgba(99,102,241,0.15)',
                              color:
                                app.status === 'Shortlisted' || app.status === 'Hired'
                                  ? 'var(--success)'
                                  : app.status === 'Rejected'
                                  ? '#ef4444'
                                  : '#6366f1',
                              border: '1px solid var(--border-color)',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="Applied">Applied</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Hired">Hired</option>
                          </select>

                          {app.status === 'Interview Scheduled' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChangeSelect(app, 'Interview Scheduled')}
                              className="btn btn-secondary"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(99,102,241,0.12)',
                                color: '#6366f1',
                                borderColor: 'rgba(99,102,241,0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                              title="Inspect or Reschedule Interview Calendar"
                            >
                              <Calendar size={12} /> Schedule
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenAppChat(app)}
                            className="btn btn-secondary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--accent)',
                              cursor: 'pointer',
                            }}
                            title={`Chat with ${app.name || (app.candidateId && app.candidateId.fullName) || 'Candidate'}`}
                          >
                            <MessageSquare size={13} /> Chat
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: MINIMAL AUDIT RECORDS */}
      {/* ==================================================== */}
      {activeTab === 'audit' && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Administrative Audit Log</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Immutable historical records of high-impact admin operations.
              </p>
            </div>
            <button
              onClick={fetchTabData}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Refresh
            </button>
          </div>

          {tabLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}><LoadingSpinner /></div>
          ) : auditLogs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No audit logs recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Date & Time</th>
                    <th style={{ padding: '0.75rem' }}>Acting Admin</th>
                    <th style={{ padding: '0.75rem' }}>Action</th>
                    <th style={{ padding: '0.75rem' }}>Entity</th>
                    <th style={{ padding: '0.75rem' }}>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 600 }}>{log.adminName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.adminEmail}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--accent)' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {log.targetType}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE / EDIT JOB */}
      {/* ==================================================== */}
      {isJobModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                {editingJob ? 'Edit Job Posting' : 'Post New Job Vacancy'}
              </h3>
              <button
                onClick={() => setIsJobModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Job Title *</label>
                  <input
                    type="text"
                    required
                    value={jobFormData.title}
                    onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Company Name *</label>
                  <input
                    type="text"
                    required
                    value={jobFormData.company}
                    onChange={(e) => setJobFormData({ ...jobFormData, company: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Location *</label>
                  <input
                    type="text"
                    required
                    value={jobFormData.location}
                    onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Employment Type</label>
                  <select
                    value={jobFormData.jobType}
                    onChange={(e) => setJobFormData({ ...jobFormData, jobType: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Annual Salary (INR) *</label>
                  <input
                    type="number"
                    required
                    value={jobFormData.salary}
                    onChange={(e) => setJobFormData({ ...jobFormData, salary: e.target.value, salaryRange: `₹ ${(Number(e.target.value)/100000).toFixed(1)} LPA` })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Publishing Status</label>
                  <select
                    value={jobFormData.jobStatus}
                    onChange={(e) => setJobFormData({ ...jobFormData, jobStatus: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  >
                    <option value="Open">Open (Published)</option>
                    <option value="Draft">Draft (Unpublished)</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Job Description *</label>
                <textarea
                  required
                  rows={5}
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                  {editingJob ? 'Update Job' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE / EDIT QUIZ QUESTION */}
      {/* ==================================================== */}
      {isQuizModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {editingQuiz ? 'Edit Practice Question' : 'Add Curated Practice Question'}
              </h3>
              <button
                onClick={() => setIsQuizModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveQuizQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Topic *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JavaScript, Data Structures"
                    value={quizFormData.topic}
                    onChange={(e) => setQuizFormData({ ...quizFormData, topic: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Difficulty *</label>
                  <select
                    value={quizFormData.difficulty}
                    onChange={(e) => setQuizFormData({ ...quizFormData, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Question Prompt *</label>
                <textarea
                  required
                  rows={3}
                  value={quizFormData.question}
                  onChange={(e) => setQuizFormData({ ...quizFormData, question: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>4 Options *</label>
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                    <input
                      type="radio"
                      name="correctAnswerOption"
                      checked={Number(quizFormData.correctAnswer) === idx}
                      onChange={() => setQuizFormData({ ...quizFormData, correctAnswer: idx })}
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${idx + 1}`}
                      value={quizFormData.options[idx] || ''}
                      onChange={(e) => {
                        const newOpts = [...quizFormData.options];
                        newOpts[idx] = e.target.value;
                        setQuizFormData({ ...quizFormData, options: newOpts });
                      }}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                  </div>
                ))}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Select the radio button next to the correct answer.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Explanation *</label>
                <textarea
                  required
                  rows={2}
                  value={quizFormData.explanation}
                  onChange={(e) => setQuizFormData({ ...quizFormData, explanation: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE / EDIT CODING PROBLEM */}
      {/* ==================================================== */}
      {isCodingModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {editingProblem ? 'Edit Coding Problem' : 'New Coding Challenge'}
              </h3>
              <button
                onClick={() => setIsCodingModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveCodingProblem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Problem Title *</label>
                <input
                  type="text"
                  required
                  value={codingFormData.title}
                  onChange={(e) => setCodingFormData({ ...codingFormData, title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                  <select
                    value={codingFormData.category}
                    onChange={(e) => setCodingFormData({ ...codingFormData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  >
                    <option value="Arrays">Arrays</option>
                    <option value="Strings">Strings</option>
                    <option value="Linked Lists">Linked Lists</option>
                    <option value="Trees">Trees</option>
                    <option value="Dynamic Programming">Dynamic Programming</option>
                    <option value="Searching & Sorting">Searching & Sorting</option>
                    <option value="Stack & Queue">Stack & Queue</option>
                    <option value="Graphs">Graphs</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Difficulty</label>
                  <select
                    value={codingFormData.difficulty}
                    onChange={(e) => setCodingFormData({ ...codingFormData, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Problem Description *</label>
                <textarea
                  required
                  rows={5}
                  value={codingFormData.description}
                  onChange={(e) => setCodingFormData({ ...codingFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCodingModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: VIEW APPLICATIONS FOR SPECIFIC JOB */}
      {/* ==================================================== */}
      {selectedJobApps && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Applicants for {selectedJobApps.jobTitle}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedJobApps.company}</span>
              </div>
              <button
                onClick={() => setSelectedJobApps(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            {selectedJobApps.apps.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No candidate applications submitted for this job yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedJobApps.apps.map((app) => (
                  <div
                    key={app._id}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{app.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Applied on {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChangeSelect(app, e.target.value)}
                        style={{
                          padding: '0.3rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Hired">Hired</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleOpenAppChat(app)}
                        className="btn btn-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.55rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                        }}
                        title="Direct chat with applicant"
                      >
                        <MessageSquare size={13} /> Chat
                      </button>

                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
                        >
                          <ExternalLink size={13} /> Resume
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: INTERVIEW SCHEDULING (CALENDAR & TIME PICKER) */}
      {/* ==================================================== */}
      {interviewModalApp && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(99,102,241,0.15)',
                    color: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Schedule Interview</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {interviewModalApp.name || (interviewModalApp.candidateId && interviewModalApp.candidateId.fullName) || 'Candidate'} •{' '}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {interviewModalApp.jobId?.title || 'Applied Role'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInterviewModalApp(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Cancel"
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Email Dispatch Info Banner */}
            <div
              style={{
                backgroundColor: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.78rem',
                color: 'var(--text-primary)',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}
            >
              ✉️ <strong>Automated Corporate Invitation:</strong> Upon confirming, a professional calendar itinerary email with meeting details and prep links will be dispatched directly to{' '}
              <strong>{interviewModalApp.email || (interviewModalApp.candidateId && interviewModalApp.candidateId.email)}</strong>.
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmScheduleInterview} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Row 1: Date & Time Picker */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <Calendar size={14} style={{ color: '#6366f1' }} /> Interview Date (Calendar) *
                  </label>
                  <input
                    type="date"
                    required
                    value={interviewFormData.interviewDate}
                    onChange={(e) => setInterviewFormData({ ...interviewFormData, interviewDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <Clock size={14} style={{ color: '#6366f1' }} /> Time & Timezone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30 AM IST"
                    value={interviewFormData.interviewTime}
                    onChange={(e) => setInterviewFormData({ ...interviewFormData, interviewTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Time quick chips */}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '-0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Quick Time:</span>
                {['10:00 AM IST', '11:30 AM IST', '02:00 PM IST', '04:00 PM IST', '05:30 PM IST'].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setInterviewFormData({ ...interviewFormData, interviewTime: slot })}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      borderRadius: '4px',
                      backgroundColor: interviewFormData.interviewTime === slot ? 'rgba(99,102,241,0.2)' : 'var(--bg-secondary)',
                      color: interviewFormData.interviewTime === slot ? '#6366f1' : 'var(--text-primary)',
                      borderColor: interviewFormData.interviewTime === slot ? '#6366f1' : 'var(--border-color)',
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {/* Row 2: Platform & Meeting Link */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <Video size={14} style={{ color: '#6366f1' }} /> Platform / Mode *
                  </label>
                  <select
                    value={interviewFormData.platform}
                    onChange={(e) => {
                      const plat = e.target.value;
                      let linkDefault = interviewFormData.interviewMeetingLink;
                      if (plat === 'Google Meet' && (!linkDefault || linkDefault.includes('zoom'))) {
                        linkDefault = 'https://meet.google.com/cp-interview';
                      } else if (plat === 'Zoom Meeting' && (!linkDefault || linkDefault.includes('meet.google'))) {
                        linkDefault = 'https://zoom.us/j/1234567890';
                      }
                      setInterviewFormData({ ...interviewFormData, platform: plat, interviewMeetingLink: linkDefault });
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom Meeting">Zoom Meeting</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Office In-Person">Office In-Person</option>
                    <option value="Phone Call">Phone Call</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Meeting URL / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://meet.google.com/..."
                    value={interviewFormData.interviewMeetingLink}
                    onChange={(e) => setInterviewFormData({ ...interviewFormData, interviewMeetingLink: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Notes / Instructions for Candidate */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Interview Round & Preparation Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Round 1: Data Structures, Problem Solving & Live Coding. Please have your development environment ready."
                  value={interviewFormData.interviewNotes}
                  onChange={(e) => setInterviewFormData({ ...interviewFormData, interviewNotes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setInterviewModalApp(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  <Send size={15} /> Confirm & Send Invitation Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================================================== */}
      {/* INLINE ADMIN CHAT DRAWER / WIDGET ON ADMIN DASHBOARD */}
      {/* ==================================================== */}
      {activeChatApp && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '400px',
            maxWidth: 'calc(100vw - 3rem)',
            height: '530px',
            maxHeight: 'calc(100vh - 3rem)',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10000,
            overflow: 'hidden',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '0.85rem 1.1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                {(activeChatApp.name || (activeChatApp.candidateId && activeChatApp.candidateId.fullName) || 'C').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeChatApp.name || (activeChatApp.candidateId && activeChatApp.candidateId.fullName) || 'Candidate'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeChatApp.jobId?.title || 'Applicant'} • <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{activeChatApp.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => {
                  const candidateId = activeChatApp.candidateId?._id || activeChatApp.candidateId;
                  onPageChange('chat', candidateId ? { recipientId: candidateId } : {});
                }}
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                title="Open in full screen chat"
              >
                <ExternalLink size={12} /> Full Page
              </button>
              <button
                type="button"
                onClick={handleCloseChat}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Thread */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            {chatLoading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                <LoadingSpinner />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Loading conversation...
                </div>
              </div>
            ) : chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 0.6rem auto', opacity: 0.3 }} />
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>No messages yet</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Directly message the applicant regarding interview scheduling or updates.
                </div>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMine = (msg.sender?._id || msg.sender || msg.senderId) === user._id;
                return (
                  <div
                    key={msg._id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '0.55rem 0.85rem',
                        borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        backgroundColor: isMine ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: isMine ? '#0f172a' : 'var(--text-primary)',
                        border: isMine ? 'none' : '1px solid var(--border-color)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        fontSize: '0.825rem',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                      }}
                    >
                      <div style={{ fontWeight: isMine ? 600 : 500 }}>{msg.text}</div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          justifyContent: 'flex-end',
                          marginTop: '0.2rem',
                          fontSize: '0.625rem',
                          opacity: 0.75,
                        }}
                      >
                        <span>
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                        {isMine && (
                          <span style={{ fontWeight: 'bold' }}>
                            {msg.readStatus ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Chat Footer / Input Form */}
          <form
            onSubmit={handleSendChatMessage}
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder={`Message ${activeChatApp.name || 'candidate'}...`}
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              disabled={chatLoading}
              style={{
                flex: 1,
                padding: '0.55rem 0.9rem',
                borderRadius: '100px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.825rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!chatInputText.trim() || chatSending || chatLoading}
              className="btn btn-primary"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: chatInputText.trim() && !chatSending ? 'pointer' : 'default',
                opacity: chatInputText.trim() && !chatSending ? 1 : 0.6,
              }}
              title="Send Message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
