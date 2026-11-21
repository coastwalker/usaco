const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

function assetUrl(relPath) {
  return new URL(relPath.replace(/^\//, ''), document.baseURI).toString();
}

export function normalizeOutput(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trimEnd();
}

function truncatePreview(text, maxChars = 450) {
  const str = String(text ?? '');
  if (str.length <= maxChars) return { text: str, truncated: false, totalChars: str.length };
  return {
    text: `${str.slice(0, maxChars)}\n… (${(str.length - maxChars).toLocaleString()} more characters)`,
    truncated: true,
    totalChars: str.length,
  };
}

// ============================================================================
// Static Problem & Test-Case Loader (for GitHub Pages)
// ============================================================================

export async function fetchStaticProblems() {
  const res = await fetch(assetUrl('data/problems.json'));
  if (!res.ok) throw new Error('Failed to load static problems catalog');
  const data = await res.json();
  return data.problems;
}

export async function fetchStaticProblem(id) {
  const res = await fetch(assetUrl(`data/problems/${encodeURIComponent(id)}/problem.json`));
  if (!res.ok) throw new Error(`Problem "${id}" not found`);
  return res.json();
}

async function loadStaticTestCases(problem) {
  const count = problem.testCount || 11;
  const tasks = [];
  for (let i = 1; i <= count; i += 1) {
    tasks.push(
      Promise.all([
        fetch(assetUrl(`data/problems/${encodeURIComponent(problem.id)}/tests/${i}.in`)).then(
          (r) => {
            if (!r.ok) throw new Error(`Missing test ${i}.in`);
            return r.text();
          }
        ),
        fetch(assetUrl(`data/problems/${encodeURIComponent(problem.id)}/tests/${i}.out`)).then(
          (r) => {
            if (!r.ok) throw new Error(`Missing test ${i}.out`);
            return r.text();
          }
        ),
      ]).then(([input, expected]) => ({
        index: i,
        isSample: i === 1,
        input,
        expected,
      }))
    );
  }
  return Promise.all(tasks);
}

// ============================================================================
// Pyodide WebAssembly Worker (Python 3 in browser with real TLE termination)
// ============================================================================

let pyWorker = null;
let pyReadyPromise = null;
let msgSeq = 1;

function resetPyWorker() {
  if (pyWorker) {
    pyWorker.terminate();
    pyWorker = null;
  }
  pyReadyPromise = null;
}

function ensurePyWorker() {
  if (pyWorker && pyReadyPromise) return pyReadyPromise;

  pyWorker = new Worker(assetUrl('pyodide-worker.js'));
  pyReadyPromise = new Promise((resolve, reject) => {
    const id = msgSeq++;
    const timeout = setTimeout(() => {
      resetPyWorker();
      reject(new Error('Python runtime took too long to initialize. Please retry.'));
    }, 45000);

    const onMsg = (e) => {
      if (e.data?.id !== id) return;
      clearTimeout(timeout);
      pyWorker?.removeEventListener('message', onMsg);
      if (e.data.ok) resolve(pyWorker);
      else {
        resetPyWorker();
        reject(new Error(e.data.error || 'Failed to initialize Python WebAssembly runtime'));
      }
    };

    pyWorker.addEventListener('message', onMsg);
    pyWorker.addEventListener(
      'error',
      (err) => {
        clearTimeout(timeout);
        resetPyWorker();
        reject(new Error(err.message || 'Python worker failed to start'));
      },
      { once: true }
    );
    pyWorker.postMessage({ id, type: 'warmup' });
  });

  return pyReadyPromise;
}

async function runPythonInBrowser(code, input, timeoutMs = 4000) {
  const worker = await ensurePyWorker();
  return new Promise((resolve) => {
    const id = msgSeq++;
    const timer = setTimeout(() => {
      resetPyWorker();
      resolve({
        status: 'TLE',
        stdout: '',
        stderr: '',
        compileError: null,
        elapsedMs: timeoutMs,
      });
    }, timeoutMs);

    const onMsg = (e) => {
      if (e.data?.id !== id) return;
      clearTimeout(timer);
      worker.removeEventListener('message', onMsg);
      const { status, stdout, stderr, elapsedMs } = e.data;
      resolve({
        status,
        stdout: stdout || '',
        stderr: stderr || '',
        compileError: status === 'CE' ? stderr || 'Python SyntaxError' : null,
        elapsedMs: elapsedMs || 0,
      });
    };

    worker.addEventListener('message', onMsg);
    worker.postMessage({ id, type: 'run', code, input });
  });
}

// ============================================================================
// Wandbox Compiler Runner (C++17 & Java 21 on GitHub Pages)
// ============================================================================

async function runWandbox(language, code, input) {
  const start = performance.now();
  let payload;

  if (language === 'cpp') {
    payload = {
      compiler: 'gcc-13.2.0',
      options: 'c++17,optimize',
      code,
      stdin: input,
    };
  } else if (language === 'java') {
    // Wandbox saves Java source as prog.java, so strip "public " from the top-level class
    const adaptedCode = code.replace(/\bpublic\s+class\s+/g, 'class ');
    payload = {
      compiler: 'openjdk-jdk-21+35',
      code: adaptedCode,
      stdin: input,
    };
  } else {
    throw new Error(`Unsupported language: ${language}`);
  }

  const res = await fetch(WANDBOX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Remote compiler error (HTTP ${res.status}). Please try again.`);
  }

  const data = await res.json();
  const elapsedMs = Math.round(performance.now() - start);

  if (data.compiler_error) {
    return {
      status: 'CE',
      compileError: data.compiler_error || data.compiler_message,
      stdout: '',
      stderr: '',
      elapsedMs,
    };
  }

  if (data.signal && /KILL|XCPU|ALRM/i.test(data.signal)) {
    return {
      status: 'TLE',
      compileError: null,
      stdout: data.program_output || '',
      stderr: data.program_error || '',
      elapsedMs,
    };
  }

  if (String(data.status) !== '0') {
    return {
      status: 'RE',
      compileError: null,
      stdout: data.program_output || '',
      stderr: data.program_error || data.program_message || `Exited with status ${data.status}`,
      elapsedMs,
    };
  }

  return {
    status: 'OK',
    compileError: null,
    stdout: data.program_output || '',
    stderr: data.program_error || '',
    elapsedMs,
  };
}

// ============================================================================
// Unified Static Run & Judge API
// ============================================================================

export async function runInBrowser({ language, code, input, expectedOutput = null, limits }) {
  const timeoutMs =
    language === 'cpp'
      ? limits?.timeLimitCppMs || 2000
      : language === 'java'
        ? limits?.timeLimitJavaMs || 4000
        : limits?.timeLimitPythonMs || 4000;

  const exec =
    language === 'python'
      ? await runPythonInBrowser(code, input, timeoutMs)
      : await runWandbox(language, code, input);

  if (exec.status === 'CE' || exec.status === 'TLE' || exec.status === 'RE') {
    return {
      status: exec.status,
      compileError: exec.compileError,
      elapsedMs: exec.elapsedMs,
      stdout: exec.stdout,
      stderr: exec.stderr,
      matched: false,
    };
  }

  let status = 'OK';
  let matched = null;
  if (expectedOutput !== null && expectedOutput !== undefined && expectedOutput !== '') {
    matched = normalizeOutput(exec.stdout) === normalizeOutput(expectedOutput);
    status = matched ? 'AC' : 'WA';
  }

  return {
    status,
    matched,
    compileError: null,
    elapsedMs: exec.elapsedMs,
    stdout: exec.stdout,
    stderr: exec.stderr,
  };
}

export async function judgeInBrowser({ problemId, language, code }) {
  const problem = await fetchStaticProblem(problemId);
  const testCases = await loadStaticTestCases(problem);
  const timeoutMs =
    language === 'cpp'
      ? problem.limits?.timeLimitCppMs || 2000
      : language === 'java'
        ? problem.limits?.timeLimitJavaMs || 4000
        : problem.limits?.timeLimitPythonMs || 4000;

  const results = [];
  let passedCount = 0;
  let maxTimeMs = 0;
  let totalTimeMs = 0;
  let firstFailure = null;
  let compileError = null;

  for (const tc of testCases) {
    const exec =
      language === 'python'
        ? await runPythonInBrowser(code, tc.input, timeoutMs)
        : await runWandbox(language, code, tc.input);

    if (exec.status === 'CE') {
      compileError = exec.compileError;
      return {
        problemId,
        language,
        timestamp: new Date().toISOString(),
        verdict: 'CE',
        compileError,
        passedCount: 0,
        totalCount: testCases.length,
        maxTimeMs: 0,
        totalTimeMs: 0,
        timeLimitMs: timeoutMs,
        results: testCases.map((item) => ({
          index: item.index,
          isSample: item.isSample,
          status: 'CE',
          elapsedMs: 0,
        })),
      };
    }

    let status = 'AC';
    if (exec.status === 'TLE' || exec.status === 'RE') {
      status = exec.status;
    } else if (normalizeOutput(exec.stdout) !== normalizeOutput(tc.expected)) {
      status = 'WA';
    }

    if (status === 'AC') passedCount += 1;
    else if (!firstFailure) firstFailure = status;

    maxTimeMs = Math.max(maxTimeMs, exec.elapsedMs);
    totalTimeMs += exec.elapsedMs;

    results.push({
      index: tc.index,
      isSample: tc.isSample,
      status,
      elapsedMs: exec.elapsedMs,
      inputPreview: truncatePreview(tc.input, 450),
      expectedPreview: truncatePreview(tc.expected, 450),
      actualPreview: truncatePreview(exec.stdout, 450),
      stderr: exec.stderr ? truncatePreview(exec.stderr, 450).text : '',
    });
  }

  return {
    problemId,
    language,
    timestamp: new Date().toISOString(),
    verdict: passedCount === testCases.length ? 'AC' : firstFailure || 'WA',
    compileError: null,
    passedCount,
    totalCount: testCases.length,
    maxTimeMs,
    totalTimeMs,
    timeLimitMs: timeoutMs,
    results,
  };
}
