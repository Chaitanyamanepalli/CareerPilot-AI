// ====================================================
// Status Update Email Templates — CareerPilot AI
//
// Corporate-grade, executive email notifications for candidate selection stages:
// - Applied
// - Under Review
// - Shortlisted
// - Interview Scheduled (includes calendar date, time, meeting link, and round notes)
// - Rejected (polite, respectful, empathetic corporate regret letter)
// - Hired (congratulatory offer announcement)
// ====================================================

/**
 * Format a Date object into human-readable corporate date string
 * e.g., "Thursday, October 22, 2026"
 */
function formatDate(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return String(dateInput);
  }
}

/**
 * Generates email subject, plain text, and responsive corporate HTML template.
 */
function generateStatusEmail({
  application,
  status,
  jobTitle = 'Position',
  company = 'Company',
  interviewDate = null,
  interviewTime = '',
  interviewMeetingLink = '',
  interviewNotes = '',
  clientUrl = process.env.CLIENT_URL || 'http://localhost:5173',
}) {
  const candidateName = application.name || 'Candidate';
  const appIdShort = application._id ? String(application._id).slice(-8).toUpperCase() : 'APP';
  const portalUrl = `${clientUrl}/my-applications`;
  const prepHubUrl = `${clientUrl}/ai-preparation`;

  // Status-specific badges and themes
  const statusThemes = {
    'Shortlisted': {
      color: '#10b981',
      bgLight: '#ecfdf5',
      badgeText: 'SHORTLISTED',
      accentColor: '#059669',
    },
    'Interview Scheduled': {
      color: '#6366f1',
      bgLight: '#eef2ff',
      badgeText: 'INTERVIEW SCHEDULED',
      accentColor: '#4f46e5',
    },
    'Under Review': {
      color: '#3b82f6',
      bgLight: '#eff6ff',
      badgeText: 'UNDER REVIEW',
      accentColor: '#2563eb',
    },
    'Hired': {
      color: '#059669',
      bgLight: '#ecfdf5',
      badgeText: 'HIRED / OFFER EXTENDED',
      accentColor: '#047857',
    },
    'Rejected': {
      color: '#64748b',
      bgLight: '#f1f5f9',
      badgeText: 'STATUS UPDATE',
      accentColor: '#475569',
    },
    'Applied': {
      color: '#0284c7',
      bgLight: '#f0f9ff',
      badgeText: 'APPLICATION RECEIVED',
      accentColor: '#0369a1',
    },
  };

  const currentTheme = statusThemes[status] || statusThemes['Under Review'];

  let subject = '';
  let headline = '';
  let leadText = '';
  let detailContentHtml = '';
  let detailContentText = '';
  let ctaText = 'View Application Status';
  let ctaLink = portalUrl;

  // Format Interview details if applicable
  const formattedDate = interviewDate ? formatDate(interviewDate) : '';
  const formattedTime = interviewTime ? interviewTime : '';
  const dateTimeDisplay = [formattedDate, formattedTime].filter(Boolean).join(' at ');

  switch (status) {
    case 'Interview Scheduled':
      subject = `Interview Invitation: ${jobTitle} at ${company} (ID: ${appIdShort})`;
      headline = 'Interview Scheduled';
      leadText = `We are pleased to inform you that your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has advanced to the interview stage. We would like to invite you for an interview with our team.`;
      
      detailContentHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 22px; margin: 22px 0;">
          <h4 style="margin: 0 0 14px 0; color: #1e293b; font-size: 15px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
            🗓️ Interview Schedule & Connection Details
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 7px 0; color: #64748b; font-weight: 600; width: 34%;">Date & Time:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${dateTimeDisplay || 'Will be coordinated directly by recruiter'}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Position:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 600;">${jobTitle}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Organization:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 600;">${company}</td>
            </tr>
            ${interviewMeetingLink ? `
            <tr>
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Meeting Platform / Link:</td>
              <td style="padding: 7px 0;">
                <a href="${interviewMeetingLink.startsWith('http') ? interviewMeetingLink : `https://${interviewMeetingLink}`}" target="_blank" style="color: #6366f1; text-decoration: underline; font-weight: 600; word-break: break-all;">
                  ${interviewMeetingLink}
                </a>
              </td>
            </tr>` : ''}
            ${interviewNotes ? `
            <tr>
              <td style="padding: 7px 0; color: #64748b; font-weight: 600; vertical-align: top;">Interview Notes:</td>
              <td style="padding: 7px 0; color: #334155; line-height: 1.5;">${interviewNotes}</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px;">
          <p style="margin: 0; color: #166534; font-size: 13.5px; line-height: 1.5;">
            <strong>💡 Preparation Recommendations:</strong><br />
            • Please connect 5 minutes prior to the scheduled start time in a quiet environment.<br />
            • Have your updated resume and questions for the interviewer handy.<br />
            • You can practice AI-driven mock interviews and role roadmaps in the <a href="${prepHubUrl}" style="color: #15803d; font-weight: 700; text-decoration: underline;">CareerPilot AI Prep Hub</a>.
          </p>
        </div>
      `;

      detailContentText = `Interview Itinerary:
- Date & Time: ${dateTimeDisplay || 'To be determined'}
- Position: ${jobTitle}
- Company: ${company}
${interviewMeetingLink ? `- Meeting Link: ${interviewMeetingLink}\n` : ''}${interviewNotes ? `- Instructions: ${interviewNotes}\n` : ''}
Preparation Tips:
- Connect 5 minutes early in a quiet environment.
- Prepare with AI Mock Interviews on CareerPilot AI: ${prepHubUrl}`;
      ctaText = 'Confirm & View Application Details';
      break;

    case 'Shortlisted':
      subject = `Application Update: Shortlisted for ${jobTitle} at ${company} (ID: ${appIdShort})`;
      headline = 'Application Shortlisted';
      leadText = `We are pleased to inform you that your application for the <strong>${jobTitle}</strong> position at <strong>${company}</strong> has been <strong>shortlisted</strong> by our recruitment team.`;

      detailContentHtml = `
        <p style="color: #334155; font-size: 14.5px; line-height: 1.6;">
          Your qualifications, technical background, and experience closely match what the hiring team is seeking for this role. We are currently coordinating candidate interview schedules and will reach out with specific interview slots shortly.
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
          <p style="margin: 0; font-size: 13.5px; color: #475569;">
            In the meantime, feel free to review your profile and prepare with custom AI technical roadmaps on CareerPilot AI.
          </p>
        </div>
      `;

      detailContentText = `Your application for ${jobTitle} at ${company} has been shortlisted. Our hiring team will contact you shortly with interview details.`;
      ctaText = 'Track Your Application';
      break;

    case 'Under Review':
      subject = `Application Update: Under Review for ${jobTitle} at ${company} (ID: ${appIdShort})`;
      headline = 'Application Under Review';
      leadText = `Thank you for your interest in <strong>${company}</strong>. We would like to let you know that your application for <strong>${jobTitle}</strong> (Application ID: <strong>#${appIdShort}</strong>) is now actively <strong>Under Review</strong>.`;

      detailContentHtml = `
        <p style="color: #334155; font-size: 14.5px; line-height: 1.6;">
          Our hiring team is currently reviewing your resume, technical skills, and project experience. As soon as the evaluation is complete, you will receive an update regarding the next steps in our hiring process.
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          You can check the real-time status of your submission at any time through your candidate dashboard.
        </p>
      `;

      detailContentText = `Your application for ${jobTitle} at ${company} (ID: #${appIdShort}) is currently under review by our hiring team. We will notify you once review is complete.`;
      ctaText = 'View Application Status';
      break;

    case 'Rejected':
      subject = `Application Update: ${jobTitle} at ${company} (ID: ${appIdShort})`;
      headline = 'Application Status Update';
      leadText = `Thank you for taking the time to apply for the position of <strong>${jobTitle}</strong> at <strong>${company}</strong> (Application ID: <strong>#${appIdShort}</strong>).`;

      detailContentHtml = `
        <p style="color: #334155; font-size: 14.5px; line-height: 1.6; margin-top: 14px;">
          After careful consideration and review of your application alongside our current hiring criteria, we have decided to progress with other candidates whose experience more closely matches the immediate requirements of this role.
        </p>
        <p style="color: #334155; font-size: 14.5px; line-height: 1.6;">
          While we are not able to provide individualized feedback due to high applicant volume, we were impressed by your background and credentials. We encourage you to keep your profile updated on CareerPilot AI, as new opportunities matching your skill set arise regularly.
        </p>
        <p style="color: #334155; font-size: 14.5px; line-height: 1.6;">
          Thanks again for your interest in working with <strong>${company}</strong>. We sincerely appreciate your time and wish you the very best in your professional career.
        </p>
      `;

      detailContentText = `Thank you for your application for the position of ${jobTitle} (ID: #${appIdShort}) at ${company}. After careful consideration and review of your application, we have decided to progress with other candidates for this role. While we are not able to provide additional feedback or information about this decision, we would like to keep in touch regarding future job opportunities. Thanks again for your interest in working at ${company}.\n\nBest regards,\n${company} Recruiting Team`;
      ctaText = 'Explore More Opportunities';
      ctaLink = `${clientUrl}/`;
      break;

    case 'Hired':
      subject = `Congratulations! Welcome to ${company} - ${jobTitle}`;
      headline = 'Congratulations on Your Offer!';
      leadText = `On behalf of the entire team at <strong>${company}</strong>, we are thrilled to congratulate you on your selection for the <strong>${jobTitle}</strong> position!`;

      detailContentHtml = `
        <p style="color: #334155; font-size: 14.5px; line-height: 1.6;">
          Your performance throughout the evaluation process was outstanding, and we are excited about the knowledge, energy, and vision you will bring to our team.
        </p>
        <p style="color: #334155; font-size: 14.5px; line-height: 1.6;">
          Our Human Resources and Onboarding coordinators will be in touch shortly with formal offer documentation, compensation details, and onboarding schedules.
        </p>
      `;

      detailContentText = `Congratulations! We are delighted to inform you that you have been selected for the position of ${jobTitle} at ${company}. Our onboarding team will contact you shortly with formal documentation and next steps.`;
      ctaText = 'View Application Record';
      break;

    default: // 'Applied'
      subject = `Application Received: ${jobTitle} at ${company} (ID: ${appIdShort})`;
      headline = 'Application Received';
      leadText = `Thank you for applying for the position of <strong>${jobTitle}</strong> at <strong>${company}</strong> (Application ID: <strong>#${appIdShort}</strong>).`;
      detailContentHtml = `
        <p style="color: #334155; font-size: 14.5px; line-height: 1.6;">
          We have received your application materials and resume. Our recruitment team will review your qualifications and reach out with any updates regarding next steps.
        </p>
      `;
      detailContentText = `We have received your application for ${jobTitle} at ${company}. We will review your materials and contact you with updates.`;
      ctaText = 'Track Application';
      break;
  }

  // Construct Full HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f1f5f9; padding: 30px 15px;">
        <tr>
          <td align="center">
            <!-- Email Container -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
              
              <!-- Brand Header Bar -->
              <tr>
                <td style="background-color: #0f172a; padding: 22px 30px; text-align: left;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.3px;">
                        CareerPilot <span style="color: #a3e635;">AI</span>
                      </td>
                      <td align="right" style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                        Talent Acquisition
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Status Badge & Title Banner -->
              <tr>
                <td style="padding: 28px 30px 10px 30px;">
                  <div style="display: inline-block; background-color: ${currentTheme.bgLight}; color: ${currentTheme.color}; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; border: 1px solid ${currentTheme.color}33; margin-bottom: 12px;">
                    ${currentTheme.badgeText}
                  </div>
                  <h2 style="margin: 0 0 6px 0; color: #0f172a; font-size: 22px; font-weight: 800; line-height: 1.3;">
                    ${headline}
                  </h2>
                  <p style="margin: 0; color: #64748b; font-size: 13.5px;">
                    Position: <strong>${jobTitle}</strong> &nbsp;•&nbsp; <strong>${company}</strong>
                  </p>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 16px 30px 24px 30px;">
                  <p style="margin: 0 0 14px 0; font-size: 15px; color: #1e293b; line-height: 1.6;">
                    Hi <strong>${candidateName}</strong>,
                  </p>
                  <p style="margin: 0 0 14px 0; font-size: 14.5px; color: #334155; line-height: 1.6;">
                    ${leadText}
                  </p>

                  ${detailContentHtml}

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0 15px 0;">
                    <a href="${ctaLink}" target="_blank" style="background-color: #0f172a; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; letter-spacing: 0.2px;">
                      ${ctaText} →
                    </a>
                  </div>

                  <p style="margin: 28px 0 0 0; font-size: 14px; color: #334155; line-height: 1.6;">
                    Best regards,<br />
                    <strong>${company} Recruiting Team</strong><br />
                    <span style="font-size: 12.5px; color: #64748b;">In partnership with CareerPilot AI</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
                  <p style="margin: 0 0 6px 0;">
                    This communication was generated regarding your application (ID: #${appIdShort}) on CareerPilot AI.
                  </p>
                  <p style="margin: 0;">
                    © ${new Date().getFullYear()} CareerPilot AI. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Construct Plain Text Fallback
  const text = `Hi ${candidateName},

${leadText.replace(/<[^>]+>/g, '')}

${detailContentText}

You can track your application and career preparation at:
${ctaLink}

Best regards,
${company} Recruiting Team
CareerPilot AI Talent Platform
Application ID: #${appIdShort}
`;

  return { subject, text, html };
}

module.exports = {
  formatDate,
  generateStatusEmail,
};
