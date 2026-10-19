// ====================================================
// API Service Wrapper (fetch client wrappers)
//
// This file serves as the unified interface for making HTTP requests to the backend API.
// It wraps standard fetch calls, automatically inserts auth tokens, and parses response logs.
//
// Features:
// - Appends active session token in headers ('Authorization: Bearer <token>') for protected endpoints.
// - Formats URL query strings for searching, filtering, sorting, and pagination.
// - Handles global network error messages.
//
// Used by:
// - Pages and components (Home, Jobs, JobDetails, Login, Signup, RecruiterDashboard) to fetch/mutate data.
// ====================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Purpose:
// Generates request headers dynamically, inserting authorization Bearer token if found.
//
// Input:
// contentType (string) - HTTP Content-Type header value.
//
// Output:
// Returns a header object containing Content-Type and Authorization keys.
const getHeaders = (contentType = 'application/json') => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Purpose:
// Processes the API response, parses JSON, and throws structured errors on failures.
//
// Input:
// response (Response object) - The raw HTTP response.
//
// Output:
// Returns the parsed JSON payload, or throws an Error object.
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.message || 'Something went wrong';
    const error = new Error(errorMsg);
    error.errors = data.errors || null;
    throw error;
  }
  return data;
};

// Main API interface export
export const api = {
  
  // ====================================================
  // AUTHENTICATION ENDPOINTS
  // ====================================================

  // Registers a new user account (Candidate or Recruiter)
  async signup(fullName, email, password, role) {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role }),
    });
    return handleResponse(response);
  },

  // Authenticates user and gets JWT token
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  // Fetches current session user profile info
  async getMe() {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ====================================================
  // JOBS ENDPOINTS
  // ====================================================

  // Fetches lists of job postings with filters
  async getJobs({ search = '', location = '', jobType = 'All', experience = 'All', sort = 'Latest', page = 1, limit = 6, myJobs = false, minSalary = '', maxSalary = '', company = '' } = {}) {
    const query = new URLSearchParams({
      search,
      location,
      jobType,
      experience,
      sort,
      page: String(page),
      limit: String(limit),
    });
    if (myJobs) {
      query.append('myJobs', 'true');
    }
    if (minSalary) {
      query.append('minSalary', String(minSalary));
    }
    if (maxSalary) {
      query.append('maxSalary', String(maxSalary));
    }
    if (company) {
      query.append('company', company);
    }
    const response = await fetch(`${API_BASE}/jobs?${query.toString()}`, {
      headers: getHeaders(null), // No Content-Type needed for GET requests
    });
    return handleResponse(response);
  },

  // Fetches details of a single job posting by ID
  async getJobById(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}`);
    return handleResponse(response);
  },

  // Posts a new job listing (Recruiter-only)
  async createJob(jobData) {
    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  // Updates an existing job listing details (Recruiter-only)
  async updateJob(id, jobData) {
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  // Deletes an existing job listing (Recruiter-only)
  async deleteJob(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Closes job applications (Recruiter-only)
  async closeJob(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}/close`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Reopens job applications (Recruiter-only)
  async reopenJob(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}/reopen`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ====================================================
  // APPLICATION ENDPOINTS
  // ====================================================

  // Submits a new job application form (Candidate-only)
  async applyJob(jobId, applicantData) {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(applicantData),
    });
    return handleResponse(response);
  },

  // Fetches list of applications for a specific job (Recruiter-only)
  async getApplicationsByJob(jobId) {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/applications`, {
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Fetches current candidate's applied applications history list
  async getUserApplications() {
    const response = await fetch(`${API_BASE}/applications/user`, {
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Updates review status of candidate application (Recruiter-only)
  async updateApplicationStatus(applicationId, status) {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // Searches recruiter's job applicants with keyword and status filter
  async searchApplications({ keyword = '', status = 'All', jobId = '' } = {}) {
    const query = new URLSearchParams();
    if (keyword) query.append('keyword', keyword);
    if (status && status !== 'All') query.append('status', status);
    if (jobId) query.append('jobId', jobId);
    
    const response = await fetch(`${API_BASE}/applications/search?${query.toString()}`, {
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Requests a password reset link email
  async forgotPassword(email) {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Resets user password using the token link
  async resetPassword(token, password) {
    const response = await fetch(`${API_BASE}/auth/reset-password/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },

  // ====================================================
  // DASHBOARD STATISTICS ENDPOINTS
  // ====================================================
  async getRecruiterStats() {
    const response = await fetch(`${API_BASE}/dashboard/recruiter`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getCandidateStats() {
    const response = await fetch(`${API_BASE}/dashboard/candidate`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getAdminStats() {
    const response = await fetch(`${API_BASE}/dashboard/admin`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ====================================================
  // SAVED JOBS ENDPOINTS
  // ====================================================
  async getSavedJobs() {
    const response = await fetch(`${API_BASE}/users/saved-jobs`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async saveJob(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}/save`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async unsaveJob(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}/save`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // ====================================================
  // CANDIDATE PROFILE & UPLOADS ENDPOINTS
  // ====================================================
  async getProfile() {
    const response = await fetch(`${API_BASE}/profile`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async updateProfile(profileData) {
    const response = await fetch(`${API_BASE}/profile/update`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  async uploadResume(formData) {
    const response = await fetch(`${API_BASE}/profile/upload-resume`, {
      method: 'POST',
      headers: getHeaders(null), // Let browser set Content-Type with boundary for multipart
      body: formData,
    });
    return handleResponse(response);
  },

  async uploadLogo(formData) {
    const response = await fetch(`${API_BASE}/jobs/upload-logo`, {
      method: 'POST',
      headers: getHeaders(null), // Let browser set Content-Type with boundary for multipart
      body: formData,
    });
    return handleResponse(response);
  },

  // ====================================================
  // AI PREPARATION ENDPOINTS
  // ====================================================
  async getAIDashboardStats() {
    const response = await fetch(`${API_BASE}/ai/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async analyzeResume(formData) {
    const response = await fetch(`${API_BASE}/ai/analyze-resume`, {
      method: 'POST',
      headers: getHeaders(null), // Let browser set Content-Type with boundary for multipart
      body: formData,
    });
    return handleResponse(response);
  },

  async getCareerRoadmap(roadmapData) {
    const response = await fetch(`${API_BASE}/ai/career-roadmap`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(roadmapData),
    });
    return handleResponse(response);
  },

  async getInterviewQuestions(options) {
    const payload = typeof options === 'string' ? { interviewType: options } : (options || {});
    const response = await fetch(`${API_BASE}/ai/interview-prep`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async evaluateMockAnswer(data) {
    const response = await fetch(`${API_BASE}/ai/evaluate-mock-answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async saveInterviewSession(sessionData) {
    const response = await fetch(`${API_BASE}/ai/interview-session/save`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sessionData),
    });
    return handleResponse(response);
  },

  async getInterviewSessions() {
    const response = await fetch(`${API_BASE}/ai/interview-sessions`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getInterviewSessionById(id) {
    const response = await fetch(`${API_BASE}/ai/interview-sessions/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getQuizQuestions(topic, difficulty, numQuestions, subtopics = [], quizMode = 'practice') {
    const response = await fetch(`${API_BASE}/ai/generate-quiz`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ topic, difficulty, numQuestions, subtopics, quizMode }),
    });
    return handleResponse(response);
  },

  async getAIRecommendations() {
    const response = await fetch(`${API_BASE}/ai/recommendations`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async saveQuizAttempt(data) {
    const response = await fetch(`${API_BASE}/ai/quiz-attempt`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getQuizHistory() {
    const response = await fetch(`${API_BASE}/ai/quiz-history`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async saveRoadmap(data) {
    const response = await fetch(`${API_BASE}/ai/save-roadmap`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getSavedRoadmaps() {
    const response = await fetch(`${API_BASE}/ai/saved-roadmaps`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async deleteSavedRoadmap(id) {
    const response = await fetch(`${API_BASE}/ai/saved-roadmaps/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // ====================================================
  // CAREERPILOT AI CHATBOT ENDPOINTS
  // ====================================================
  async getAIChatConversations() {
    const response = await fetch(`${API_BASE}/ai-chat/conversations`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getAIChatConversation(id) {
    const response = await fetch(`${API_BASE}/ai-chat/conversations/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async startAIChatConversation(data = {}) {
    const response = await fetch(`${API_BASE}/ai-chat/conversations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async sendAIChatMessage(conversationId, message) {
    const response = await fetch(`${API_BASE}/ai-chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    });
    return handleResponse(response);
  },

  async deleteAIChatConversation(id) {
    const response = await fetch(`${API_BASE}/ai-chat/conversations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // ====================================================
  // CODING PRACTICE & JUDGE0 ENDPOINTS
  // ====================================================
  async getCodingProblems(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/coding/problems?${query}` : `${API_BASE}/coding/problems`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getCodingProblem(slug) {
    const response = await fetch(`${API_BASE}/coding/problems/${slug}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async runCodingCode(data) {
    const response = await fetch(`${API_BASE}/coding/run`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async submitCodingSolution(data) {
    const response = await fetch(`${API_BASE}/coding/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getCodingSubmissions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/coding/submissions?${query}` : `${API_BASE}/coding/submissions`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ====================================================
  // CODING CONTESTS & LEADERBOARDS ENDPOINTS
  // ====================================================
  async getContests() {
    const response = await fetch(`${API_BASE}/contests`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getContest(slug) {
    const response = await fetch(`${API_BASE}/contests/${slug}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async registerForContest(contestId) {
    const response = await fetch(`${API_BASE}/contests/${contestId}/register`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getContestArena(slug) {
    const response = await fetch(`${API_BASE}/contests/${slug}/arena`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async submitContestProblem(slug, data) {
    const response = await fetch(`${API_BASE}/contests/${slug}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getContestLeaderboard(slug) {
    const response = await fetch(`${API_BASE}/contests/${slug}/leaderboard`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ====================================================
  // CHAT ENDPOINTS
  // ====================================================
  async getConversations() {
    const response = await fetch(`${API_BASE}/chat/conversations`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getMessages(conversationId) {
    const response = await fetch(`${API_BASE}/chat/messages/${conversationId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async sendMessage(recipientId, text) {
    const response = await fetch(`${API_BASE}/chat/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ recipientId, text }),
    });
    return handleResponse(response);
  },

  async createConversation(applicationId) {
    const response = await fetch(`${API_BASE}/chat/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ applicationId }),
    });
    return handleResponse(response);
  },

  async sendChatMessage(conversationId, text) {
    const response = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ conversationId, text }),
    });
    return handleResponse(response);
  },

  // ====================================================
  // ADMIN PANEL ENDPOINTS
  // ====================================================
  async getAdminStats() {
    const response = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getAdminReports() {
    const response = await fetch(`${API_BASE}/admin/reports`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getAdminAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/admin/audit-logs?${query}` : `${API_BASE}/admin/audit-logs`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getAdminJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/admin/jobs?${query}` : `${API_BASE}/admin/jobs`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createAdminJob(jobData) {
    const response = await fetch(`${API_BASE}/admin/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  async updateAdminJob(id, jobData) {
    const response = await fetch(`${API_BASE}/admin/jobs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  async setAdminJobStatus(id, status) {
    const response = await fetch(`${API_BASE}/admin/jobs/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  async deleteAdminJob(id, permanent = false) {
    const url = permanent ? `${API_BASE}/admin/jobs/${id}?permanent=true` : `${API_BASE}/admin/jobs/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  async getAdminJobApplications(id) {
    const response = await fetch(`${API_BASE}/admin/jobs/${id}/applications`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/admin/users?${query}` : `${API_BASE}/admin/users`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async updateAdminUserStatus(id, status) {
    const response = await fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  async updateAdminUserRole(id, role) {
    const response = await fetch(`${API_BASE}/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse(response);
  },

  async updateAdminUserProfile(id, userData) {
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  async deleteAdminUser(id) {
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  async getAdminApplications(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/admin/applications?${query}` : `${API_BASE}/admin/applications`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async updateAdminApplicationStatus(id, statusOrPayload) {
    const payload = typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload;
    const response = await fetch(`${API_BASE}/admin/applications/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async deleteAdminApplication(id) {
    const response = await fetch(`${API_BASE}/admin/applications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Quiz Questions Management (AI Prep Hub Content)
  async getAdminQuizQuestions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/admin/quiz-questions?${query}` : `${API_BASE}/admin/quiz-questions`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createAdminQuizQuestion(data) {
    const response = await fetch(`${API_BASE}/admin/quiz-questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateAdminQuizQuestion(id, data) {
    const response = await fetch(`${API_BASE}/admin/quiz-questions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async setAdminQuizQuestionStatus(id, isPublished) {
    const response = await fetch(`${API_BASE}/admin/quiz-questions/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isPublished }),
    });
    return handleResponse(response);
  },

  async deleteAdminQuizQuestion(id) {
    const response = await fetch(`${API_BASE}/admin/quiz-questions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Coding Problems Management (Code Practice Content)
  async getAdminCodingProblems(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/admin/coding-problems?${query}` : `${API_BASE}/admin/coding-problems`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createAdminCodingProblem(data) {
    const response = await fetch(`${API_BASE}/admin/coding-problems`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateAdminCodingProblem(id, data) {
    const response = await fetch(`${API_BASE}/admin/coding-problems/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async setAdminCodingProblemStatus(id, isPublished) {
    const response = await fetch(`${API_BASE}/admin/coding-problems/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isPublished }),
    });
    return handleResponse(response);
  },

  async deleteAdminCodingProblem(id) {
    const response = await fetch(`${API_BASE}/admin/coding-problems/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // ====================================================
  // NOTIFICATIONS ENDPOINTS
  // ====================================================
  async getNotifications() {
    const response = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async markNotificationsRead() {
    const response = await fetch(`${API_BASE}/notifications/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async clearNotifications() {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // ====================================================
  // RECIPENT RECENT ACTIVITIES
  // ====================================================
  async getRecentActivities() {
    const response = await fetch(`${API_BASE}/activities`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ====================================================
  // RECIPENT RECENT NOTES
  // ====================================================
  async getNotes(applicationId) {
    const response = await fetch(`${API_BASE}/notes/${applicationId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createNote(applicationId, note) {
    const response = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ applicationId, note }),
    });
    return handleResponse(response);
  },

  async updateNote(noteId, note) {
    const response = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ note }),
    });
    return handleResponse(response);
  },

  async deleteNote(noteId) {
    const response = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // ====================================================
  // INTERVIEW MANAGEMENT
  // ====================================================
  async getInterview(interviewId) {
    const response = await fetch(`${API_BASE}/interviews/${interviewId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getInterviewByApplication(applicationId) {
    const response = await fetch(`${API_BASE}/interviews/application/${applicationId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async scheduleInterview(interviewData) {
    const response = await fetch(`${API_BASE}/interviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(interviewData),
    });
    return handleResponse(response);
  },

  async updateInterview(interviewId, interviewData) {
    const response = await fetch(`${API_BASE}/interviews/${interviewId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(interviewData),
    });
    return handleResponse(response);
  },

  async cancelInterview(interviewId) {
    const response = await fetch(`${API_BASE}/interviews/${interviewId}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Bulk update applications
  async bulkUpdateApplications(applicationIds, status) {
    const response = await fetch(`${API_BASE}/applications/bulk-update`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ applicationIds, status }),
    });
    return handleResponse(response);
  },

  // Export applications to CSV and trigger download
  async exportApplications(jobId) {
    const query = jobId ? `?jobId=${jobId}` : '';
    const response = await fetch(`${API_BASE}/applications/export${query}`, {
      headers: getHeaders(null),
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applicants_${jobId || 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Fetch recruiter recruitment analytics
  async getRecruiterAnalytics() {
    const response = await fetch(`${API_BASE}/analytics/recruiter`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ====================================================
  // ADMIN PORTAL ENDPOINTS
  // ====================================================
  async getAdminStats() {
    const response = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getAdminAuditLogs({ limit = 40, action = '', targetType = '' } = {}) {
    const query = new URLSearchParams();
    if (limit) query.append('limit', limit);
    if (action) query.append('action', action);
    if (targetType) query.append('targetType', targetType);
    const response = await fetch(`${API_BASE}/admin/audit-logs?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Admin Jobs
  async getAdminJobs({ status = '', search = '' } = {}) {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    if (search) query.append('search', search);
    const response = await fetch(`${API_BASE}/admin/jobs?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createAdminJob(jobData) {
    const response = await fetch(`${API_BASE}/admin/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  async updateAdminJob(jobId, jobData) {
    const response = await fetch(`${API_BASE}/admin/jobs/${jobId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  async setAdminJobStatus(jobId, jobStatus) {
    const response = await fetch(`${API_BASE}/admin/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ jobStatus }),
    });
    return handleResponse(response);
  },

  async deleteAdminJob(jobId) {
    const response = await fetch(`${API_BASE}/admin/jobs/${jobId}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  async getAdminJobApplications(jobId) {
    const response = await fetch(`${API_BASE}/admin/jobs/${jobId}/applications`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Admin Users / Students
  async getAdminUsers({ role = 'candidate', status = '', search = '' } = {}) {
    const query = new URLSearchParams();
    if (role) query.append('role', role);
    if (status) query.append('status', status);
    if (search) query.append('search', search);
    const response = await fetch(`${API_BASE}/admin/users?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async updateAdminUserStatus(userId, accountStatus) {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ accountStatus }),
    });
    return handleResponse(response);
  },

  // Admin Applications
  async getAdminApplications({ status = '', search = '' } = {}) {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    if (search) query.append('search', search);
    const response = await fetch(`${API_BASE}/admin/applications?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },



  // Admin Learning Content: Quiz Questions
  async getAdminQuizQuestions({ search = '', topic = '', difficulty = '' } = {}) {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (topic) query.append('topic', topic);
    if (difficulty) query.append('difficulty', difficulty);
    const response = await fetch(`${API_BASE}/admin/quiz-questions?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createAdminQuizQuestion(questionData) {
    const response = await fetch(`${API_BASE}/admin/quiz-questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(questionData),
    });
    return handleResponse(response);
  },

  async updateAdminQuizQuestion(questionId, questionData) {
    const response = await fetch(`${API_BASE}/admin/quiz-questions/${questionId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(questionData),
    });
    return handleResponse(response);
  },

  async setAdminQuizQuestionStatus(questionId, isPublished) {
    const response = await fetch(`${API_BASE}/admin/quiz-questions/${questionId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isPublished }),
    });
    return handleResponse(response);
  },

  async deleteAdminQuizQuestion(questionId) {
    const response = await fetch(`${API_BASE}/admin/quiz-questions/${questionId}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Admin Learning Content: Coding Problems
  async getAdminCodingProblems({ search = '', category = '', difficulty = '' } = {}) {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (category) query.append('category', category);
    if (difficulty) query.append('difficulty', difficulty);
    const response = await fetch(`${API_BASE}/admin/coding-problems?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createAdminCodingProblem(problemData) {
    const response = await fetch(`${API_BASE}/admin/coding-problems`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(problemData),
    });
    return handleResponse(response);
  },

  async updateAdminCodingProblem(problemId, problemData) {
    const response = await fetch(`${API_BASE}/admin/coding-problems/${problemId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(problemData),
    });
    return handleResponse(response);
  },

  async setAdminCodingProblemStatus(problemId, isPublished) {
    const response = await fetch(`${API_BASE}/admin/coding-problems/${problemId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isPublished }),
    });
    return handleResponse(response);
  },

  async deleteAdminCodingProblem(problemId) {
    const response = await fetch(`${API_BASE}/admin/coding-problems/${problemId}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },
};

