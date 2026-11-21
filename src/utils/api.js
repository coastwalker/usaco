import {
  fetchStaticProblem,
  fetchStaticProblems,
  judgeInBrowser,
  runInBrowser,
} from './browserRunner.js';

let backendCheckPromise = null;

async function hasLocalBackend() {
  if (!backendCheckPromise) {
    backendCheckPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);
      try {
        const res = await fetch('/api/health', { signal: controller.signal });
        if (!res.ok) return false;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return false;
        const data = await res.json();
        return Boolean(data && data.ok);
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    })();
  }
  return backendCheckPromise;
}

export async function fetchProblems() {
  if (await hasLocalBackend()) {
    const res = await fetch('/api/problems');
    if (!res.ok) throw new Error('Failed to load problems');
    const data = await res.json();
    return data.problems;
  }
  return fetchStaticProblems();
}

export async function fetchProblem(id) {
  if (await hasLocalBackend()) {
    const res = await fetch(`/api/problems/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to load problem details');
    const data = await res.json();
    return data.problem;
  }
  return fetchStaticProblem(id);
}

export async function runCode({ problemId, language, code, input, expectedOutput }) {
  if (await hasLocalBackend()) {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId, language, code, input, expectedOutput }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Run request failed');
    return data;
  }
  const problem = problemId ? await fetchStaticProblem(problemId).catch(() => null) : null;
  return runInBrowser({
    language,
    code,
    input,
    expectedOutput,
    limits: problem?.limits,
  });
}

export async function submitCode({ problemId, language, code }) {
  if (await hasLocalBackend()) {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId, language, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Submit request failed');
    return data;
  }
  return judgeInBrowser({ problemId, language, code });
}
