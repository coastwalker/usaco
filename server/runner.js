import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const MAX_OUTPUT_BYTES = 2 * 1024 * 1024; // 2 MB cap
const COMPILE_TIMEOUT_MS = 12000;

export function normalizeOutput(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trimEnd();
}

export function truncatePreview(text, maxChars = 600) {
  const str = String(text ?? '');
  if (str.length <= maxChars) return { text: str, truncated: false, totalChars: str.length };
  return {
    text: `${str.slice(0, maxChars)}\n… (${(str.length - maxChars).toLocaleString()} more characters)`,
    truncated: true,
    totalChars: str.length,
  };
}

function runProcess(command, args, { cwd, input = '', timeoutMs = 4000 }) {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const child = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true,
    });

    let stdout = '';
    let stderr = '';
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let outputExceeded = false;
    let timedOut = false;
    let settled = false;

    const killTree = () => {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore
        }
      }
    };

    const timer = setTimeout(() => {
      timedOut = true;
      killTree();
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      if (stdoutBytes + chunk.length > MAX_OUTPUT_BYTES) {
        outputExceeded = true;
        killTree();
        return;
      }
      stdoutBytes += chunk.length;
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      if (stderrBytes + chunk.length > MAX_OUTPUT_BYTES) {
        return;
      }
      stderrBytes += chunk.length;
      stderr += chunk.toString('utf8');
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
      resolve({
        code: -1,
        signal: null,
        stdout,
        stderr: err.message,
        timedOut: false,
        outputExceeded: false,
        elapsedMs: Math.round(elapsedMs),
      });
    });

    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
      resolve({
        code,
        signal,
        stdout,
        stderr,
        timedOut,
        outputExceeded,
        elapsedMs: Math.round(elapsedMs),
      });
    });

    if (child.stdin) {
      child.stdin.on('error', () => {
        // Process may close stdin early
      });
      child.stdin.end(input);
    }
  });
}

async function prepareExecution(language, code, workDir) {
  if (language === 'python') {
    const filePath = path.join(workDir, 'solution.py');
    await fs.writeFile(filePath, code, 'utf8');
    return {
      ok: true,
      command: 'python3',
      args: [filePath],
      defaultTimeoutMs: 4000,
    };
  }

  if (language === 'cpp') {
    const srcPath = path.join(workDir, 'solution.cpp');
    const binPath = path.join(workDir, 'solution');
    await fs.writeFile(srcPath, code, 'utf8');
    const compile = await runProcess(
      'g++',
      ['-O2', '-std=c++17', '-Wall', '-Wextra', srcPath, '-o', binPath],
      { cwd: workDir, timeoutMs: COMPILE_TIMEOUT_MS }
    );
    if (compile.timedOut) {
      return { ok: false, compileError: 'Compilation timed out after 12 seconds.' };
    }
    if (compile.code !== 0) {
      return {
        ok: false,
        compileError: compile.stderr || compile.stdout || 'C++ compilation failed.',
      };
    }
    return {
      ok: true,
      command: binPath,
      args: [],
      defaultTimeoutMs: 2000,
    };
  }

  if (language === 'java') {
    const classMatch = code.match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
    const className = classMatch ? classMatch[1] : 'Main';
    const srcPath = path.join(workDir, `${className}.java`);
    await fs.writeFile(srcPath, code, 'utf8');
    const compile = await runProcess('javac', [srcPath], {
      cwd: workDir,
      timeoutMs: COMPILE_TIMEOUT_MS,
    });
    if (compile.timedOut) {
      return { ok: false, compileError: 'Compilation timed out after 12 seconds.' };
    }
    if (compile.code !== 0) {
      return {
        ok: false,
        compileError: compile.stderr || compile.stdout || 'Java compilation failed.',
      };
    }
    return {
      ok: true,
      command: 'java',
      args: ['-Xmx256m', '-cp', workDir, className],
      defaultTimeoutMs: 4000,
    };
  }

  return { ok: false, compileError: `Unsupported language: ${language}` };
}

function resolveTimeLimit(language, limits) {
  if (!limits) {
    return language === 'cpp' ? 2000 : 4000;
  }
  if (language === 'cpp') return limits.timeLimitCppMs || 2000;
  if (language === 'java') return limits.timeLimitJavaMs || 4000;
  return limits.timeLimitPythonMs || 4000;
}

export async function runCustomInput({ language, code, input, expectedOutput = null, limits }) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'usaco-run-'));
  try {
    const prepared = await prepareExecution(language, code, workDir);
    if (!prepared.ok) {
      return {
        status: 'CE',
        compileError: prepared.compileError,
        elapsedMs: 0,
        stdout: '',
        stderr: '',
        matched: false,
      };
    }

    const timeoutMs = resolveTimeLimit(language, limits);
    const result = await runProcess(prepared.command, prepared.args, {
      cwd: workDir,
      input,
      timeoutMs,
    });

    if (result.timedOut) {
      return {
        status: 'TLE',
        elapsedMs: timeoutMs,
        stdout: result.stdout,
        stderr: result.stderr,
        matched: false,
      };
    }

    if (result.outputExceeded) {
      return {
        status: 'OLE',
        elapsedMs: result.elapsedMs,
        stdout: result.stdout,
        stderr: 'Output exceeded 2 MB limit.',
        matched: false,
      };
    }

    if (result.code !== 0) {
      return {
        status: 'RE',
        exitCode: result.code,
        signal: result.signal,
        elapsedMs: result.elapsedMs,
        stdout: result.stdout,
        stderr: result.stderr,
        matched: false,
      };
    }

    let status = 'OK';
    let matched = null;
    if (expectedOutput !== null && expectedOutput !== undefined && expectedOutput !== '') {
      matched = normalizeOutput(result.stdout) === normalizeOutput(expectedOutput);
      status = matched ? 'AC' : 'WA';
    }

    return {
      status,
      matched,
      elapsedMs: result.elapsedMs,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

export async function judgeAllTests({ language, code, testCases, limits }) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'usaco-judge-'));
  try {
    const prepared = await prepareExecution(language, code, workDir);
    if (!prepared.ok) {
      return {
        verdict: 'CE',
        compileError: prepared.compileError,
        passedCount: 0,
        totalCount: testCases.length,
        maxTimeMs: 0,
        totalTimeMs: 0,
        results: testCases.map((tc) => ({
          index: tc.index,
          isSample: tc.isSample,
          status: 'CE',
          elapsedMs: 0,
        })),
      };
    }

    const timeoutMs = resolveTimeLimit(language, limits);
    const results = [];
    let passedCount = 0;
    let maxTimeMs = 0;
    let totalTimeMs = 0;
    let firstFailure = null;

    for (const tc of testCases) {
      const execResult = await runProcess(prepared.command, prepared.args, {
        cwd: workDir,
        input: tc.input,
        timeoutMs,
      });

      let status = 'AC';
      if (execResult.timedOut) {
        status = 'TLE';
      } else if (execResult.outputExceeded) {
        status = 'OLE';
      } else if (execResult.code !== 0) {
        status = 'RE';
      } else if (normalizeOutput(execResult.stdout) !== normalizeOutput(tc.expected)) {
        status = 'WA';
      }

      const elapsedMs = execResult.timedOut ? timeoutMs : execResult.elapsedMs;
      if (status === 'AC') passedCount += 1;
      else if (!firstFailure) firstFailure = status;

      maxTimeMs = Math.max(maxTimeMs, elapsedMs);
      totalTimeMs += elapsedMs;

      results.push({
        index: tc.index,
        isSample: tc.isSample,
        status,
        elapsedMs,
        inputPreview: truncatePreview(tc.input, 450),
        expectedPreview: truncatePreview(tc.expected, 450),
        actualPreview: truncatePreview(execResult.stdout, 450),
        stderr: execResult.stderr ? truncatePreview(execResult.stderr, 450).text : '',
      });
    }

    return {
      verdict: passedCount === testCases.length ? 'AC' : firstFailure || 'WA',
      compileError: null,
      passedCount,
      totalCount: testCases.length,
      maxTimeMs,
      totalTimeMs,
      timeLimitMs: timeoutMs,
      results,
    };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
