# USACO Arena

A LeetCode & USACO-style online competitive programming practice web app built for USACO preparation.

## Included Official USACO Bronze Practice Set (12 Problems · 139 Test Cases)

1. **Sleeping in Class** — 2022 Feb Bronze, Problem 1 ([cpid=1203](https://usaco.org/index.php?page=viewproblem2&cpid=1203)) · *Basic Complete Search* · 11 tests + interactive visualizer
2. **Cow College** — 2022 Dec Bronze, Problem 1 ([cpid=1251](https://usaco.org/index.php?page=viewproblem2&cpid=1251)) · *Introduction to Sorting* · 12 tests
3. **Do You Know Your ABCs?** — 2020 Dec Bronze, Problem 1 ([cpid=1059](https://usaco.org/index.php?page=viewproblem2&cpid=1059)) · *Introduction to Sorting* · 10 tests
4. **Herdle** — 2022 Jan Bronze, Problem 1 ([cpid=1179](https://usaco.org/index.php?page=viewproblem2&cpid=1179)) · *Simulation* · 11 tests
5. **Uddered but not Herd** — 2021 Jan Bronze, Problem 1 ([cpid=1083](https://usaco.org/index.php?page=viewproblem2&cpid=1083)) · *Simulation* · 10 tests
6. **Daisy Chains** — 2020 Dec Bronze, Problem 2 ([cpid=1060](https://usaco.org/index.php?page=viewproblem2&cpid=1060)) · *Basic Complete Search* · 10 tests
7. **Counting Liars** — 2022 US Open Bronze, Problem 2 ([cpid=1228](https://usaco.org/index.php?page=viewproblem2&cpid=1228)) · *Basic Complete Search* · 12 tests
8. **Even More Odd Photos** — 2021 Jan Bronze, Problem 2 ([cpid=1084](https://usaco.org/index.php?page=viewproblem2&cpid=1084)) · *Introduction to Greedy Algorithms* · 11 tests
9. **Just Stalling** — 2021 Jan Bronze, Problem 3 ([cpid=1085](https://usaco.org/index.php?page=viewproblem2&cpid=1085)) · *Introduction to Sorting* · 12 tests
10. **Leaders** — 2023 Jan Bronze, Problem 1 ([cpid=1275](https://usaco.org/index.php?page=viewproblem2&cpid=1275)) · *Ad Hoc Problems* · 17 tests
11. **Air Cownditioning II** — 2023 Jan Bronze, Problem 2 ([cpid=1276](https://usaco.org/index.php?page=viewproblem2&cpid=1276)) · *Complete Search with Recursion* · 11 tests
12. **Watching Mooloo** — 2023 Feb Bronze, Problem 3 ([cpid=1301](https://usaco.org/index.php?page=viewproblem2&cpid=1301)) · *Introduction to Greedy Algorithms* · 12 tests

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
