// ====================================================
// Ollama AI Service — CareerPilot AI
//
// Wraps local Ollama endpoints with:
// 1. generateJSON(prompt, fallback, options) with dynamic token bounds and safe timing logs.
// 2. generateChatResponse(messages, systemPrompt, options) for conversational advice.
// 3. generateChatStream(messages, systemPrompt) for real-time streaming chunks.
//
// Config (via .env):
//   OLLAMA_BASE_URL  - Ollama server base URL  (default: http://127.0.0.1:11434)
//   OLLAMA_MODEL     - Model name to use        (default: gemma3:4b)
// ====================================================

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL    || 'gemma3:4b';

// System prompt applied to every request to enforce JSON-only output
const SYSTEM_PROMPT =
  'You are CareerPilot AI — a placement preparation assistant for students and job seekers. ' +
  'You help with technical interviews, aptitude, HR questions, resumes, coding problems, and learning roadmaps. ' +
  'IMPORTANT: Always respond with valid, raw JSON only. ' +
  'Do NOT include markdown code fences, backticks, explanations, or any text outside the JSON structure. ' +
  'Return only the JSON object or array that was requested.';

/**
 * Sends a prompt to Ollama and returns a parsed JSON object.
 *
 * @param {string} prompt       - The user-facing prompt.
 * @param {object} [fallback]   - Returned as-is if Ollama is unreachable or returns invalid JSON.
 * @param {object} [opts]       - Optional tuning overrides { temperature, num_predict, timeoutMs }.
 * @returns {Promise<object>}   - Parsed JSON response from the model.
 */
const generateJSON = async (prompt, fallback = {}, opts = {}) => {
  if (!OLLAMA_BASE_URL) {
    console.error('[Ollama AI] Error: OLLAMA_BASE_URL is not configured');
    return fallback;
  }

  const temperature = opts.temperature !== undefined ? opts.temperature : 0.4;
  const numPredict  = opts.num_predict  || 750; // Optimized default: keeps inference snappy on local CPU
  const timeoutMs   = opts.timeoutMs    || 35000;

  const startTime = Date.now();
  console.log(`[Ollama AI] Request start: model=${OLLAMA_MODEL}, format=json, max_tokens=${numPredict}`);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: prompt }
        ],
        stream: false,
        format: 'json',
        options: {
          temperature,
          num_predict: numPredict,
        }
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawText = data?.message?.content;
    const tokens = data?.eval_count || 0;
    const evalMs = data?.eval_duration ? Math.round(data.eval_duration / 1e6) : duration;
    console.log(`[Ollama AI] Completed in ${duration}ms (tokens: ${tokens}, eval_time: ${evalMs}ms)`);

    if (!rawText || rawText.trim() === '') {
      throw new Error('Ollama returned an empty response');
    }

    // Strip markdown fences as a safety net
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    return JSON.parse(cleaned);

  } catch (err) {
    const elapsed = Date.now() - startTime;
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(
        `[Ollama AI] Timeout after ${elapsed}ms: model "${OLLAMA_MODEL}" exceeded ${timeoutMs}ms limit. Returning structured fallback.`
      );
    } else if (err.message.includes('fetch failed') || err.code === 'ECONNREFUSED') {
      console.error(
        `[Ollama AI] Connection refused at ${OLLAMA_BASE_URL} (${elapsed}ms). Make sure "ollama serve" is running.`
      );
    } else {
      console.error(`[Ollama AI] Error after ${elapsed}ms:`, err.message);
    }
    return fallback;
  }
};

/**
 * Sends a conversational message array to Ollama and returns text response.
 *
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @param {string} [systemPrompt] - Custom system prompt override
 * @param {object} [opts] - Tuning options { num_predict, temperature, timeoutMs }
 * @returns {Promise<string>} - Assistant's reply
 */
const generateChatResponse = async (messages, systemPrompt = null, opts = {}) => {
  if (!OLLAMA_BASE_URL) {
    throw new Error('OLLAMA_BASE_URL is not configured');
  }

  const promptToUse = systemPrompt || 
    'You are CareerPilot AI, an elite placement preparation mentor and technical coach. ' +
    'You specialize in helping students and job seekers crack campus placements and software engineering interviews. ' +
    'Your expertise covers:\n' +
    '1. Data Structures & Algorithms (clean code, time/space complexity analysis, intuition)\n' +
    '2. System Design & Web Dev (architecture, scalability, REST, DB design)\n' +
    '3. Core CS Subjects (OS, DBMS, Computer Networks, OOP)\n' +
    '4. HR & Behavioral Rounds (STAR methodology, communication, leadership)\n' +
    '5. Resume feedback and placement tips.\n\n' +
    'Guidelines:\n' +
    '- Give well-structured, clear, practical answers with markdown formatting.\n' +
    '- Include code examples when relevant (Python, Java, C++, JavaScript).\n' +
    '- Be encouraging, concise, and direct.';

  const numPredict = opts.num_predict || 1024;
  const timeoutMs  = opts.timeoutMs   || 40000;
  const startTime  = Date.now();

  console.log(`[Ollama Chat] Request start: model=${OLLAMA_MODEL}, history_turns=${messages.length}, max_tokens=${numPredict}`);

  try {
    const formattedMessages = [
      { role: 'system', content: promptToUse },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: formattedMessages,
        stream: false,
        options: {
          temperature: opts.temperature !== undefined ? opts.temperature : 0.6,
          num_predict: numPredict,
        }
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const reply = data?.message?.content;
    const tokens = data?.eval_count || 0;
    console.log(`[Ollama Chat] Completed in ${duration}ms (tokens: ${tokens})`);

    if (!reply || reply.trim() === '') {
      return "I apologize, but I couldn't generate a response. Please try asking again.";
    }

    return reply.trim();
  } catch (err) {
    const elapsed = Date.now() - startTime;
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[Ollama Chat] Timeout after ${elapsed}ms.`);
      throw new Error('AI response timed out. Please try asking a shorter or more specific question.');
    }
    throw err;
  }
};

/**
 * Streams chat chunks from Ollama SSE API
 * Yields string delta tokens as they arrive.
 */
async function* generateChatStream(messages, systemPrompt = null, opts = {}) {
  const promptToUse = systemPrompt || 'You are CareerPilot AI, an elite placement preparation mentor.';
  const formattedMessages = [
    { role: 'system', content: promptToUse },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: formattedMessages,
      stream: true,
      options: {
        temperature: opts.temperature || 0.6,
        num_predict: opts.num_predict || 1024,
      }
    }),
    signal: AbortSignal.timeout(opts.timeoutMs || 45000),
  });

  if (!response.ok) {
    throw new Error(`Ollama stream error: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep last incomplete line

    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line);
          const chunk = parsed?.message?.content;
          if (chunk) yield chunk;
        } catch (e) {
          // ignore parse errors on partial chunks
        }
      }
    }
  }
}

module.exports = { generateJSON, generateChatResponse, generateChatStream };
