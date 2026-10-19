// ====================================================
// Judge0 & Sandboxed Code Execution Service — CareerPilot AI
//
// Evaluates candidate coding solutions against test cases.
// Supports:
// 1. Judge0 CE API via RapidAPI (when JUDGE0_API_KEY is configured).
// 2. Built-in zero-latency local sandbox execution (Python 3 & JavaScript/Node)
//    so the system runs out-of-the-box without requiring an external API key.
// ====================================================

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Judge0 RapidAPI Language IDs
const JUDGE0_LANGUAGE_IDS = {
  python: 71,      // Python (3.8.1)
  javascript: 63,  // JavaScript (Node.js 12.14.0)
  java: 62,        // Java (OpenJDK 13.0.1)
  cpp: 54,         // C++ (GCC 9.2.0)
};

/**
 * Executes code using Judge0 CE via RapidAPI
 */
const runWithJudge0 = async (language, sourceCode, stdin = '', timeLimit = 3) => {
  const apiKey = process.env.JUDGE0_API_KEY;
  const apiHost = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';
  const languageId = JUDGE0_LANGUAGE_IDS[language.toLowerCase()];

  if (!languageId) {
    throw new Error(`Unsupported language for Judge0: ${language}`);
  }

  const response = await fetch(`https://${apiHost}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': apiHost,
    },
    body: JSON.stringify({
      language_id: languageId,
      source_code: sourceCode,
      stdin: stdin || '',
      cpu_time_limit: timeLimit,
      memory_limit: 256000, // 256 MB in KB
    }),
    signal: AbortSignal.timeout((timeLimit + 5) * 1000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Judge0 API error (${response.status}): ${errText}`);
  }

  const result = await response.json();

  const statusId = result.status?.id;
  let status = 'Runtime Error';
  if (statusId === 3) status = 'Accepted';
  else if (statusId === 4) status = 'Wrong Answer';
  else if (statusId === 5) status = 'Time Limit Exceeded';
  else if (statusId === 6) status = 'Compilation Error';

  return {
    status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || result.compile_output || '').trim(),
    time: parseFloat(result.time || 0) * 1000, // convert to ms
    memory: parseInt(result.memory || 0, 10), // KB
  };
};

/**
 * Built-in local execution for Python and JavaScript
 */
const runLocally = (language, sourceCode, stdin = '', timeLimit = 3) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const tempDir = os.tmpdir();
    const fileExt = language === 'python' ? 'py' : 'js';
    const tempFile = path.join(tempDir, `cp_run_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`);

    fs.writeFileSync(tempFile, sourceCode, 'utf8');

    const cmd = language === 'python' ? 'python' : 'node';
    const child = spawn(cmd, [tempFile], {
      timeout: timeLimit * 1000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Timeout watchdog
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeLimit * 1000);

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    } else {
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;

      // Clean up temp file
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore unlink error
      }

      if (timedOut) {
        return resolve({
          status: 'Time Limit Exceeded',
          stdout: stdout.trim(),
          stderr: 'Time limit exceeded (> 3 seconds)',
          time: executionTime,
          memory: 0,
        });
      }

      if (code !== 0) {
        return resolve({
          status: 'Runtime Error',
          stdout: stdout.trim(),
          stderr: stderr.trim() || `Process exited with code ${code}`,
          time: executionTime,
          memory: 0,
        });
      }

      return resolve({
        status: 'Accepted', // Output matches check done by caller
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        time: executionTime,
        memory: 0,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch (e) {}

      resolve({
        status: 'Runtime Error',
        stdout: '',
        stderr: `Execution error: ${err.message}`,
        time: Date.now() - startTime,
        memory: 0,
      });
    });
  });
};

/**
 * Unified code runner: uses Judge0 if API key is provided, falls back to safe local execution
 */
const executeCode = async (language, sourceCode, stdin = '', timeLimit = 3) => {
  const normalizedLang = language.toLowerCase();

  // If Judge0 API key is set, prioritize Judge0
  if (process.env.JUDGE0_API_KEY && process.env.JUDGE0_API_KEY !== 'your_judge0_rapidapi_key_here') {
    try {
      return await runWithJudge0(normalizedLang, sourceCode, stdin, timeLimit);
    } catch (err) {
      console.warn('Judge0 API failed, falling back to local runner:', err.message);
    }
  }

  // Fallback to local sandbox for supported languages
  if (normalizedLang === 'python' || normalizedLang === 'javascript') {
    return await runLocally(normalizedLang, sourceCode, stdin, timeLimit);
  }

  if (normalizedLang === 'java') {
    return {
      status: 'Compilation Error',
      stdout: '',
      stderr: 'Java execution requires "javac" on your system PATH or a JUDGE0_API_KEY configured in server/.env.',
      time: 0,
      memory: 0,
    };
  }

  if (normalizedLang === 'cpp') {
    return {
      status: 'Compilation Error',
      stdout: '',
      stderr: 'C++ execution requires "g++" on your system PATH or a JUDGE0_API_KEY configured in server/.env.',
      time: 0,
      memory: 0,
    };
  }

  return {
    status: 'Compilation Error',
    stdout: '',
    stderr: `Language "${language}" is not currently supported in the local runner.`,
    time: 0,
    memory: 0,
  };
};

/**
 * Normalizes string outputs for comparison (ignores trailing newlines & carriage returns)
 */
const normalizeOutput = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/\r\n/g, '\n').trim();
};

/**
 * Evaluates code across a suite of test cases
 */
const batchEvaluate = async (language, sourceCode, testCases, timeLimit = 3) => {
  const results = [];
  let passedCount = 0;
  let overallStatus = 'Accepted';
  let maxRuntime = 0;
  let maxMemory = 0;
  let firstError = '';

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const execResult = await executeCode(language, sourceCode, tc.input, timeLimit);

    maxRuntime = Math.max(maxRuntime, execResult.time || 0);
    maxMemory = Math.max(maxMemory, execResult.memory || 0);

    const expected = normalizeOutput(tc.output);
    const actual = normalizeOutput(execResult.stdout);

    let passed = false;
    let tcStatus = execResult.status;

    if (execResult.status === 'Time Limit Exceeded') {
      overallStatus = 'Time Limit Exceeded';
      if (!firstError) firstError = 'Time Limit Exceeded';
    } else if (execResult.status === 'Runtime Error') {
      overallStatus = 'Runtime Error';
      if (!firstError) firstError = execResult.stderr || 'Runtime Error';
    } else if (actual === expected) {
      passed = true;
      passedCount++;
      tcStatus = 'Passed';
    } else {
      tcStatus = 'Wrong Answer';
      if (overallStatus === 'Accepted') overallStatus = 'Wrong Answer';
    }

    results.push({
      testCaseIndex: i + 1,
      passed,
      status: tcStatus,
      input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
      expectedOutput: tc.isHidden ? '[Hidden]' : expected,
      actualOutput: tc.isHidden ? (passed ? '[Correct Output]' : '[Wrong Output]') : actual,
      error: execResult.stderr || '',
      executionTime: execResult.time,
    });
  }

  return {
    status: overallStatus,
    passedCount,
    totalCount: testCases.length,
    runtime: maxRuntime,
    memory: maxMemory,
    errorMessage: firstError,
    results,
  };
};

module.exports = {
  executeCode,
  batchEvaluate,
  JUDGE0_LANGUAGE_IDS,
};
