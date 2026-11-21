import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, '../dist/assets');

// Obfuscator.io / javascript-obfuscator configuration tailored for ES module app bundles
const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 5,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 1,
  target: 'browser',
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

async function run() {
  const files = await fs.readdir(ASSETS_DIR);
  const targets = files.filter((f) => f.endsWith('.js') && !f.startsWith('vendor-'));

  if (targets.length === 0) {
    console.warn('No app JS bundles found in dist/assets to obfuscate.');
    return;
  }

  for (const file of targets) {
    const fullPath = path.join(ASSETS_DIR, file);
    const original = await fs.readFile(fullPath, 'utf8');
    const obfuscated = JavaScriptObfuscator.obfuscate(original, OBFUSCATOR_OPTIONS).getObfuscatedCode();
    await fs.writeFile(fullPath, obfuscated, 'utf8');
    console.log(
      `Obfuscated ${file} (${(original.length / 1024).toFixed(1)} KB -> ${(obfuscated.length / 1024).toFixed(1)} KB)`
    );
  }
}

run().catch((err) => {
  console.error('Obfuscation failed:', err);
  process.exit(1);
});
