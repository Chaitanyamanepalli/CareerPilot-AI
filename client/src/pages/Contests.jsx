// ====================================================
// Contests Page — CareerPilot AI
//
// Timed placement coding contests and sprints featuring:
// - Server-authoritative start/end time gates & countdown timer
// - Multi-problem arena with embedded Monaco Editor
// - Instant test case evaluation, ICPC-style scoring & penalty calculation
// - Real-time ranked leaderboards
// ====================================================

import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Trophy,
  Clock,
  Calendar,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  RotateCcw,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  Zap,
  Terminal,
  FileCode,
  Flame,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

const Contests = ({ onPageChange, user }) => {
  // Directory state
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'upcoming' | 'ended'
  const [contestsData, setContestsData] = useState({ active: [], upcoming: [], ended: [] });
  const [loadingContests, setLoadingContests] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);

  // Active Arena State (when user enters a contest)
  const [activeContestSlug, setActiveContestSlug] = useState(null);
  const [arenaData, setArenaData] = useState(null);
  const [loadingArena, setLoadingArena] = useState(false);
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Contest execution & submissions
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);

  // Leaderboard modal state
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [leaderboardContestSlug, setLeaderboardContestSlug] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch contests directory on mount
  useEffect(() => {
    fetchContests();
  }, [user]);

  const fetchContests = async () => {
    try {
      setLoadingContests(true);
      setError('');
      const res = await api.getContests();
      if (res.success && res.data) {
        setContestsData(res.data);
        // Default to active if any, otherwise upcoming
        if (res.data.active.length > 0) setActiveTab('active');
        else if (res.data.upcoming.length > 0) setActiveTab('upcoming');
        else setActiveTab('ended');
      }
    } catch (err) {
      console.error('Error fetching contests:', err.message);
      setError('Could not load coding contests.');
    } finally {
      setLoadingContests(false);
    }
  };

  // Timer countdown hook for live contest arena
  useEffect(() => {
    if (!arenaData || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          alert('Contest time has expired! Final submissions are being graded.');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [arenaData, timeRemaining]);

  // Format milliseconds into HH:MM:SS
  const formatTime = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Register for contest
  const handleRegister = async (contestId, autoEnterSlug = null) => {
    if (!user) {
      alert('Please log in as a candidate to register for contests.');
      onPageChange('/login');
      return;
    }

    try {
      setRegisteringId(contestId);
      setError('');
      setSuccess('');
      const res = await api.registerForContest(contestId);
      if (res.success) {
        setSuccess('Successfully registered for contest!');
        await fetchContests();
        if (autoEnterSlug) {
          enterArena(autoEnterSlug);
        }
      }
    } catch (err) {
      console.error('Registration failed:', err.message);
      setError(err.message || 'Contest registration failed');
    } finally {
      setRegisteringId(null);
    }
  };

  // Enter the live contest arena
  const enterArena = async (slug) => {
    try {
      setLoadingArena(true);
      setError('');
      setRunResult(null);
      setSubmissionResult(null);

      const res = await api.getContestArena(slug);
      if (res.success && res.data) {
        setArenaData(res.data);
        setActiveContestSlug(slug);
        setTimeRemaining(res.data.contest.timeRemainingMs || 0);

        // Load starter code for first problem
        const firstProb = res.data.problems[0];
        if (firstProb) {
          setSelectedProblemIndex(0);
          setCode(firstProb.starterCode?.[selectedLanguage] || firstProb.starterCode?.python || '');
        }
      }
    } catch (err) {
      console.error('Failed to enter arena:', err.message);
      setError(err.message || 'Could not enter contest arena');
    } finally {
      setLoadingArena(false);
    }
  };

  // Switch between problems in the arena
  const handleSelectProblem = (index) => {
    if (!arenaData?.problems?.[index]) return;
    setSelectedProblemIndex(index);
    setRunResult(null);
    setSubmissionResult(null);
    const prob = arenaData.problems[index];
    setCode(prob.starterCode?.[selectedLanguage] || prob.starterCode?.python || '');
  };

  // Handle language switch in arena
  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    const currentProb = arenaData?.problems?.[selectedProblemIndex];
    if (currentProb?.starterCode?.[newLang]) {
      setCode(currentProb.starterCode[newLang]);
    }
  };

  // Run sample code in arena
  const handleRunSample = async () => {
    const currentProb = arenaData?.problems?.[selectedProblemIndex];
    if (!currentProb || running || submitting) return;

    try {
      setRunning(true);
      setError('');
      setRunResult(null);

      const payload = {
        problemId: currentProb._id,
        language: selectedLanguage,
        code,
      };

      const res = await api.runCodingCode(payload);
      if (res.success && res.data) {
        setRunResult(res.data);
        setSelectedTestCaseIndex(0);
      }
    } catch (err) {
      console.error('Error running sample:', err.message);
      setError(err.message || 'Execution error');
    } finally {
      setRunning(false);
    }
  };

  // Submit problem solution to contest
  const handleSubmitContestProblem = async () => {
    const currentProb = arenaData?.problems?.[selectedProblemIndex];
    if (!currentProb || !activeContestSlug || running || submitting) return;

    try {
      setSubmitting(true);
      setError('');
      setSubmissionResult(null);
      setRunResult(null);

      const payload = {
        problemId: currentProb._id,
        language: selectedLanguage,
        code,
      };

      const res = await api.submitContestProblem(activeContestSlug, payload);
      if (res.success && res.data) {
        setSubmissionResult(res.data);
        setSelectedTestCaseIndex(0);

        // If accepted, update local arena problem solved status
        if (res.data.status === 'Accepted') {
          setArenaData((prev) => {
            const updatedProbs = [...prev.problems];
            updatedProbs[selectedProblemIndex].isSolved = true;
            return {
              ...prev,
              problems: updatedProbs,
              registration: {
                ...prev.registration,
                score: res.data.currentTotalScore,
              },
            };
          });
        }
      }
    } catch (err) {
      console.error('Error submitting to contest:', err.message);
      setError(err.message || 'Contest submission error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Leaderboard Modal
  const openLeaderboard = async (slug) => {
    try {
      setLeaderboardContestSlug(slug);
      setLeaderboardModalOpen(true);
      setLoadingLeaderboard(true);
      const res = await api.getContestLeaderboard(slug);
      if (res.success && res.data) {
        setLeaderboardData(res.data);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err.message);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // ====================================================
  // 1. ARENA WORKSPACE VIEW (When inside active contest)
  // ====================================================
  if (arenaData && activeContestSlug) {
    const currentProb = arenaData.problems[selectedProblemIndex];
    const activeTestCases = submissionResult?.testResults || runResult?.results || [];
    const currentTestCase = activeTestCases[selectedTestCaseIndex] || null;

    return (
      <div className="container" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
        
        {/* Top Sticky Status Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          {/* Contest info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => {
                if (window.confirm('Leave contest arena and return to directory? Your timer will continue running.')) {
                  setArenaData(null);
                  setActiveContestSlug(null);
                }
              }}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              <ArrowLeft size={14} /> Exit Arena
            </button>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{arenaData.contest.title}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Timed Placement Arena • Real-time Scoring
              </span>
            </div>
          </div>

          {/* Countdown Clock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.45rem 1.1rem',
              borderRadius: '100px',
              backgroundColor: timeRemaining < 10 * 60 * 1000 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(163, 230, 53, 0.15)',
              border: timeRemaining < 10 * 60 * 1000 ? '1px solid #ef4444' : '1px solid var(--accent)',
              color: timeRemaining < 10 * 60 * 1000 ? '#ef4444' : 'var(--accent)',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.05em'
            }}
          >
            <Clock size={16} />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Score & Leaderboard Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>
                {arenaData.registration?.score || 0} pts
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Your Score</span>
            </div>

            <button
              onClick={() => openLeaderboard(activeContestSlug)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '8px'
              }}
            >
              <Trophy size={14} style={{ color: 'var(--accent)' }} /> Live Leaderboard
            </button>
          </div>
        </div>

        {/* Problem Selector Strip */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {arenaData.problems.map((prob, idx) => {
            const isSelected = selectedProblemIndex === idx;
            return (
              <button
                key={prob._id || idx}
                onClick={() => handleSelectProblem(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                {prob.isSolved ? (
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                ) : (
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--border-color)' }} />
                )}
                <span>{prob.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                  ({prob.points} pts)
                </span>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: 'var(--error)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Workspace: Left Problem Description + Right Monaco Editor */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(340px, 480px) 1fr',
            gap: '1rem',
            height: '74vh',
            minHeight: '600px'
          }}
        >
          
          {/* Left Panel: Problem Statement */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.25rem',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{currentProb.title}</h3>
              <span
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: currentProb.isSolved ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                  color: currentProb.isSolved ? '#10b981' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {currentProb.isSolved ? 'Solved ✓' : `${currentProb.points} pts`}
              </span>
            </div>

            <div style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
              {currentProb.description}
            </div>

            {/* Constraints */}
            {currentProb.constraints && currentProb.constraints.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>Constraints:</h4>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {currentProb.constraints.map((c, i) => (
                    <li key={i}><code>{c}</code></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sample Cases */}
            {currentProb.sampleTestCases && currentProb.sampleTestCases.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem' }}>Examples:</h4>
                {currentProb.sampleTestCases.map((tc, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.25rem' }}>
                      Example {idx + 1}
                    </div>
                    <div><strong>Input:</strong> <pre style={{ margin: '0.2rem 0', padding: '0.3rem', backgroundColor: '#0d1117', color: '#e6edf3', borderRadius: '4px' }}>{tc.input}</pre></div>
                    <div><strong>Output:</strong> <pre style={{ margin: '0.2rem 0', padding: '0.3rem', backgroundColor: '#0d1117', color: '#e6edf3', borderRadius: '4px' }}>{tc.output}</pre></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel: Editor + Console */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Editor Top Bar */}
            <div
              style={{
                padding: '0.6rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript</option>
              </select>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleRunSample}
                  disabled={running || submitting}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Play size={13} /> {running ? 'Testing...' : 'Run Sample'}
                </button>
                <button
                  onClick={handleSubmitContestProblem}
                  disabled={running || submitting || timeRemaining <= 0}
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 1.1rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Send size={13} /> {submitting ? 'Evaluating...' : 'Submit to Contest'}
                </button>
              </div>
            </div>

            {/* Monaco Canvas */}
            <div style={{ flex: 1, minHeight: '320px', backgroundColor: '#1e1e1e' }}>
              <Editor
                height="100%"
                language={selectedLanguage === 'python' ? 'python' : 'javascript'}
                value={code}
                onChange={(val) => setCode(val || '')}
                theme="vs-dark"
                options={{
                  fontSize: 13.5,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  lineNumbers: 'on',
                  tabSize: 4,
                  fontFamily: 'Consolas, Monaco, monospace'
                }}
              />
            </div>

            {/* Bottom Console Panel */}
            <div style={{ height: '200px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', overflowY: 'auto', padding: '0.75rem 1rem' }}>
              {!runResult && !submissionResult ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  <Terminal size={20} style={{ opacity: 0.3, margin: '0 auto 0.3rem' }} />
                  Run sample or Submit solution to view live grading output.
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: (submissionResult?.status === 'Accepted' || runResult?.status === 'Accepted') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: (submissionResult?.status === 'Accepted' || runResult?.status === 'Accepted') ? '#10b981' : '#ef4444',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span>Verdict: {submissionResult?.status || runResult?.status}</span>
                    <span>
                      {submissionResult ? `${submissionResult.passedTestCases}/${submissionResult.totalTestCases} Cases • +${submissionResult.points} pts` : `${runResult.passedCount}/${runResult.totalCount} Sample Cases`}
                    </span>
                  </div>

                  {/* Test case buttons */}
                  {activeTestCases.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {activeTestCases.map((tc, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTestCaseIndex(idx)}
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            border: selectedTestCaseIndex === idx ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                            backgroundColor: tc.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: tc.passed ? '#10b981' : '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          {tc.passed ? '✓' : '✗'} Case {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentTestCase && (
                    <div style={{ fontSize: '0.78rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Input:</span>
                        <pre style={{ margin: '0.15rem 0', padding: '0.3rem', backgroundColor: '#0d1117', color: '#e6edf3', borderRadius: '4px' }}>
                          {currentTestCase.input}
                        </pre>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Output:</span>
                        <pre style={{ margin: '0.15rem 0', padding: '0.3rem', backgroundColor: '#0d1117', color: currentTestCase.passed ? '#10b981' : '#ef4444', borderRadius: '4px' }}>
                          {currentTestCase.actualOutput || '(Empty output)'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Leaderboard Modal inside Arena */}
        {renderLeaderboardModal()}
      </div>
    );
  }

  // Helper for rendering Leaderboard Modal
  function renderLeaderboardModal() {
    if (!leaderboardModalOpen) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Trophy size={22} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {leaderboardData?.contest?.title || 'Contest'} Leaderboard
              </h3>
            </div>
            <button
              onClick={() => setLeaderboardModalOpen(false)}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              Close ✕
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
            {loadingLeaderboard ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <LoadingSpinner />
              </div>
            ) : !leaderboardData?.leaderboard || leaderboardData.leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <Trophy size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
                <p>No participant submissions recorded on this leaderboard yet.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', width: '50px' }}>Rank</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Candidate</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Solved</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Score</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.leaderboard.map((row) => {
                    const isTop1 = row.rank === 1;
                    const isTop2 = row.rank === 2;
                    const isTop3 = row.rank === 3;
                    return (
                      <tr
                        key={row.userId || row.rank}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: row.userId === user?._id ? 'var(--sidebar-active-bg)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 800 }}>
                          {isTop1 ? '🥇 1' : isTop2 ? '🥈 2' : isTop3 ? '🥉 3' : `#${row.rank}`}
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {row.fullName}
                          </span>
                          {row.userId === user?._id && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 800 }}>
                              (You)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>
                          {row.solvedCount}
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--accent)' }}>
                          {row.score} pts
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {row.penaltyMinutes} min
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 2. CONTEST DIRECTORY VIEW (Default)
  // ====================================================
  const currentList = contestsData[activeTab] || [];

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Directory Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Trophy size={28} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Coding <span style={{ color: 'var(--accent)' }}>Contests</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Simulate real company hiring rounds with timed contests, hidden test cases & live leaderboards.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.9rem',
            borderRadius: '100px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text-secondary)'
          }}
        >
          <Shield size={14} style={{ color: 'var(--accent)' }} />
          <span>Server-Authoritative Clock & Penalty Scoring</span>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#10b981', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--error)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {/* Tabs bar: Active, Upcoming, Ended */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'active', label: 'Live Active Sprints', count: contestsData.active.length, icon: Flame, isLive: true },
          { id: 'upcoming', label: 'Upcoming Challenges', count: contestsData.upcoming.length, icon: Calendar },
          { id: 'ended', label: 'Past Contests (Leaderboards)', count: contestsData.ended.length, icon: Award }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: isActive ? 'var(--card-shadow)' : 'none'
              }}
            >
              {tab.isLive && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
              )}
              <IconComp size={16} style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
              <span>{tab.label}</span>
              <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem', borderRadius: '100px', backgroundColor: isActive ? 'var(--accent-light)' : 'var(--border-color)', color: isActive ? 'var(--accent)' : 'inherit', fontWeight: 700 }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contests Cards Grid */}
      {loadingContests ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <LoadingSpinner />
        </div>
      ) : currentList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
          <Trophy size={44} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <h3>No {activeTab} contests found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Check back soon for new placement sprint schedules!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {currentList.map((contest) => {
            const isLive = contest.status === 'active';
            const isRegistered = contest.isRegistered;

            return (
              <div
                key={contest._id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: isLive ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--card-shadow)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Status & Timing badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '100px',
                        backgroundColor: isLive ? 'rgba(163, 230, 53, 0.15)' : contest.status === 'upcoming' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-primary)',
                        color: isLive ? 'var(--accent)' : contest.status === 'upcoming' ? '#3b82f6' : 'var(--text-secondary)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {isLive ? '● Live Now' : contest.status === 'upcoming' ? 'Upcoming' : 'Ended'}
                    </span>

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} /> {contest.durationMinutes} Minutes
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {contest.title}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {contest.description}
                  </p>

                  {/* Problems & Participant count */}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Layers size={14} style={{ color: 'var(--accent)' }} />
                      <span>{contest.problemCount || 3} Challenges</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Users size={14} style={{ color: 'var(--accent)' }} />
                      <span>{contest.registeredCount || 0} Registered</span>
                    </div>
                  </div>

                  {/* Prizes */}
                  {contest.prizes && contest.prizes.length > 0 && (
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Award size={14} /> Rewards:
                      </div>
                      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {contest.prizes[0]}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Area */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  {isLive ? (
                    isRegistered ? (
                      <button
                        onClick={() => enterArena(contest.slug)}
                        disabled={loadingArena}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          borderRadius: '10px'
                        }}
                      >
                        Enter Arena <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(contest._id, contest.slug)}
                        disabled={registeringId === contest._id}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          borderRadius: '10px'
                        }}
                      >
                        Register & Enter Arena
                      </button>
                    )
                  ) : contest.status === 'upcoming' ? (
                    isRegistered ? (
                      <div
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          textAlign: 'center',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '10px',
                          color: '#10b981',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}
                      >
                        ✓ Registered (Starts {new Date(contest.startTime).toLocaleDateString()})
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegister(contest._id)}
                        disabled={registeringId === contest._id}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.75rem', fontWeight: 800, fontSize: '0.88rem', borderRadius: '10px' }}
                      >
                        {registeringId === contest._id ? 'Registering...' : 'Register for Challenge'}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => openLeaderboard(contest.slug)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.75rem', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '10px' }}
                    >
                      <Trophy size={16} style={{ color: 'var(--accent)' }} /> View Final Standings
                    </button>
                  )}

                  {/* Leaderboard button for active contest */}
                  {isLive && (
                    <button
                      onClick={() => openLeaderboard(contest.slug)}
                      className="btn btn-secondary"
                      style={{ padding: '0.75rem', borderRadius: '10px' }}
                      title="View Live Leaderboard"
                    >
                      <Trophy size={16} />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Modal in Directory View */}
      {renderLeaderboardModal()}

    </div>
  );
};

export default Contests;
