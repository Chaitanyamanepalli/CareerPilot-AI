// ====================================================
// AIFloatingChat Component — CareerPilot AI
//
// Floating Placement AI Chatbot widget at the bottom-right of the application.
// Features:
// - Sleek "Ask AI" floating pill trigger with pulse animation
// - Floating popup chat window with backdrop blur and dark/light mode support
// - Real-time conversational AI powered by local Ollama (gemma3:4b)
// - Starter prompt pills for DSA, HR mock, Resume bullets, and System Design
// - Syntax highlighted code blocks with 1-click Copy button
// - Full-page expansion trigger to /ai-chat
// ====================================================

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  Send,
  X,
  Maximize2,
  Plus,
  Bot,
  User,
  Copy,
  Check,
  Code2,
  Briefcase,
  FileText,
  Layers,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

const FLOATING_STARTERS = [
  {
    icon: Code2,
    label: 'Two Sum in Python',
    prompt: 'Explain the optimal Hash Map solution for Two Sum in Python with time & space complexity.'
  },
  {
    icon: Briefcase,
    label: 'Mock HR STAR question',
    prompt: 'Ask me a challenging behavioral interview question and evaluate my response using the STAR method.'
  },
  {
    icon: FileText,
    label: 'Resume bullet optimizer',
    prompt: 'How can I rewrite: "Built a MERN stack web app" into an impactful, metric-driven resume bullet?'
  },
  {
    icon: Layers,
    label: 'System Design basics',
    prompt: 'Explain the core components of a scalable URL shortener like bit.ly (hashing, DB, caching).'
  }
];

// Inline formatting helper
const renderInline = (text) => {
  if (!text) return '';
  const segments = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return segments.map((seg, idx) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return (
        <strong key={idx} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {seg.substring(2, seg.length - 2)}
        </strong>
      );
    }
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code
          key={idx}
          style={{
            padding: '0.1rem 0.35rem',
            borderRadius: '4px',
            backgroundColor: 'rgba(163, 230, 53, 0.12)',
            color: 'var(--accent-hover)',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '0.85em'
          }}
        >
          {seg.substring(1, seg.length - 1)}
        </code>
      );
    }
    return seg;
  });
};

// Compact Message Renderer with Code Copying
const CompactMessageRenderer = ({ content }) => {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleCopy = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ lineHeight: 1.5, fontSize: '0.88rem' }}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const lang = part.substring(3, firstLineEnd).trim() || 'code';
          const code = part.substring(firstLineEnd + 1, part.length - 3).replace(/\r\n/g, '\n');

          return (
            <div
              key={index}
              style={{
                margin: '0.6rem 0',
                borderRadius: '8px',
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
                overflow: 'hidden',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '0.82rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.3rem 0.6rem',
                  backgroundColor: '#161b22',
                  borderBottom: '1px solid #30363d',
                  color: '#8b949e',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                <span>{lang}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(code, index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedIdx === index ? 'var(--accent)' : '#8b949e',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.35rem'
                  }}
                >
                  {copiedIdx === index ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedIdx === index ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre
                style={{
                  padding: '0.75rem',
                  margin: 0,
                  overflowX: 'auto',
                  color: '#e6edf3',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.45
                }}
              >
                {code}
              </pre>
            </div>
          );
        }

        const lines = part.split('\n');
        return (
          <div key={index}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} style={{ height: '0.35rem' }} />;
              if (trimmed.startsWith('### ')) {
                return (
                  <h5 key={lIdx} style={{ margin: '0.5rem 0 0.2rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {trimmed.substring(4)}
                  </h5>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h4 key={lIdx} style={{ margin: '0.6rem 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {trimmed.substring(3)}
                  </h4>
                );
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} style={{ display: 'flex', gap: '0.4rem', margin: '0.2rem 0', paddingLeft: '0.35rem' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 800 }}>•</span>
                    <span>{renderInline(trimmed.substring(2))}</span>
                  </div>
                );
              }
              return (
                <p key={lIdx} style={{ margin: '0.25rem 0' }}>
                  {renderInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const AIFloatingChat = ({ user, onPageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sending, isOpen]);

  // Focus input on window open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      // Auto-load most recent active conversation if available
      if (user && user.role === 'candidate' && !activeConversation && messages.length === 0) {
        loadLatestConversation();
      }
    }
  }, [isOpen, user]);

  const loadLatestConversation = async () => {
    try {
      const res = await api.getAIChatConversations();
      if (res.success && res.data && res.data.length > 0) {
        const latestId = res.data[0]._id;
        const convRes = await api.getAIChatConversation(latestId);
        if (convRes.success && convRes.data) {
          setActiveConversation(convRes.data);
          setMessages(convRes.data.messages || []);
        }
      }
    } catch (err) {
      console.warn('Could not auto-load recent chat:', err.message);
    }
  };

  const handleNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setInputMessage('');
    setError('');
    inputRef.current?.focus();
  };

  const handleSendMessage = async (customText = null) => {
    const text = (customText || inputMessage).trim();
    if (!text || sending) return;

    if (!user || user.role !== 'candidate') {
      setError('Please sign in as a candidate to chat with Gemma 3.');
      return;
    }

    setError('');
    setInputMessage('');

    // If starting a brand new conversation
    if (!activeConversation) {
      try {
        setSending(true);
        const optimisticUserMsg = {
          role: 'user',
          content: text,
          timestamp: new Date().toISOString()
        };
        setMessages([optimisticUserMsg]);

        const res = await api.startAIChatConversation({
          category: 'General',
          initialMessage: text
        });

        if (res.success && res.data) {
          setActiveConversation(res.data);
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error('Floating chat error:', err.message);
        setError('Failed to reach local Gemma 3 model. Ensure Ollama is running.');
      } finally {
        setSending(false);
      }
      return;
    }

    // Existing session
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
      }
    } catch (err) {
      console.error('Floating chat message error:', err.message);
      setError('Error receiving response from Ollama.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <style>{`
        .ai-floating-trigger {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9990;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.7rem 1.25rem;
          background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
          color: #ffffff;
          border: 1px solid var(--accent);
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), 0 0 16px rgba(163, 230, 53, 0.25);
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ai-floating-trigger:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.5), 0 0 24px rgba(163, 230, 53, 0.4);
          border-color: #bef264;
        }
        .ai-status-dot-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          animation: aiPulse 2s infinite ease-in-out;
        }
        @keyframes aiPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .ai-floating-window {
          position: fixed;
          bottom: 84px;
          right: 24px;
          width: 400px;
          max-width: calc(100vw - 32px);
          height: 580px;
          max-height: calc(100vh - 110px);
          z-index: 9995;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: aiSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes aiSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ai-chat-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(180deg, rgba(163, 230, 53, 0.05) 0%, transparent 100%);
        }
        .ai-msg-bubble-user {
          align-self: flex-end;
          background-color: var(--accent);
          color: #111111;
          font-weight: 500;
          padding: 0.75rem 1rem;
          border-radius: 16px 16px 2px 16px;
          max-width: 85%;
          font-size: 0.88rem;
          word-break: break-word;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .ai-msg-bubble-bot {
          align-self: flex-start;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          padding: 0.85rem 1rem;
          border-radius: 16px 16px 16px 2px;
          max-width: 90%;
          border: 1px solid var(--border-color);
          word-break: break-word;
        }
        .ai-chip-btn {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.45rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.78rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.2s ease;
          text-align: left;
        }
        .ai-chip-btn:hover {
          border-color: var(--accent);
          color: var(--accent-hover);
          transform: translateY(-1px);
        }
        .ai-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent);
          animation: aiDot 1.4s infinite ease-in-out;
        }
        .ai-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .ai-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes aiDot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Floating Trigger Button (Bottom-Right) */}
      <button
        type="button"
        className="ai-floating-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle CareerPilot AI Chat"
        title="CareerPilot AI Placement Advisor"
      >
        <Sparkles size={18} style={{ color: 'var(--accent)' }} />
        <span>Ask AI</span>
        <span className="ai-status-dot-pulse"></span>
      </button>

      {/* Floating Window Popup */}
      {isOpen && (
        <div className="ai-floating-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(163, 230, 53, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                    CareerPilot AI
                  </h3>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(163, 230, 53, 0.15)',
                      color: 'var(--accent-hover)',
                      fontWeight: 700
                    }}
                  >
                    Gemma 3
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Local Placement Mentor
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={handleNewChat}
                title="New Chat"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px'
                }}
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onPageChange('/ai-chat');
                }}
                title="Open Fullscreen Page"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px'
                }}
              >
                <Maximize2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            {/* If user is not logged in as candidate */}
            {(!user || user.role !== 'candidate') && (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}
              >
                <Bot size={32} style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Candidate Sign-In Required
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  Log in to your candidate account to ask placement questions and preserve your AI conversation history.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsOpen(false);
                    onPageChange('/login');
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                >
                  Log In
                </button>
              </div>
            )}

            {/* Empty state with prompt chips */}
            {user && user.role === 'candidate' && messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: 'auto 0' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                  <Sparkles size={28} style={{ color: 'var(--accent)', marginBottom: '0.35rem' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>How can I help you prepare?</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Ask about coding solutions, mock questions, or resume optimization.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {FLOATING_STARTERS.map((s, idx) => {
                    const IconComp = s.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="ai-chip-btn"
                        onClick={() => handleSendMessage(s.prompt)}
                      >
                        <IconComp size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message Thread */}
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={isUser ? 'ai-msg-bubble-user' : 'ai-msg-bubble-bot'}
                >
                  {isUser ? (
                    <div>{msg.content}</div>
                  ) : (
                    <CompactMessageRenderer content={msg.content} />
                  )}
                </div>
              );
            })}

            {/* Loading / Typing indicator */}
            {sending && (
              <div
                className="ai-msg-bubble-bot"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem' }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div className="ai-typing-dot"></div>
                  <div className="ai-typing-dot"></div>
                  <div className="ai-typing-dot"></div>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Gemma 3 is formulating an answer...
                </span>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--error)',
                  fontSize: '0.8rem',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about placement, DSA, or interview..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent)',
                  color: '#111111',
                  border: 'none',
                  cursor: !inputMessage.trim() || sending ? 'not-allowed' : 'pointer',
                  opacity: !inputMessage.trim() || sending ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'opacity 0.2s ease'
                }}
                title="Send Message"
              >
                <Send size={16} />
              </button>
            </form>
            <div
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginTop: '0.35rem'
              }}
            >
              Powered by local Gemma 3 • 100% Free & Private
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIFloatingChat;
