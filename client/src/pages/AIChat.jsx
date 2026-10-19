// ====================================================
// AIChat Page — CareerPilot AI
//
// Conversational AI Placement Assistant powered by local Ollama (gemma3:4b).
// Features:
// - Multi-session conversations persisted in MongoDB
// - Contextual DSA, System Design, HR, and Resume coaching
// - Beautiful formatted markdown & code blocks with copy button
// - Instant starter prompt cards
// - Session management (create, switch, delete)
// ====================================================

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  MessageSquare,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Copy,
  Check,
  Code2,
  Briefcase,
  FileText,
  Brain,
  Layers,
  ArrowRight,
  Terminal,
  Clock,
  RefreshCw
} from 'lucide-react';

// Starter prompt presets for candidates
const STARTER_PROMPTS = [
  {
    category: 'Coding',
    icon: Code2,
    color: '#3b82f6',
    title: 'Two Sum in Python',
    prompt: 'Explain the optimal Hash Map solution for the Two Sum problem in Python with time and space complexity analysis.'
  },
  {
    category: 'HR',
    icon: Briefcase,
    color: '#10b981',
    title: 'Mock HR Question',
    prompt: 'Conduct a mock interview for the question: "Tell me about a time you resolved a major conflict in a team project." Use the STAR technique to evaluate my answer.'
  },
  {
    category: 'Resume',
    icon: FileText,
    color: '#eab308',
    title: 'Resume Bullet Optimizer',
    prompt: 'How should I rewrite this project bullet on my resume to make it stand out with metrics: "Built a MERN stack e-commerce web app with authentication and payment gateway"?'
  },
  {
    category: 'Technical',
    icon: Layers,
    color: '#a855f7',
    title: 'System Design: URL Shortener',
    prompt: 'Walk me through a high-level system design for a URL shortener like bit.ly. Cover hashing, database choice, and caching.'
  }
];

// Lightweight Markdown & Code Block Formatter
const MessageRenderer = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) return null;

  // Split by code blocks ```...```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract code and optional language
          const firstLineEnd = part.indexOf('\n');
          const lang = part.substring(3, firstLineEnd).trim() || 'code';
          const code = part.substring(firstLineEnd + 1, part.length - 3).replace(/\r\n/g, '\n');

          return (
            <div
              key={index}
              style={{
                margin: '0.9rem 0',
                borderRadius: '10px',
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
                overflow: 'hidden',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.88rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.4rem 0.85rem',
                  backgroundColor: '#161b22',
                  borderBottom: '1px solid #30363d',
                  color: '#8b949e',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                <span>{lang}</span>
                <button
                  onClick={() => handleCopy(code, index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedIndex === index ? 'var(--accent)' : '#8b949e',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px'
                  }}
                  title="Copy code"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check size={13} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre
                style={{
                  padding: '1rem',
                  margin: 0,
                  overflowX: 'auto',
                  color: '#e6edf3',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.5
                }}
              >
                {code}
              </pre>
            </div>
          );
        }

        // Render formatted text for regular paragraphs
        const lines = part.split('\n');
        return (
          <div key={index}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              // Empty lines
              if (!trimmed) {
                return <div key={lIdx} style={{ height: '0.5rem' }} />;
              }

              // Heading 3 / 2
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} style={{ margin: '0.8rem 0 0.3rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {trimmed.substring(4)}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lIdx} style={{ margin: '1rem 0 0.4rem', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {trimmed.substring(3)}
                  </h3>
                );
              }

              // Bullet points
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0', paddingLeft: '0.5rem' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 800 }}>•</span>
                    <span>{renderInlineFormatting(trimmed.substring(2))}</span>
                  </div>
                );
              }

              // Numbered list (e.g., "1. ")
              const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numberedMatch) {
                return (
                  <div key={lIdx} style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0', paddingLeft: '0.5rem' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, minWidth: '1.2rem' }}>{numberedMatch[1]}.</span>
                    <span>{renderInlineFormatting(numberedMatch[2])}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} style={{ margin: '0.35rem 0' }}>
                  {renderInlineFormatting(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Helper for bold and inline code within lines
const renderInlineFormatting = (text) => {
  if (!text) return '';
  // Split on bold (`**...**`) and inline code (`` `...` ``)
  const segments = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);

  return segments.map((seg, sIdx) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return <strong key={sIdx} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{seg.substring(2, seg.length - 2)}</strong>;
    }
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code
          key={sIdx}
          style={{
            padding: '0.15rem 0.35rem',
            borderRadius: '4px',
            backgroundColor: 'rgba(163, 230, 53, 0.12)',
            color: 'var(--accent-hover)',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '0.86rem'
          }}
        >
          {seg.substring(1, seg.length - 1)}
        </code>
      );
    }
    return seg;
  });
};

const AIChat = ({ onPageChange, user }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [filterCategory, setFilterCategory] = useState('All');
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load conversation list on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      setError('');
      const res = await api.getAIChatConversations();
      if (res.success && res.data) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error('Error fetching AI conversations:', err.message);
      setError('Could not load chat history.');
    } finally {
      setLoadingConversations(false);
    }
  };

  // Select and load a conversation session
  const selectConversation = async (convId) => {
    try {
      setLoadingChat(true);
      setError('');
      const res = await api.getAIChatConversation(convId);
      if (res.success && res.data) {
        setActiveConversation(res.data);
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error('Error loading conversation:', err.message);
      setError('Failed to load conversation messages.');
    } finally {
      setLoadingChat(false);
    }
  };

  // Start a fresh conversation
  const handleNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setInputMessage('');
    textareaRef.current?.focus();
  };

  // Delete a conversation session
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat session?')) return;

    try {
      const res = await api.deleteAIChatConversation(convId);
      if (res.success) {
        setConversations(prev => prev.filter(c => c._id !== convId));
        if (activeConversation?._id === convId) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err.message);
      alert('Could not delete conversation.');
    }
  };

  // Send message handler
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    setError('');
    setInputMessage('');

    // If starting a brand new conversation without active session
    if (!activeConversation) {
      try {
        setSending(true);
        // Optimistically show user message
        const optimisticUserMsg = {
          role: 'user',
          content: text,
          timestamp: new Date().toISOString()
        };
        setMessages([optimisticUserMsg]);

        const res = await api.startAIChatConversation({
          category: selectedCategory,
          initialMessage: text
        });

        if (res.success && res.data) {
          setActiveConversation(res.data);
          setMessages(res.data.messages || []);
          // Refresh sidebar list
          fetchConversations();
        }
      } catch (err) {
        console.error('Error starting conversation:', err.message);
        setError('Failed to send message. Please ensure Ollama is running.');
      } finally {
        setSending(false);
      }
      return;
    }

    // Existing conversation: append and call backend
    const optimisticUserMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticUserMsg]);
    setSending(true);

    try {
      const res = await api.sendAIChatMessage(activeConversation._id, text);
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data.message]);
        // Update title if refreshed
        if (res.data.conversationTitle) {
          setActiveConversation(prev => ({
            ...prev,
            title: res.data.conversationTitle
          }));
        }
        fetchConversations();
      }
    } catch (err) {
      console.error('Error sending message:', err.message);
      setError('Failed to receive AI response. Please check your connection to Ollama.');
    } finally {
      setSending(false);
    }
  };

  // Handle textarea enter submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filtered conversations list
  const filteredConversations = filterCategory === 'All'
    ? conversations
    : conversations.filter(c => c.category === filterCategory);

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={24} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              CareerPilot <span style={{ color: 'var(--accent)' }}>AI Placement Coach</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Your 24/7 technical interviewer, DSA mentor, and behavioral coach.
          </p>
        </div>

        {/* Engine status indicator pill */}
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
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}
          />
          <span>Ollama AI • gemma3:4b</span>
        </div>
      </div>

      {/* Main Chat Workspace Grid (Sidebar + Chat Area) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 310px) 1fr',
          gap: '1.25rem',
          height: '75vh',
          minHeight: '560px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        
        {/* ====================================================
            LEFT SIDEBAR: Conversation Sessions & Controls
            ==================================================== */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-primary)',
            borderRight: '1px solid var(--border-color)',
            padding: '1.25rem',
            overflow: 'hidden'
          }}
        >
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              fontWeight: 700,
              padding: '0.75rem',
              borderRadius: '12px',
              marginBottom: '1rem'
            }}
          >
            <Plus size={18} /> New Conversation
          </button>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {['All', 'General', 'Technical', 'HR', 'Resume', 'Coding'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '100px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  border: filterCategory === cat ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  backgroundColor: filterCategory === cat ? 'var(--accent-light)' : 'transparent',
                  color: filterCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Session List Title */}
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Saved Conversations ({filteredConversations.length})
          </div>

          {/* Scrollable Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.2rem' }}>
            {loadingConversations ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <LoadingSpinner />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                <MessageSquare size={28} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                <p>No conversations yet.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Click "New Conversation" to start!</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConversation?._id === conv._id;
                return (
                  <div
                    key={conv._id}
                    onClick={() => selectConversation(conv._id)}
                    style={{
                      padding: '0.7rem 0.85rem',
                      borderRadius: '10px',
                      backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                      border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', flex: 1 }}>
                      <MessageSquare size={16} style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {conv.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {conv.category} • {conv.messageCount} msgs
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.opacity = '0.6'; }}
                      title="Delete chat session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick link back to prep hub */}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => onPageChange('/ai-preparation')}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.4rem'
              }}
            >
              ← Back to Prep Hub
            </button>
          </div>
        </aside>

        {/* ====================================================
            RIGHT MAIN CHAT WINDOW
            ==================================================== */}
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          {/* Chat Window Top Bar */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(163, 230, 53, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  flexShrink: 0
                }}
              >
                <Bot size={20} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {activeConversation ? activeConversation.title : 'New AI Placement Session'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {activeConversation ? `${activeConversation.category} Session` : 'Ask anything about placements, DSA & interviews'}
                </span>
              </div>
            </div>

            {/* Category selector for new conversation */}
            {!activeConversation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="HR">HR & Behavioral</option>
                  <option value="Resume">Resume Review</option>
                  <option value="Coding">DSA / Coding</option>
                </select>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--error)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{error}</span>
            </div>
          )}

          {/* Messages Scrollable Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {loadingChat ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <LoadingSpinner />
              </div>
            ) : messages.length === 0 ? (
              /* Empty state: Welcome banner + 4 Starter Prompts */
              <div style={{ margin: 'auto', maxWidth: '640px', width: '100%', textAlign: 'center', padding: '1rem 0' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(163, 230, 53, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    margin: '0 auto 1.25rem'
                  }}
                >
                  <Sparkles size={32} />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                  What placement topic shall we tackle?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '2rem' }}>
                  Ask for algorithm walkthroughs, practice behavioral questions with STAR feedback,
                  or ask how to explain complex projects to interviewers.
                </p>

                {/* 4 Starter Prompt Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                    textAlign: 'left'
                  }}
                >
                  {STARTER_PROMPTS.map((starter, sIdx) => {
                    const IconComponent = starter.icon;
                    return (
                      <div
                        key={sIdx}
                        onClick={() => handleSendMessage(starter.prompt)}
                        style={{
                          padding: '1.1rem',
                          borderRadius: '14px',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                backgroundColor: `${starter.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: starter.color
                              }}
                            >
                              <IconComponent size={16} />
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: starter.color }}>
                              {starter.category}
                            </span>
                          </div>
                          <ArrowRight size={14} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {starter.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {starter.prompt.substring(0, 75)}...
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Message Thread */
              messages.map((msg, mIdx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={mIdx}
                    style={{
                      display: 'flex',
                      gap: '0.85rem',
                      alignItems: 'flex-start',
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: isUser ? '80%' : '88%'
                    }}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(163, 230, 53, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent)',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        <Bot size={18} />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      style={{
                        padding: isUser ? '0.85rem 1.15rem' : '1.15rem 1.35rem',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isUser ? 'rgba(163, 230, 53, 0.12)' : 'var(--bg-primary)',
                        border: isUser ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}
                    >
                      {isUser ? (
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.95rem' }}>
                          {msg.content}
                        </div>
                      ) : (
                        <MessageRenderer content={msg.content} />
                      )}

                      {/* Timestamp */}
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.4rem',
                          textAlign: isUser ? 'right' : 'left'
                        }}
                      >
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--accent)',
                          color: '#111111',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Thinking / Typing Pulse indicator */}
            {sending && (
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', alignSelf: 'flex-start' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(163, 230, 53, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    flexShrink: 0
                  }}
                >
                  <Bot size={18} />
                </div>
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.88rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulse 1.4s infinite' }} />
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulse 1.4s infinite 0.2s' }} />
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulse 1.4s infinite 0.4s' }} />
                  </div>
                  <span>Gemma 3 is formulating your placement advice...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Message Input Box */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '0.6rem 0.85rem',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask CareerPilot AI (e.g. 'Explain quicksort', 'STAR answer for leadership', 'Code merge intervals')..."
                rows={1}
                disabled={sending}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  resize: 'none',
                  lineHeight: 1.5,
                  maxHeight: '120px',
                  fontFamily: 'inherit'
                }}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={sending || !inputMessage.trim()}
                className="btn btn-primary"
                style={{
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  opacity: sending || !inputMessage.trim() ? 0.5 : 1,
                  cursor: sending || !inputMessage.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                <Send size={15} /> Send
              </button>
            </div>

            {/* Quick Hint */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                padding: '0 0.25rem'
              }}
            >
              <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
              <span>Local Ollama • 100% Private & Free</span>
            </div>
          </div>

        </main>
      </div>

    </div>
  );
};

export default AIChat;
