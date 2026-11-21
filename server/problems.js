import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROBLEMS_DIR = path.resolve(__dirname, '../data/problems');

export async function listProblems() {
  const entries = await fs.readdir(PROBLEMS_DIR, { withFileTypes: true });
  const problems = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const jsonPath = path.join(PROBLEMS_DIR, entry.name, 'problem.json');
    try {
      const raw = await fs.readFile(jsonPath, 'utf8');
      const data = JSON.parse(raw);
      const tests = await loadTestCaseMetadata(entry.name);
      problems.push({
        id: data.id,
        cpid: data.cpid,
        contest: data.contest,
        division: data.division,
        number: data.number,
        title: data.title,
        tags: data.tags || [],
        testCount: tests.length,
      });
    } catch {
      // Ignore folders without valid problem.json
    }
  }

  return problems.sort((a, b) => a.id.localeCompare(b.id));
}

export async function getProblem(id) {
  const safeId = path.basename(id);
  const problemDir = path.join(PROBLEMS_DIR, safeId);
  const jsonPath = path.join(problemDir, 'problem.json');
  const raw = await fs.readFile(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  const tests = await loadTestCaseMetadata(safeId);
  return {
    ...data,
    testCount: tests.length,
  };
}

export async function loadTestCaseMetadata(id) {
  const safeId = path.basename(id);
  const testsDir = path.join(PROBLEMS_DIR, safeId, 'tests');
  try {
    const files = await fs.readdir(testsDir);
    const inFiles = files
      .filter((f) => f.endsWith('.in'))
      .map((f) => ({
        num: Number.parseInt(f.replace(/\.in$/, ''), 10),
        inFile: f,
        outFile: f.replace(/\.in$/, '.out'),
      }))
      .filter((item) => Number.isFinite(item.num) && files.includes(item.outFile))
      .sort((a, b) => a.num - b.num);
    return inFiles;
  } catch {
    return [];
  }
}

export async function loadTestCases(id) {
  const safeId = path.basename(id);
  const testsDir = path.join(PROBLEMS_DIR, safeId, 'tests');
  const meta = await loadTestCaseMetadata(safeId);

  const loaded = await Promise.all(
    meta.map(async (item) => {
      const [input, expected] = await Promise.all([
        fs.readFile(path.join(testsDir, item.inFile), 'utf8'),
        fs.readFile(path.join(testsDir, item.outFile), 'utf8'),
      ]);
      return {
        index: item.num,
        isSample: item.num === 1,
        input,
        expected,
      };
    })
  );

  return loaded;
}
