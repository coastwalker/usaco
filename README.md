# USACO Arena

A LeetCode & USACO-style online competitive programming practice web app built for USACO preparation.

## Included Problems

1. **Sleeping in Class** — USACO 2022 February Contest, Bronze, Problem 1 ([cpid=1203](https://usaco.org/index.php?page=viewproblem2&cpid=1203))
   - Includes all **11 official USACO test cases** (`1.in`–`11.in`, `1.out`–`11.out`)
   - Interactive **Class-Period Merge Visualizer** to explore the invariant total sum
   - Progressive collapsible hints + reference solutions in Python 3, C++17, and Java

## Features

- **Real Online Code Execution**: Write and run code in **Python 3**, **C++17 (`g++ -O2`)**, or **Java (`javac`/`java`)**
- **USACO-Style Judging**: Official numbered test-case grid (`*` AC, `x` WA, `t` TLE, `!` RE, `C` CE) with per-test runtime in milliseconds and authentic USACO time limits (2s C++, 4s Python/Java)
- **Custom Testcase Runner**: Run against official sample input or custom stdin with automatic expected-output comparison
- **IDE Experience**: CodeMirror 6 editor with syntax highlighting, auto-indent, keyboard shortcuts (`Ctrl/Cmd + Enter` to Run, `Ctrl/Cmd + Shift + Enter` to Submit), auto-saved drafts, practice stopwatch, and Light/Dark themes
- **Protected Access & Obfuscation**: Sign-in gate built with `javascript-obfuscator` (the engine behind Obfuscator.io) running automatically during `npm run build` via `scripts/obfuscate.js`
- **Dual-Mode Execution (Local + GitHub Pages)**: Automatically uses local `python3`/`g++`/`javac` when running the Express server, and seamlessly runs **Python 3 in-browser via Pyodide WebAssembly** plus **C++17 / Java 21 via Wandbox** when hosted statically on GitHub Pages

## Quick Start

### Prerequisites
- Node.js 20+
- Any of the supported USACO runtimes you want to use: `python3`, `g++`, `javac`/`java`

### Run Production Build
```bash
npm install
npm run build
npm start
```
Then open `http://localhost:3000`.

### Development Mode (Hot Reload)
```bash
npm run dev
```

## Adding More USACO Problems

Create a new folder under `data/problems/<problem-id>/` containing:
- `problem.json` (matching the schema in `data/problems/feb22-bronze-1/problem.json`)
- `tests/` containing `1.in`, `1.out`, `2.in`, `2.out`, ... (from USACO's official test data `.zip`)

The problem selector automatically picks up any new problem folders on restart.
