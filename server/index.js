import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getProblem, listProblems, loadTestCases } from './problems.js';
import { judgeAllTests, runCustomInput } from './runner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = Number.parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use(express.json({ limit: '512kb' }));

// Simple serialization queue so simultaneous runs don't contend on CPU timing
let runQueue = Promise.resolve();
function enqueue(task) {
  const next = runQueue.then(task, task);
  runQueue = next.catch(() => {});
  return next;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, languages: ['python', 'cpp', 'java'] });
});

app.get('/api/problems', async (_req, res) => {
  try {
    const problems = await listProblems();
    res.json({ problems });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load problems' });
  }
});

app.get('/api/problems/:id', async (req, res) => {
  try {
    const problem = await getProblem(req.params.id);
    res.json({ problem });
  } catch (err) {
    res.status(404).json({ error: `Problem "${req.params.id}" not found` });
  }
});

app.post('/api/run', async (req, res) => {
  const { problemId, language, code, input = '', expectedOutput = null } = req.body || {};

  if (!language || typeof code !== 'string') {
    return res.status(400).json({ error: 'Both language and code are required.' });
  }

  try {
    let limits = null;
    let fileIo = null;
    if (problemId) {
      const problem = await getProblem(problemId).catch(() => null);
      limits = problem?.limits || null;
      fileIo = problem?.fileIo || null;
    }

    const result = await enqueue(() =>
      runCustomInput({
        language,
        code,
        input: String(input ?? ''),
        expectedOutput,
        limits,
        fileIo,
      })
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Execution error' });
  }
});

app.post('/api/submit', async (req, res) => {
  const { problemId, language, code } = req.body || {};

  if (!problemId || !language || typeof code !== 'string') {
    return res.status(400).json({ error: 'problemId, language, and code are required.' });
  }

  try {
    const problem = await getProblem(problemId);
    const testCases = await loadTestCases(problemId);
    if (testCases.length === 0) {
      return res.status(400).json({ error: 'No official test cases found for this problem.' });
    }

    const result = await enqueue(() =>
      judgeAllTests({
        language,
        code,
        testCases,
        limits: problem.limits,
        fileIo: problem.fileIo || null,
      })
    );

    res.json({
      problemId,
      language,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Judging failed' });
  }
});

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`USACO Arena server listening on http://localhost:${PORT}`);
});
