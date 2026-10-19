// ====================================================
// Notification Service — CareerPilot AI (Phase 3 & 4)
//
// Centralized notification & alert manager:
// 1. Resume ATS Analysis Evaluation
// 2. Career Roadmap Preparation Plans
// 3. Mock Interview Performance Reports
// 4. Admin Account Actions (Suspend / Reactivate)
// 5. Scheduled Recruiter Interviews
// 6. Security Alerts (Password Changes)
//
// Key Features:
// - Persisted In-App Notifications (Notification model)
// - Real-Time Socket.IO broadcast via sendEventToUser
// - Responsive, branded CareerPilot AI HTML emails via sendEmail
// - Deduplication Engine: Prevents duplicate dispatches within 5 minutes
// - Resilient Error Handling: Safe execution without breaking primary API calls
// ====================================================

const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const { sendEventToUser } = require('../config/socket');

// In-memory deduplication cache: key -> timestamp
const deduplicationCache = new Map();

/**
 * Check and record deduplication key
 * @param {string} key 
 * @param {number} cooldownMs Default: 5 minutes (300,000 ms)
 * @returns {boolean} True if duplicate (should be skipped), false if fresh
 */
const isDuplicate = (key, cooldownMs = 300000) => {
  const now = Date.now();
  const lastTime = deduplicationCache.get(key);
  if (lastTime && now - lastTime < cooldownMs) {
    return true;
  }
  deduplicationCache.set(key, now);

  // Maintenance: cleanup old keys if map exceeds 1500 items
  if (deduplicationCache.size > 1500) {
    for (const [k, time] of deduplicationCache.entries()) {
      if (now - time > 3600000) deduplicationCache.delete(k);
    }
  }
  return false;
};

/**
 * Common HTML email shell wrapper with CareerPilot AI styling
 */
const renderEmailShell = ({ title, bodyHtml, ctaText, ctaUrl }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resolvedCtaUrl = ctaUrl ? (ctaUrl.startsWith('http') ? ctaUrl : `${clientUrl}${ctaUrl}`) : clientUrl;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
          CAREERPILOT <span style="color: #10b981;">AI</span>
        </h1>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Student Placement & Career Preparation Platform</p>
      </div>

      <!-- Title -->
      <h2 style="color: #0f172a; font-size: 19px; margin: 0 0 16px; font-weight: 700;">${title}</h2>

      <!-- Content -->
      <div style="font-size: 14px; color: #334155;">
        ${bodyHtml}
      </div>

      <!-- CTA Button -->
      ${ctaText && resolvedCtaUrl ? `
        <div style="text-align: center; margin: 30px 0 20px;">
          <a href="${resolvedCtaUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
            ${ctaText} →
          </a>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; margin-top: 28px; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0;">This automated alert was dispatched by the CareerPilot AI Platform.</p>
        <p style="margin: 4px 0 0;">© 2026 CareerPilot AI. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * 1. Dispatch Resume Analysis Notification
 */
const notifyResumeAnalysis = async (user, analysisResult, targetRole = 'Target Role') => {
  if (!user || !user._id || !user.email) return { skipped: true, reason: 'No user provided' };

  const dedupeKey = `resume:${user._id}:${targetRole}:${analysisResult.resumeScore}`;
  if (isDuplicate(dedupeKey, 300000)) {
    console.log(`[NOTIF] Skipped duplicate resume analysis notification for ${user.email}`);
    return { skipped: true, reason: 'Duplicate event' };
  }

  const score = analysisResult.resumeScore || 70;
  const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  // 1. In-App Notification
  try {
    const notif = await Notification.create({
      recipient: user._id,
      type: 'resume_feedback',
      title: 'Resume ATS Analysis Complete',
      message: `Your resume scored ${score}/100 for "${targetRole}". Review recommendations to boost your match rate.`,
      link: '/ai-preparation',
    });

    sendEventToUser(user._id, 'notification', {
      _id: notif._id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      isRead: false,
      createdAt: notif.createdAt,
    });
  } catch (err) {
    console.error('[NOTIF] Failed to save in-app resume notification:', err.message);
  }

  // 2. Email Dispatch
  const strengthsList = (analysisResult.strengths || []).slice(0, 3).map(s => `<li>${s}</li>`).join('');
  const missingSkillsList = (analysisResult.missingSkills || []).slice(0, 4).map(s => `<span style="background-color: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-right: 6px; display: inline-block; margin-bottom: 4px;">${s}</span>`).join(' ');

  const bodyHtml = `
    <p>Hello <strong>${user.fullName || 'Candidate'}</strong>,</p>
    <p>Your resume has been benchmarked by our AI against industry standards for <strong>${targetRole}</strong>.</p>
    
    <div style="text-align: center; margin: 24px 0;">
      <div style="display: inline-block; border: 2px solid ${scoreColor}; border-radius: 12px; padding: 14px 28px; background-color: #f8fafc;">
        <span style="font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">ATS Match Score</span><br />
        <span style="font-size: 32px; font-weight: 800; color: ${scoreColor};">${score}</span><span style="font-size: 18px; color: #94a3b8;">/100</span>
      </div>
    </div>

    ${strengthsList ? `
      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
        <strong style="color: #166534; font-size: 13px; text-transform: uppercase;">Key Strengths</strong>
        <ul style="margin: 6px 0 0; padding-left: 20px; color: #166534; font-size: 13px;">${strengthsList}</ul>
      </div>
    ` : ''}

    ${missingSkillsList ? `
      <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
        <strong style="color: #9a3412; font-size: 13px; text-transform: uppercase;">Recommended Skills to Add</strong>
        <div style="margin-top: 8px;">${missingSkillsList}</div>
      </div>
    ` : ''}
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: `📄 Resume ATS Score: ${score}/100 for ${targetRole}`,
      text: `Hello ${user.fullName},\n\nYour resume scored ${score}/100 for "${targetRole}". Review your strengths and missing skills in CareerPilot AI.`,
      html: renderEmailShell({
        title: `Resume ATS Analysis: ${targetRole}`,
        bodyHtml,
        ctaText: 'View Full Analysis & Optimization Tips',
        ctaUrl: '/ai-preparation',
      }),
    });
    return { success: true, emailSent: true };
  } catch (emailErr) {
    console.error('[NOTIF] Resume email dispatch error:', emailErr.message);
    return { success: true, emailSent: false, error: emailErr.message };
  }
};

/**
 * 2. Dispatch Career Roadmap Saved Notification
 */
const notifyRoadmapSaved = async (user, roadmap) => {
  if (!user || !user._id || !user.email) return { skipped: true, reason: 'No user provided' };

  const dedupeKey = `roadmap:${user._id}:${roadmap.targetRole}`;
  if (isDuplicate(dedupeKey, 300000)) {
    console.log(`[NOTIF] Skipped duplicate roadmap notification for ${user.email}`);
    return { skipped: true, reason: 'Duplicate event' };
  }

  // 1. In-App Notification
  try {
    const notif = await Notification.create({
      recipient: user._id,
      type: 'roadmap_ready',
      title: 'Career Roadmap Saved',
      message: `Your learning roadmap for "${roadmap.targetRole}" has been saved. Ready to begin your prep!`,
      link: '/ai-preparation',
    });

    sendEventToUser(user._id, 'notification', {
      _id: notif._id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      isRead: false,
      createdAt: notif.createdAt,
    });
  } catch (err) {
    console.error('[NOTIF] Failed to save in-app roadmap notification:', err.message);
  }

  // 2. Email Dispatch
  const milestoneCount = (roadmap.milestones || roadmap.learningOrder || []).length;
  const bodyHtml = `
    <p>Hello <strong>${user.fullName || 'Candidate'}</strong>,</p>
    <p>Your personalized placement preparation roadmap for <strong>${roadmap.targetRole}</strong> is now saved to your CareerPilot AI profile.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 18px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="color: #64748b; padding: 4px 0; width: 35%;">Target Role:</td>
          <td style="color: #0f172a; font-weight: 600; padding: 4px 0;">${roadmap.targetRole}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Placement Track:</td>
          <td style="color: #0f172a; font-weight: 600; padding: 4px 0;">${roadmap.placementTrack || 'Product-Based Track'}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Estimated Duration:</td>
          <td style="color: #0f172a; font-weight: 600; padding: 4px 0;">${roadmap.estimatedDuration || '3 Months'}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Milestones Planned:</td>
          <td style="color: #10b981; font-weight: 700; padding: 4px 0;">${milestoneCount} Structured Milestones</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #475569;">
      Track each milestone, complete practice problems in the Sandbox, and unlock tailored mock interview questions as you progress.
    </p>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: `🗺️ Preparation Roadmap Active: ${roadmap.targetRole}`,
      text: `Hello ${user.fullName},\n\nYour preparation roadmap for "${roadmap.targetRole}" (${milestoneCount} milestones) is active in CareerPilot AI.`,
      html: renderEmailShell({
        title: `Your ${roadmap.targetRole} Roadmap Is Ready`,
        bodyHtml,
        ctaText: 'Open Preparation Roadmap',
        ctaUrl: '/ai-preparation',
      }),
    });
    return { success: true, emailSent: true };
  } catch (emailErr) {
    console.error('[NOTIF] Roadmap email dispatch error:', emailErr.message);
    return { success: true, emailSent: false, error: emailErr.message };
  }
};

/**
 * 3. Dispatch Mock Interview Performance Notification
 */
const notifyMockInterviewCompleted = async (user, session) => {
  if (!user || !user._id || !user.email) return { skipped: true, reason: 'No user provided' };

  const dedupeKey = `interview:${user._id}:${session._id}`;
  if (isDuplicate(dedupeKey, 300000)) {
    console.log(`[NOTIF] Skipped duplicate interview notification for ${user.email}`);
    return { skipped: true, reason: 'Duplicate event' };
  }

  const report = session.overallReport || {};
  const score = report.score || 0;
  const rating = report.rating || 'Good Effort';
  const role = session.targetRole || 'Software Engineer';
  const roundType = (session.interviewType || 'technical').toUpperCase();

  // 1. In-App Notification
  try {
    const notif = await Notification.create({
      recipient: user._id,
      type: 'interview_completed',
      title: 'Mock Interview Evaluated',
      message: `You completed your ${roundType} mock interview for "${role}" with a score of ${score}/10 (${rating}).`,
      link: '/ai-preparation',
    });

    sendEventToUser(user._id, 'notification', {
      _id: notif._id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      isRead: false,
      createdAt: notif.createdAt,
    });
  } catch (err) {
    console.error('[NOTIF] Failed to save in-app interview notification:', err.message);
  }

  // 2. Email Dispatch
  const strengths = (report.keyStrengths || []).slice(0, 3).map(s => `<li>${s}</li>`).join('');
  const improvements = (report.areasToImprove || []).slice(0, 3).map(s => `<li>${s}</li>`).join('');

  const bodyHtml = `
    <p>Hello <strong>${user.fullName || 'Candidate'}</strong>,</p>
    <p>Congratulations on completing your <strong>${roundType} Mock Interview</strong> for <strong>${role}</strong>!</p>

    <div style="text-align: center; margin: 24px 0;">
      <div style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);">
        <span style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Performance Score</span><br />
        <span style="font-size: 32px; font-weight: 800; color: #10b981;">${score}</span><span style="font-size: 16px; color: #94a3b8;">/10</span>
        <div style="margin-top: 4px; font-size: 13px; font-weight: 600; color: #38bdf8;">${rating}</div>
      </div>
    </div>

    ${strengths ? `
      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
        <strong style="color: #166534; font-size: 13px; text-transform: uppercase;">Observed Strengths</strong>
        <ul style="margin: 6px 0 0; padding-left: 20px; color: #166534; font-size: 13px;">${strengths}</ul>
      </div>
    ` : ''}

    ${improvements ? `
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
        <strong style="color: #1e40af; font-size: 13px; text-transform: uppercase;">Areas for Improvement</strong>
        <ul style="margin: 6px 0 0; padding-left: 20px; color: #1e40af; font-size: 13px;">${improvements}</ul>
      </div>
    ` : ''}
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: `🎯 Mock Interview Results: ${score}/10 (${rating}) - ${role}`,
      text: `Hello ${user.fullName},\n\nYou scored ${score}/10 (${rating}) in your ${roundType} Mock Interview for "${role}". Check your full feedback in CareerPilot AI.`,
      html: renderEmailShell({
        title: `Mock Interview Evaluation Report`,
        bodyHtml,
        ctaText: 'Review Full Answers & AI Critique',
        ctaUrl: '/ai-preparation',
      }),
    });
    return { success: true, emailSent: true };
  } catch (emailErr) {
    console.error('[NOTIF] Interview email dispatch error:', emailErr.message);
    return { success: true, emailSent: false, error: emailErr.message };
  }
};

/**
 * 4. Dispatch Admin Account Status Change Notification (Suspend / Reactivate)
 */
const notifyAccountStatusChange = async (user, newStatus, adminName = 'Administrator') => {
  if (!user || !user._id || !user.email) return { skipped: true, reason: 'No user provided' };

  const dedupeKey = `account_status:${user._id}:${newStatus}`;
  if (isDuplicate(dedupeKey, 60000)) {
    console.log(`[NOTIF] Skipped duplicate account status notification for ${user.email}`);
    return { skipped: true, reason: 'Duplicate event' };
  }

  const isSuspended = newStatus === 'suspended';
  const badgeColor = isSuspended ? '#ef4444' : '#10b981';
  const title = isSuspended ? 'Account Notice: Account Suspended' : 'Account Notice: Account Reactivated';

  // 1. In-App Notification
  try {
    const notif = await Notification.create({
      recipient: user._id,
      type: 'account_status',
      title: isSuspended ? 'Account Suspended' : 'Account Reactivated',
      message: isSuspended
        ? 'Your account has been temporarily suspended by system administrators. Please contact support if you believe this is in error.'
        : 'Your account access has been restored by administrators. Welcome back!',
      link: isSuspended ? '' : '/jobs',
    });

    sendEventToUser(user._id, 'notification', {
      _id: notif._id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      isRead: false,
      createdAt: notif.createdAt,
    });
  } catch (err) {
    console.error('[NOTIF] Failed to save account status notification:', err.message);
  }

  // 2. Email Dispatch
  const bodyHtml = `
    <p>Hello <strong>${user.fullName || 'User'}</strong>,</p>
    <p>This is an official administrative notice regarding your CareerPilot AI account status.</p>

    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; padding: 10px 24px; border-radius: 9999px; font-weight: 700; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
        Account ${newStatus}
      </span>
    </div>

    <div style="background-color: #f8fafc; border-left: 4px solid ${badgeColor}; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 13px;">
      ${isSuspended ? `
        <p style="margin: 0; color: #334155;">
          Your account has been temporarily suspended by an administrator (<strong>${adminName}</strong>).
          While suspended, job applications, interactive AI preparation tools, and profile updates are restricted.
        </p>
        <p style="margin: 10px 0 0; color: #64748b;">
          If you believe this was done in error or would like to submit an inquiry, please contact our support team at <a href="mailto:support@careerpilot.ai" style="color: #0284c7;">support@careerpilot.ai</a>.
        </p>
      ` : `
        <p style="margin: 0; color: #334155;">
          Your account privileges have been fully restored by an administrator (<strong>${adminName}</strong>).
          You may now log in to continue your placement preparation and apply for active opportunities.
        </p>
      `}
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: `⚠️ CareerPilot AI: Your Account Has Been ${isSuspended ? 'Suspended' : 'Reactivated'}`,
      text: `Hello ${user.fullName},\n\nYour CareerPilot AI account status has been changed to: ${newStatus}.\n\nPlease contact support@careerpilot.ai for any questions.`,
      html: renderEmailShell({
        title,
        bodyHtml,
        ctaText: isSuspended ? '' : 'Log In to CareerPilot AI',
        ctaUrl: isSuspended ? '' : '/login',
      }),
    });
    return { success: true, emailSent: true };
  } catch (emailErr) {
    console.error('[NOTIF] Account status email error:', emailErr.message);
    return { success: true, emailSent: false, error: emailErr.message };
  }
};

/**
 * 5. Dispatch Interview Scheduled Notification
 */
const notifyInterviewScheduled = async (application, interview, job) => {
  if (!application || !application.email) return { skipped: true, reason: 'No applicant email' };

  const dedupeKey = `interview_scheduled:${application._id}:${interview._id}`;
  if (isDuplicate(dedupeKey, 300000)) {
    console.log(`[NOTIF] Skipped duplicate interview scheduled notification for ${application.email}`);
    return { skipped: true, reason: 'Duplicate event' };
  }

  const jobTitle = job?.title || 'Open Position';
  const company = job?.company || 'Hiring Company';
  const dateFormatted = new Date(interview.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // 1. In-App Notification (already recorded in interviewController, but ensures link is set)
  try {
    sendEventToUser(application.candidateId, 'notification', {
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `An interview for "${jobTitle}" at ${company} is confirmed for ${dateFormatted} at ${interview.time} (${interview.mode}).`,
      link: '/my-applications',
      isRead: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[NOTIF] In-app interview scheduled error:', err.message);
  }

  // 2. Email Dispatch
  const bodyHtml = `
    <p>Hello <strong>${application.name || 'Candidate'}</strong>,</p>
    <p>Great news! The recruitment team at <strong>${company}</strong> has scheduled your interview for the position of <strong>${jobTitle}</strong>.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="color: #64748b; padding: 6px 0; width: 35%;">Company:</td>
          <td style="color: #0f172a; font-weight: 700; padding: 6px 0;">${company}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Role:</td>
          <td style="color: #0f172a; font-weight: 700; padding: 6px 0;">${jobTitle}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Date:</td>
          <td style="color: #0f172a; font-weight: 700; padding: 6px 0;">${dateFormatted}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Time:</td>
          <td style="color: #0f172a; font-weight: 700; padding: 6px 0;">${interview.time}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Mode:</td>
          <td style="color: #10b981; font-weight: 700; padding: 6px 0;">${interview.mode}</td>
        </tr>
        ${interview.meetingLink ? `
          <tr>
            <td style="color: #64748b; padding: 6px 0;">Meeting Link:</td>
            <td style="padding: 6px 0;"><a href="${interview.meetingLink}" style="color: #2563eb; font-weight: 600;">Join Meeting</a></td>
          </tr>
        ` : ''}
        ${interview.remarks ? `
          <tr>
            <td style="color: #64748b; padding: 6px 0;">Notes / Remarks:</td>
            <td style="color: #334155; padding: 6px 0;">${interview.remarks}</td>
          </tr>
        ` : ''}
      </table>
    </div>

    <p style="font-size: 13px; color: #475569;">
      Tip: Rehearse common questions and review company details in your CareerPilot AI Prep Hub before the interview.
    </p>
  `;

  try {
    await sendEmail({
      to: application.email,
      subject: `📅 Interview Scheduled: ${jobTitle} at ${company} (${dateFormatted})`,
      text: `Hello ${application.name},\n\nYour interview for "${jobTitle}" at ${company} has been scheduled for ${dateFormatted} at ${interview.time} (${interview.mode}).\n\nTrack your application at ${process.env.CLIENT_URL || 'http://localhost:5173'}/my-applications`,
      html: renderEmailShell({
        title: `Interview Confirmed: ${jobTitle}`,
        bodyHtml,
        ctaText: 'View Application Details & Prep',
        ctaUrl: '/my-applications',
      }),
    });
    return { success: true, emailSent: true };
  } catch (emailErr) {
    console.error('[NOTIF] Interview scheduled email error:', emailErr.message);
    return { success: true, emailSent: false, error: emailErr.message };
  }
};

/**
 * 6. Dispatch Security Alert: Password Reset Confirmation
 */
const notifyPasswordChanged = async (user) => {
  if (!user || !user._id || !user.email) return { skipped: true, reason: 'No user provided' };

  // 1. In-App Notification
  try {
    const notif = await Notification.create({
      recipient: user._id,
      type: 'system_alert',
      title: 'Password Updated',
      message: 'Your CareerPilot AI password was successfully updated.',
      link: '',
    });

    sendEventToUser(user._id, 'notification', {
      _id: notif._id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      isRead: false,
      createdAt: notif.createdAt,
    });
  } catch (err) {
    console.error('[NOTIF] Failed to save password changed notification:', err.message);
  }

  // 2. Email Dispatch
  const dateFormatted = new Date().toLocaleString();
  const bodyHtml = `
    <p>Hello <strong>${user.fullName || 'User'}</strong>,</p>
    <p>The password for your CareerPilot AI account (<strong>${user.email}</strong>) was recently changed on <strong>${dateFormatted}</strong>.</p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 14px; border-radius: 6px; margin: 18px 0; font-size: 13px;">
      <p style="margin: 0; color: #334155;">
        If you initiated this change, no further action is necessary.
      </p>
      <p style="margin: 8px 0 0; color: #dc2626; font-weight: 600;">
        If you did not make this change, please immediately reset your password and contact support@careerpilot.ai to secure your account.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: '🔒 Security Alert: Your CareerPilot AI Password Was Changed',
      text: `Hello ${user.fullName},\n\nYour password for CareerPilot AI was successfully changed on ${dateFormatted}.\n\nIf you did not perform this change, contact support@careerpilot.ai immediately.`,
      html: renderEmailShell({
        title: 'Security Alert: Password Updated',
        bodyHtml,
        ctaText: 'Log In to Verify Account',
        ctaUrl: '/login',
      }),
    });
    return { success: true, emailSent: true };
  } catch (emailErr) {
    console.error('[NOTIF] Password change alert error:', emailErr.message);
    return { success: true, emailSent: false, error: emailErr.message };
  }
};

module.exports = {
  isDuplicate,
  renderEmailShell,
  notifyResumeAnalysis,
  notifyRoadmapSaved,
  notifyMockInterviewCompleted,
  notifyAccountStatusChange,
  notifyInterviewScheduled,
  notifyPasswordChanged,
};
