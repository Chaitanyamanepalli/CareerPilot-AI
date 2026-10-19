// ====================================================
// CodingPractice Page — CareerPilot AI
//
// Interactive placement coding platform featuring:
// - Curated problem database with category & difficulty filters
// - Monaco Code Editor with Python & JavaScript execution
// - Safe sandboxed test case evaluation & submission grading
// - Solved tracking, submission history, and problem editorials
// ====================================================

import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Code2,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  RotateCcw,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Check,
  Award,
  Zap,
  Terminal,
  FileCode,
  BookOpen,
  History,
  AlertCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const CodingPractice = ({ onPageChange, user }) => {
  // Navigation & Problem list state
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Active Problem Solver State
  const [activeProblem, setActiveProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [activeLeftTab, setActiveLeftTab] = useState('description'); // 'description' | 'history' | 'editorial'

  // Execution & Submission State
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState('results'); // 'results' | 'custom' | 'output'
  const [customInput, setCustomInput] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
  const [error, setError] = useState('');

  // Fetch problems on mount and when filters change
  useEffect(() => {
    fetchProblems();
  }, [selectedDifficulty, selectedCategory]);

  const fetchProblems = async () => {
    try {
      setLoadingProblems(true);
      setError('');
      const params = {};
      if (selectedDifficulty !== 'All') params.difficulty = selectedDifficulty;
      if (selectedCategory !== 'All') params.category = selectedCategory;

      const res = await api.getCodingProblems(params);
      if (res.success && res.data) {
        setProblems(res.data);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching coding problems:', err.message);
      setError('Could not load coding challenges.');
    } finally {
      setLoadingProblems(false);
    }
  };

  const getBlankBoilerplate = (lang) => {
    switch (lang) {
      case 'python':
        return `# Python 3 Solution Template\nimport sys\n\ndef solve():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    input_data = sys.stdin.read().strip()\n    solve()\n`;
      case 'javascript':
        return `// JavaScript (Node.js) Solution Template\nconst fs = require('fs');\n\nfunction solve() {\n    // Write your solution here\n}\n\nconst input = fs.readFileSync(0, 'utf-8').trim();\nsolve();\n`;
      case 'java':
        return `// Java (OpenJDK) Solution Template\nimport java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}\n`;
      case 'cpp':
        return `// C++ (GCC/Clang) Solution Template\n#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Write your solution here\n    return 0;\n}\n`;
      default:
        return '';
    }
  };

  // Open problem in the interactive solver
  const openProblem = async (slug) => {
    try {
      setLoadingProblem(true);
      setError('');
      setRunResult(null);
      setSubmissionResult(null);
      setActiveLeftTab('description');

      const res = await api.getCodingProblem(slug);
      if (res.success && res.data) {
        const prob = res.data;
        setActiveProblem(prob);

        // Initialize with a completely blank compiler editor
        setCode('');

        // Pre-fill custom input with sample test case 1
        if (prob.sampleTestCases && prob.sampleTestCases.length > 0) {
          setCustomInput(prob.sampleTestCases[0].input);
        }
      }
    } catch (err) {
      console.error('Error loading problem details:', err.message);
      setError('Could not open problem.');
    } finally {
      setLoadingProblem(false);
    }
  };

  // Handle language switch
  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    // Keep compiler clean and blank
    setCode('');
  };

  // Reset to blank compiler
  const handleResetCode = () => {
    if (!window.confirm('Clear compiler to a completely blank editor?')) return;
    setCode('');
  };

  // Run code against sample test cases
  const handleRunCode = async (useCustom = false) => {
    if (!activeProblem || running || submitting) return;

    try {
      setRunning(true);
      setError('');
      setRunResult(null);
      setActiveConsoleTab('results');

      const payload = {
        problemId: activeProblem._id,
        language: selectedLanguage,
        code,
        customInput: useCustom ? customInput : null,
      };

      const res = await api.runCodingCode(payload);
      if (res.success && res.data) {
        setRunResult(res.data);
        setSelectedTestCaseIndex(0);
      }
    } catch (err) {
      console.error('Error running code:', err.message);
      setError(err.message || 'Error executing code');
    } finally {
      setRunning(false);
    }
  };

  // Submit code for full evaluation against hidden test cases
  const handleSubmitSolution = async () => {
    if (!activeProblem || running || submitting) return;

    try {
      setSubmitting(true);
      setError('');
      setSubmissionResult(null);
      setRunResult(null);
      setActiveConsoleTab('results');

      const payload = {
        problemId: activeProblem._id,
        language: selectedLanguage,
        code,
      };

      const res = await api.submitCodingSolution(payload);
      if (res.success && res.data) {
        setSubmissionResult(res.data);
        setSelectedTestCaseIndex(0);

        // Update local problem status if accepted
        if (res.data.status === 'Accepted') {
          setProblems(prev =>
            prev.map(p => (p._id === activeProblem._id ? { ...p, isSolved: true } : p))
          );
          if (stats) {
            setStats(prev => ({
              ...prev,
              userSolvedCount: (prev.userSolvedCount || 0) + 1,
            }));
          }
        }

        // Refresh submission history tab
        const updatedProb = await api.getCodingProblem(activeProblem.slug);
        if (updatedProb.success && updatedProb.data) {
          setActiveProblem(prev => ({
            ...prev,
            userSubmissions: updatedProb.data.userSubmissions || [],
          }));
        }
      }
    } catch (err) {
      console.error('Error submitting solution:', err.message);
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side search and status filtering
  const filteredProblems = problems.filter((prob) => {
    const matchesSearch =
      prob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prob.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Solved'
        ? prob.isSolved
        : !prob.isSolved;

    return matchesSearch && matchesStatus;
  });

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Easy':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        };
      case 'Medium':
        return {
          backgroundColor: 'rgba(234, 179, 8, 0.12)',
          color: '#eab308',
          border: '1px solid rgba(234, 179, 8, 0.3)',
        };
      case 'Hard':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        };
      default:
        return {};
    }
  };

  // ====================================================
  // 1. SOLVER ARENA VIEW (When problem is selected)
  // ====================================================
  if (activeProblem) {
    const activeTestCases = submissionResult?.testResults || runResult?.results || [];
    const currentTestCase = activeTestCases[selectedTestCaseIndex] || null;

    return (
      <div className="container" style={{ paddingTop: '1.25rem', paddingBottom: '3rem' }}>
        
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setActiveProblem(null)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '8px'
              }}
            >
              <ArrowLeft size={16} /> Problems Directory
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{activeProblem.title}</h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '100px',
                ...getDifficultyBadge(activeProblem.difficulty)
              }}
            >
              {activeProblem.difficulty}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '100px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)'
              }}
            >
              {activeProblem.category}
            </span>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="java">Java (OpenJDK)</option>
              <option value="cpp">C++ (GCC/Clang)</option>
            </select>

            {/* Reset Code */}
            <button
              onClick={handleResetCode}
              title="Reset code template"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}
            >
              <RotateCcw size={14} /> Reset
            </button>

            {/* Run Code */}
            <button
              onClick={() => handleRunCode(false)}
              disabled={running || submitting}
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}
            >
              {running ? (
                <>
                  <LoadingSpinner size="sm" /> Running...
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" /> Run Code
                </>
              )}
            </button>

            {/* Submit Solution */}
            <button
              onClick={handleSubmitSolution}
              disabled={running || submitting}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 1.15rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" /> Submitting...
                </>
              ) : (
                <>
                  <Send size={14} /> Submit
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error notification */}
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

        {/* Two-Column Problem Solver Workspace */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(340px, 480px) 1fr',
            gap: '1rem',
            height: '78vh',
            minHeight: '620px'
          }}
        >
          
          {/* ====================================================
              LEFT PANEL: Description, Submissions, Editorial
              ==================================================== */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--card-shadow)'
            }}
          >
            {/* Left Panel Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)'
              }}
            >
              {[
                { id: 'description', label: 'Description', icon: FileCode },
                { id: 'history', label: `Submissions (${activeProblem.userSubmissions?.length || 0})`, icon: History },
                { id: 'editorial', label: 'Editorial', icon: BookOpen }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeLeftTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveLeftTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 0.5rem',
                      background: isActive ? 'var(--bg-secondary)' : 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <IconComponent size={14} style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              
              {/* DESCRIPTION TAB */}
              {activeLeftTab === 'description' && (
                <div>
                  {/* Markdown Description */}
                  <div
                    style={{
                      lineHeight: 1.6,
                      fontSize: '0.92rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                      marginBottom: '1.5rem'
                    }}
                  >
                    {activeProblem.description}
                  </div>

                  {/* Constraints */}
                  {activeProblem.constraints && activeProblem.constraints.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Constraints:
                      </h4>
                      <ul style={{ paddingLeft: '1.2rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {activeProblem.constraints.map((c, i) => (
                          <li key={i}>
                            <code style={{ backgroundColor: 'var(--bg-primary)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                              {c}
                            </code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sample Test Cases */}
                  {activeProblem.sampleTestCases && activeProblem.sampleTestCases.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        Sample Test Cases:
                      </h4>
                      {activeProblem.sampleTestCases.map((tc, idx) => (
                        <div
                          key={idx}
                          style={{
                            marginBottom: '1rem',
                            padding: '0.9rem',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: '0.84rem'
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'var(--accent)' }}>
                            Example {idx + 1}
                          </div>
                          <div style={{ marginBottom: '0.35rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Input:</span>
                            <pre style={{ margin: '0.2rem 0', padding: '0.4rem', backgroundColor: '#0d1117', color: '#e6edf3', borderRadius: '6px', fontFamily: 'monospace' }}>
                              {tc.input}
                            </pre>
                          </div>
                          <div style={{ marginBottom: '0.35rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Output:</span>
                            <pre style={{ margin: '0.2rem 0', padding: '0.4rem', backgroundColor: '#0d1117', color: '#e6edf3', borderRadius: '6px', fontFamily: 'monospace' }}>
                              {tc.output}
                            </pre>
                          </div>
                          {tc.explanation && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                              <strong>Explanation:</strong> {tc.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBMISSIONS TAB */}
              {activeLeftTab === 'history' && (
                <div>
                  {!activeProblem.userSubmissions || activeProblem.userSubmissions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      <History size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                      <p>No submissions for this problem yet.</p>
                      <p style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>Click "Submit" to evaluate your solution!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {activeProblem.userSubmissions.map((sub, sIdx) => {
                        const isAccepted = sub.status === 'Accepted';
                        return (
                          <div
                            key={sIdx}
                            style={{
                              padding: '0.85rem 1rem',
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.84rem'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isAccepted ? (
                                  <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                                ) : (
                                  <XCircle size={16} style={{ color: '#ef4444' }} />
                                )}
                                <span style={{ fontWeight: 700, color: isAccepted ? '#10b981' : '#ef4444' }}>
                                  {sub.status}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                  ({sub.language})
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Passed {sub.passedTestCases}/{sub.totalTestCases} test cases • {sub.runtime} ms
                              </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* EDITORIAL TAB */}
              {activeLeftTab === 'editorial' && (
                <div>
                  {activeProblem.editorial ? (
                    <div
                      style={{
                        lineHeight: 1.6,
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {activeProblem.editorial}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      <BookOpen size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                      <p>Editorial is being prepared for this problem.</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>You can also ask the CareerPilot AI Chatbot for hints!</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* ====================================================
              RIGHT PANEL: Monaco Editor + Console Output
              ==================================================== */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: 'var(--card-shadow)'
            }}
          >
            {/* Monaco Editor Canvas */}
            <div style={{ flex: 1, minHeight: '300px', backgroundColor: '#1e1e1e' }}>
              <Editor
                height="100%"
                language={
                  selectedLanguage === 'python' ? 'python' :
                  selectedLanguage === 'javascript' ? 'javascript' :
                  selectedLanguage === 'java' ? 'java' :
                  selectedLanguage === 'cpp' ? 'cpp' : 'plaintext'
                }
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
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                }}
              />
            </div>

            {/* Bottom Console / Test Results Panel */}
            <div
              style={{
                height: '240px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-primary)'
              }}
            >
              {/* Console Tabs */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)'
                }}
              >
                <div style={{ display: 'flex' }}>
                  {[
                    { id: 'results', label: 'Test Results' },
                    { id: 'custom', label: 'Custom Input' },
                    { id: 'output', label: 'Console Output' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveConsoleTab(tab.id)}
                      style={{
                        padding: '0.55rem 0.85rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeConsoleTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeConsoleTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Verdict Pill */}
                {submissionResult && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '100px',
                      backgroundColor: submissionResult.status === 'Accepted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: submissionResult.status === 'Accepted' ? '#10b981' : '#ef4444',
                      border: submissionResult.status === 'Accepted' ? '1px solid #10b981' : '1px solid #ef4444'
                    }}
                  >
                    {submissionResult.status} ({submissionResult.passedTestCases}/{submissionResult.totalTestCases})
                  </span>
                )}
              </div>

              {/* Console Body Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1rem' }}>
                
                {/* 1. TEST RESULTS TAB */}
                {activeConsoleTab === 'results' && (
                  <div>
                    {!runResult && !submissionResult ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        <Terminal size={24} style={{ opacity: 0.3, margin: '0 auto 0.4rem' }} />
                        <p>Click <strong>Run Code</strong> to test against sample cases, or <strong>Submit</strong> to evaluate all hidden cases.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Status banner */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            backgroundColor: (submissionResult?.status === 'Accepted' || runResult?.status === 'Accepted') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: (submissionResult?.status === 'Accepted' || runResult?.status === 'Accepted') ? '#10b981' : '#ef4444',
                            fontSize: '0.85rem',
                            fontWeight: 700
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {(submissionResult?.status === 'Accepted' || runResult?.status === 'Accepted') ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <XCircle size={16} />
                            )}
                            <span>Verdict: {submissionResult?.status || runResult?.status}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Runtime: {submissionResult?.runtime || runResult?.runtime || 0} ms
                          </span>
                        </div>

                        {/* Test Case Pill Buttons */}
                        {activeTestCases.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            {activeTestCases.map((tc, idx) => {
                              const isSelected = selectedTestCaseIndex === idx;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedTestCaseIndex(idx)}
                                  style={{
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                                    backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                    color: tc.passed ? '#10b981' : '#ef4444',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  {tc.passed ? '✓' : '✗'} Case {idx + 1}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Selected Test Case Details */}
                        {currentTestCase && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.8rem' }}>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Input:</span>
                              <pre style={{ margin: '0.2rem 0', padding: '0.4rem', backgroundColor: '#0d1117', color: '#e6edf3', borderRadius: '6px', fontFamily: 'monospace' }}>
                                {currentTestCase.input}
                              </pre>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Expected Output:</span>
                              <pre style={{ margin: '0.2rem 0', padding: '0.4rem', backgroundColor: '#0d1117', color: '#e6edf3', borderRadius: '6px', fontFamily: 'monospace' }}>
                                {currentTestCase.expectedOutput}
                              </pre>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Your Output:</span>
                              <pre style={{ margin: '0.2rem 0', padding: '0.4rem', backgroundColor: '#0d1117', color: currentTestCase.passed ? '#10b981' : '#ef4444', borderRadius: '6px', fontFamily: 'monospace' }}>
                                {currentTestCase.actualOutput || '(Empty output)'}
                              </pre>
                              {currentTestCase.error && (
                                <div style={{ color: 'var(--error)', marginTop: '0.3rem', fontSize: '0.78rem' }}>
                                  {currentTestCase.error}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. CUSTOM INPUT TAB */}
                {activeConsoleTab === 'custom' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Standard Input (stdin):
                      </span>
                      <button
                        onClick={() => handleRunCode(true)}
                        disabled={running}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        Run with Custom Input
                      </button>
                    </div>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom input to pipe into your program..."
                      rows={4}
                      style={{
                        width: '100%',
                        backgroundColor: '#0d1117',
                        color: '#e6edf3',
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        fontSize: '0.82rem',
                        fontFamily: 'monospace',
                        resize: 'none'
                      }}
                    />
                  </div>
                )}

                {/* 3. CONSOLE OUTPUT TAB */}
                {activeConsoleTab === 'output' && (
                  <div>
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.6rem',
                        backgroundColor: '#0d1117',
                        color: runResult?.stderr ? '#ef4444' : '#e6edf3',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontFamily: 'monospace',
                        minHeight: '80px',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {runResult?.stderr || runResult?.stdout || 'No console output. Run code to view stdout/stderr.'}
                    </pre>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ====================================================
  // 2. PROBLEMS DIRECTORY VIEW (Default)
  // ====================================================
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Code2 size={28} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Coding <span style={{ color: 'var(--accent)' }}>Practice Arena</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Master curated DSA placement challenges with our in-browser Monaco editor and sandboxed judge.
          </p>
        </div>

        {/* Engine status indicator */}
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
          <Zap size={14} style={{ color: 'var(--accent)' }} />
          <span>Python 3 & Node.js Native Runner</span>
        </div>
      </div>

      {/* Progress & Statistics Banner */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          {/* Solved Count Card */}
          <div className="dashboard-stat-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Solved Challenges</span>
              <Award size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>
              {stats.userSolvedCount || 0} <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {stats.totalProblems}</span>
            </div>
          </div>

          {/* Easy Count */}
          <div className="dashboard-stat-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>Easy Problems</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, marginTop: '0.4rem' }}>
              {stats.easyCount}
            </div>
          </div>

          {/* Medium Count */}
          <div className="dashboard-stat-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: '#eab308', fontWeight: 700 }}>Medium Problems</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, marginTop: '0.4rem' }}>
              {stats.mediumCount}
            </div>
          </div>

          {/* Hard Count */}
          <div className="dashboard-stat-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 700 }}>Hard Problems</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, marginTop: '0.4rem' }}>
              {stats.hardCount}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px'
        }}
      >
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 240px', backgroundColor: 'var(--bg-primary)', padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems by name or tag (e.g. 'Binary Search', 'DP')..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              width: '100%'
            }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Difficulty */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <option value="All">All Categories</option>
            <option value="Arrays">Arrays</option>
            <option value="Strings">Strings</option>
            <option value="Dynamic Programming">Dynamic Programming</option>
            <option value="Searching & Sorting">Searching & Sorting</option>
            <option value="Stack & Queue">Stack & Queue</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <option value="All">All Status</option>
            <option value="Solved">Solved</option>
            <option value="Unsolved">Unsolved</option>
          </select>
        </div>
      </div>

      {/* Problems Table */}
      {loadingProblems ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <LoadingSpinner />
        </div>
      ) : filteredProblems.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
          <Code2 size={40} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <h3>No matching problems found</h3>
          <p style={{ fontSize: '0.88rem', marginTop: '0.25rem' }}>Try clearing filters or searching for another term.</p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', width: '50px' }}>
                  Status
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Title
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Category
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Difficulty
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Acceptance
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((prob) => {
                const diffBadge = getDifficultyBadge(prob.difficulty);
                return (
                  <tr
                    key={prob._id}
                    onClick={() => openProblem(prob.slug)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Status */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {prob.isSolved ? (
                        <CheckCircle2 size={18} style={{ color: '#10b981' }} title="Solved" />
                      ) : (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--border-color)' }} title="Unsolved" />
                      )}
                    </td>

                    {/* Title & Tags */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {prob.title}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        {prob.tags?.slice(0, 3).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {prob.category}
                    </td>

                    {/* Difficulty */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '100px',
                          ...diffBadge
                        }}
                      >
                        {prob.difficulty}
                      </span>
                    </td>

                    {/* Acceptance */}
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {prob.acceptanceRate || 65}%
                    </td>

                    {/* Action */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openProblem(prob.slug);
                        }}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {prob.isSolved ? 'Review' : 'Solve'} <ChevronRight size={14} />
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
  );
};

export default CodingPractice;
