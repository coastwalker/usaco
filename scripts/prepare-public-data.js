import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listProblems } from '../server/problems.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DATA = path.resolve(__dirname, '../data/problems');
const PUBLIC_DATA = path.resolve(__dirname, '../public/data');
const PUBLIC_PROBLEMS = path.join(PUBLIC_DATA, 'problems');

async function run() {
  await fs.rm(PUBLIC_DATA, { recursive: true, force: true });
  await fs.mkdir(PUBLIC_PROBLEMS, { recursive: true });

  const problems = await listProblems();
  await fs.writeFile(
    path.join(PUBLIC_DATA, 'problems.json'),
    JSON.stringify({ problems }, null, 2),
    'utf8'
  );

  for (const p of problems) {
    const srcDir = path.join(SRC_DATA, p.id);
    const dstDir = path.join(PUBLIC_PROBLEMS, p.id);
    await fs.cp(srcDir, dstDir, { recursive: true });

    // Also include testCount inside static problem.json for GitHub Pages mode
    const dstJsonPath = path.join(dstDir, 'problem.json');
    const raw = await fs.readFile(dstJsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    parsed.testCount = p.testCount;
    await fs.writeFile(dstJsonPath, JSON.stringify(parsed, null, 2), 'utf8');
  }

  console.log(`Prepared static problem data for ${problems.length} problem(s) in public/data/`);
}

run().catch((err) => {
  console.error('Failed to prepare public data:', err);
  process.exit(1);
});
