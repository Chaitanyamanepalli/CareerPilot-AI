// ====================================================
// Navbar (Header Navigation Component)
//
// This component renders the main header navigation menu.
// It detects the logged-in user role and displays appropriate action options.
//
// Features:
// - Role-based layout structure (different links for guest, candidate, and recruiter roles).
// - Theme switch toggling integration (communicates with ThemeContext).
// - Responsive layout toggles (collapses into hamburger menu on mobile sizes).
//
// Used by:
// - App.jsx (fixed layout placement at the top of the viewport)
// ====================================================

import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X, User, LogOut, Shield, Code2 } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import careerpilotLogo from '../assets/careerpilot-logo.png';

// Purpose:
// Renders the main application header and navigation paths triggers.
//
// Input:
// currentPage (string) - Active page path string.
// onPageChange (function) - Handles page redirection.
// user (Object) - Logged in user details.
// onLogout (function) - Log out trigger callback.
//
// Output:
// Returns the header Navbar JSX structure.
const Navbar = ({ currentPage, onPageChange, user, onLogout, socket }) => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Close the mobile slide menu and trigger redirection action
  const handleLinkClick = (page) => {
    onPageChange(page);
    setIsMenuOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-content">
        
        {/* 1. LEFT: Brand & Logo */}
        <div className="navbar-left">
          <a 
            href="/" 
            className="brand-logo" 
            onClick={(e) => { e.preventDefault(); handleLinkClick('home'); }}
            title="CareerPilot AI"
          >
            <img
              src={careerpilotLogo}
              alt="CareerPilot AI Logo"
              className="navbar-brand-img"
            />
            <span className="brand-name">
              CAREER<span className="brand-accent-text">PILOT AI</span>
            </span>
          </a>
        </div>

        {/* 2. CENTER: Main Navigation Links */}
        <nav className="navbar-center" aria-label="Main Navigation">
          {/* Guest Links */}
          {!user && (
            <>
              <a href="/" className={`nav-link-item ${currentPage === 'home' || currentPage === '/' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/'); }}>
                Home
              </a>
              <a href="/jobs" className={`nav-link-item ${currentPage === 'jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/jobs'); }}>
                Jobs
              </a>
              <a href="/about" className={`nav-link-item ${currentPage === 'about' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/about'); }}>
                About
              </a>
            </>
          )}

          {/* Candidate Links */}
          {user && user.role === 'candidate' && (
            <>
              <a href="/candidate/dashboard" className={`nav-link-item ${currentPage === 'candidate-dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/candidate/dashboard'); }}>
                Dashboard
              </a>
              <a href="/ai-preparation" className={`nav-link-item ${currentPage === 'ai-preparation' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/ai-preparation'); }}>
                AI Prep Hub
              </a>
              <a href="/coding" className={`nav-link-item ${currentPage === 'coding-practice' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/coding'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Code2 size={14} /> Code
              </a>
              <a href="/jobs" className={`nav-link-item ${currentPage === 'jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/jobs'); }}>
                Jobs
              </a>
              <a href="/saved-jobs" className={`nav-link-item ${currentPage === 'saved-jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/saved-jobs'); }}>
                Saved
              </a>
              <a href="/my-applications" className={`nav-link-item ${currentPage === 'my-applications' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/my-applications'); }}>
                Applications
              </a>
              <a href="/chat" className={`nav-link-item ${currentPage === 'chat' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>
                Chat
              </a>
              <a href="/profile" className={`nav-link-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
                Profile
              </a>
            </>
          )}

          {/* Recruiter Links */}
          {user && user.role === 'recruiter' && (
            <>
              <a href="/recruiter/dashboard" className={`nav-link-item ${currentPage === 'recruiter-dashboard' && window.location.pathname === '/recruiter/dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/dashboard'); }}>
                Dashboard
              </a>
              <a href="/recruiter/jobs" className={`nav-link-item ${currentPage === 'recruiter-dashboard' && window.location.pathname === '/recruiter/jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/jobs'); }}>
                Manage Jobs
              </a>
              <a href="/recruiter/applications" className={`nav-link-item ${currentPage === 'recruiter-dashboard' && window.location.pathname === '/recruiter/applications' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/applications'); }}>
                Applications
              </a>
              <a href="/recruiter/analytics" className={`nav-link-item ${(currentPage === 'recruiter-analytics' || window.location.pathname === '/recruiter/analytics') ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/analytics'); }}>
                Analytics
              </a>
              <a href="/chat" className={`nav-link-item ${currentPage === 'chat' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>
                Chat
              </a>
              <a href="/profile" className={`nav-link-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
                Profile
              </a>
            </>
          )}

          {/* Admin Links */}
          {user && user.role === 'admin' && (
            <>
              <a href="/admin/dashboard" className={`nav-link-item ${currentPage === 'admin-dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/admin/dashboard'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={14} /> Admin
              </a>
              <a href="/jobs" className={`nav-link-item ${currentPage === 'jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/jobs'); }}>
                Jobs
              </a>
              <a href="/chat" className={`nav-link-item ${currentPage === 'chat' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>
                Chat
              </a>
              <a href="/profile" className={`nav-link-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
                Profile
              </a>
            </>
          )}
        </nav>

        {/* 3. RIGHT: Actions (Logout, Notifications, Theme, Profile Avatar) */}
        <div className="navbar-right">
          {!user ? (
            <>
              <button 
                onClick={toggleTheme} 
                className="theme-switch-btn-nav"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={17} fill="currentColor" /> : <Sun size={17} />}
              </button>
              <a href="/login" className={`nav-link-item ${currentPage === 'login' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/login'); }}>
                Login
              </a>
              <a href="/signup" className="btn-post-job" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); handleLinkClick('/signup'); }}>
                Sign Up
              </a>
            </>
          ) : (
            <>
              <button 
                onClick={onLogout} 
                className="nav-logout-btn"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>

              <NotificationCenter socket={socket} user={user} />

              <button 
                onClick={toggleTheme} 
                className="theme-switch-btn-nav"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={17} fill="currentColor" /> : <Sun size={17} />}
              </button>

              <button 
                className="nav-profile-btn"
                onClick={() => handleLinkClick('/profile')}
                title={`${user.fullName} Profile`}
                aria-label="View user profile"
              >
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent)', color: '#111111', fontWeight: 700, fontSize: '0.85rem' }}>
                  {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </div>
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Actions */}
        <div className="mobile-actions">
          {user && (
            <NotificationCenter socket={socket} user={user} />
          )}

          <button 
            onClick={toggleTheme} 
            className="theme-switch-btn-nav" 
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={16} fill="currentColor" /> : <Sun size={16} />}
          </button>
          
          <button className="menu-btn" onClick={toggleMenu} aria-label="Toggle Menu" style={{ color: '#ffffff' }}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Accessible on smaller screens) */}
      <nav className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
        {!user && (
          <>
            <a href="/" className={`nav-link-mobile ${currentPage === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/'); }}>Home</a>
            <a href="/jobs" className={`nav-link-mobile ${currentPage === 'jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/jobs'); }}>Jobs</a>
            <a href="/about" className={`nav-link-mobile ${currentPage === 'about' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/about'); }}>About</a>
            <a href="/login" className={`nav-link-mobile ${currentPage === 'login' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/login'); }}>Login</a>
            <a href="/signup" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/signup'); }}>Sign Up</a>
          </>
        )}

        {user && user.role === 'candidate' && (
          <>
            <a href="/candidate/dashboard" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/candidate/dashboard'); }}>Dashboard</a>
            <a href="/ai-preparation" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/ai-preparation'); }}>AI Prep Hub</a>
            <a href="/coding" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/coding'); }}><Code2 size={16} /> Coding Practice</a>
            <a href="/jobs" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/jobs'); }}>Jobs</a>
            <a href="/saved-jobs" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/saved-jobs'); }}>Saved Jobs</a>
            <a href="/my-applications" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/my-applications'); }}>Applications</a>
            <a href="/chat" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>Chat</a>
            <a href="/profile" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>Profile</a>
            <button onClick={onLogout} className="nav-link-mobile" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', color: '#ef4444' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        )}

        {user && user.role === 'recruiter' && (
          <>
            <a href="/recruiter/dashboard" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/dashboard'); }}>Dashboard</a>
            <a href="/recruiter/jobs" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/jobs'); }}>Manage Jobs</a>
            <a href="/recruiter/applications" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/applications'); }}>Applications</a>
            <a href="/recruiter/analytics" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/analytics'); }}>Analytics</a>
            <a href="/chat" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>Chat</a>
            <a href="/profile" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>Profile</a>
            <button onClick={onLogout} className="nav-link-mobile" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', color: '#ef4444' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        )}

        {user && user.role === 'admin' && (
          <>
            <a href="/admin/dashboard" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/admin/dashboard'); }}><Shield size={16} /> Admin Dashboard</a>
            <a href="/jobs" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/jobs'); }}>Jobs</a>
            <a href="/chat" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>Chat</a>
            <a href="/profile" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>Profile</a>
            <button onClick={onLogout} className="nav-link-mobile" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', color: '#ef4444' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
