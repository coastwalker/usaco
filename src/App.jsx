import React, { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import ProblemPanel from './components/ProblemPanel.jsx';
import CodeEditor from './components/CodeEditor.jsx';
import ConsolePanel from './components/ConsolePanel.jsx';
import { fetchProblem, fetchProblems, runCode, submitCode } from './utils/api.js';
import { clearSession, getSavedSession } from './utils/auth.js';

const STORAGE_PREFIX = 'usaco-arena:v1:';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

export default function App() {
  const [session, setSession] = useState(() => getSavedSession());
  const [theme, setTheme] = useState(() => readJson('theme', 'light'));
  const [fontSize, setFontSize] = useState(() => readJson('fontSize', 14));
  const [problems, setProblems] = useState([]);
  const [activeProblemId, setActiveProblemId] = useState(null);
  const [activeProblem, setActiveProblem] = useState(null);

  const [language, setLanguage] = useState(() => readJson('language', 'python'));
  const [code, setCode] = useState('');

  // Console state
  const [consoleTab, setConsoleTab] = useState('testcase');
  const [inputMode, setInputMode] = useState('sample');
  const [customInput, setCustomInput] = useState('');
  const [customExpected, setCustomExpected] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [judgeResult, setJudgeResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Submissions & solved status
  const [submissionsByProblem, setSubmissionsByProblem] = useState(() =>
    readJson('submissions', {})
  );
  const [solvedIds, setSolvedIds] = useState(() => readJson('solved', {}));

  // Resizable split ratios
  const [leftPct, setLeftPct] = useState(46);
  const [editorPct, setEditorPct] = useState(58);
  const [dragging, setDragging] = useState(null);
  const workspaceRef = useRef(null);
  const rightColRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    writeJson('theme', theme);
  }, [theme]);

  useEffect(() => {
    writeJson('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    writeJson('language', language);
  }, [language]);

  // Load problem catalog after signing in
  useEffect(() => {
    if (!session) {
      document.title = 'Sign In — USACO Arena';
      return;
    }
    fetchProblems()
      .then((list) => {
        setProblems(list);
        if (list.length > 0 && !activeProblemId) {
          setActiveProblemId(list[0].id);
        }
      })
      .catch((err) => setErrorMessage(err.message));
  }, [session, activeProblemId]);

  // Load selected problem details
  useEffect(() => {
    if (!session || !activeProblemId) return;
    fetchProblem(activeProblemId)
      .then((prob) => {
        setActiveProblem(prob);
        setCustomInput(prob.statement.sampleInput);
        setCustomExpected(prob.statement.sampleOutput);
        setRunResult(null);
        setJudgeResult(null);
        setErrorMessage('');
        document.title = `${prob.title} — USACO Arena`;
      })
      .catch((err) => setErrorMessage(err.message));
  }, [activeProblemId]);

  // Sync saved draft or starter template whenever problem or language changes
  useEffect(() => {
    if (!activeProblem) return;
    const draftKey = `draft:${activeProblem.id}:${language}`;
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${draftKey}`);
    if (saved !== null) {
      setCode(saved);
    } else {
      setCode(activeProblem.starterCode?.[language] || '');
    }
  }, [activeProblem, language]);

  const handleCodeChange = useCallback(
    (nextCode) => {
      setCode(nextCode);
      if (activeProblem) {
        try {
          localStorage.setItem(
            `${STORAGE_PREFIX}draft:${activeProblem.id}:${language}`,
            nextCode
          );
        } catch {
          // ignore
        }
      }
    },
    [activeProblem, language]
  );

  const handleResetCode = useCallback(() => {
    if (!activeProblem) return;
    const starter = activeProblem.starterCode?.[language] || '';
    handleCodeChange(starter);
  }, [activeProblem, language, handleCodeChange]);

  const handleRun = useCallback(async () => {
    if (!activeProblem || isRunning || isSubmitting) return;
    setIsRunning(true);
    setErrorMessage('');
    setConsoleTab('run');

    const stdinText =
      inputMode === 'sample' ? activeProblem.statement.sampleInput : customInput;
    const expectedText =
      inputMode === 'sample'
        ? activeProblem.statement.sampleOutput
        : customExpected.trim() !== ''
          ? customExpected
          : null;

    try {
      const result = await runCode({
        problemId: activeProblem.id,
        language,
        code,
        input: stdinText,
        expectedOutput: expectedText,
      });
      setRunResult({
        ...result,
        mode: inputMode,
        expectedOutput: expectedText,
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to run code');
    } finally {
      setIsRunning(false);
    }
  }, [
    activeProblem,
    isRunning,
    isSubmitting,
    inputMode,
    customInput,
    customExpected,
    language,
    code,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!activeProblem || isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    setConsoleTab('judge');

    try {
      const result = await submitCode({
        problemId: activeProblem.id,
        language,
        code,
      });
      setJudgeResult(result);

      const entry = {
        id: `${Date.now()}`,
        timestamp: result.timestamp,
        language,
        verdict: result.verdict,
        passedCount: result.passedCount,
        totalCount: result.totalCount,
        maxTimeMs: result.maxTimeMs,
        code,
      };

      setSubmissionsByProblem((prev) => {
        const list = [entry, ...(prev[activeProblem.id] || [])].slice(0, 30);
        const next = { ...prev, [activeProblem.id]: list };
        writeJson('submissions', next);
        return next;
      });

      if (result.verdict === 'AC') {
        setSolvedIds((prev) => {
          const next = { ...prev, [activeProblem.id]: true };
          writeJson('solved', next);
          return next;
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit code');
    } finally {
      setIsSubmitting(false);
    }
  }, [activeProblem, isRunning, isSubmitting, language, code]);

  // Split-pane drag listeners
  useEffect(() => {
    if (!dragging) return undefined;

    const handleMove = (e) => {
      if (dragging === 'horizontal' && workspaceRef.current) {
        const rect = workspaceRef.current.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setLeftPct(Math.max(28, Math.min(68, pct)));
      } else if (dragging === 'vertical' && rightColRef.current) {
        const rect = rightColRef.current.getBoundingClientRect();
        const pct = ((e.clientY - rect.top) / rect.height) * 100;
        setEditorPct(Math.max(28, Math.min(76, pct)));
      }
    };

    const handleUp = () => setDragging(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = dragging === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging]);

  const handleLoadCaseToCustom = (input, expected) => {
    setInputMode('custom');
    setCustomInput(input);
    setCustomExpected(expected || '');
    setConsoleTab('testcase');
  };

  const handleLoadSubmissionCode = (subLang, subCode) => {
    setLanguage(subLang);
    setCode(subCode);
    if (activeProblem) {
      try {
        localStorage.setItem(
          `${STORAGE_PREFIX}draft:${activeProblem.id}:${subLang}`,
          subCode
        );
      } catch {
        // ignore
      }
    }
  };

  const handleSignOut = () => {
    clearSession();
    setSession(null);
  };

  if (!session) {
    return (
      <LoginScreen
        onAuthenticated={setSession}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />
    );
  }

  const currentSubmissions = activeProblem
    ? submissionsByProblem[activeProblem.id] || []
    : [];

  return (
    <div className="app-shell">
      <Header
        problems={problems}
        activeProblem={activeProblem}
        onSelectProblem={setActiveProblemId}
        isSolved={Boolean(activeProblem && solvedIds[activeProblem.id])}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        username={session.username}
        onSignOut={handleSignOut}
      />

      <main ref={workspaceRef} className="workspace">
        <div style={{ width: `${leftPct}%`, height: '100%', minWidth: 0 }}>
          <ProblemPanel
            problem={activeProblem}
            submissions={currentSubmissions}
            language={language}
            onUseSampleInput={handleLoadCaseToCustom}
            onLoadSubmissionCode={handleLoadSubmissionCode}
          />
        </div>

        <div
          className={`splitter-h ${dragging === 'horizontal' ? 'active' : ''}`}
          onMouseDown={() => setDragging('horizontal')}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize problem and editor panels"
        />

        <div ref={rightColRef} className="right-column">
          <div style={{ height: `${editorPct}%`, minHeight: 180, display: 'flex' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
              <CodeEditor
                language={language}
                onLanguageChange={setLanguage}
                code={code}
                onCodeChange={handleCodeChange}
                onResetCode={handleResetCode}
                onRun={handleRun}
                onSubmit={handleSubmit}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                theme={theme}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
                testCount={activeProblem?.testCount}
              />
            </div>
          </div>

          <div
            className={`splitter-v ${dragging === 'vertical' ? 'active' : ''}`}
            onMouseDown={() => setDragging('vertical')}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize editor and console panels"
          />

          <div style={{ flex: 1, minHeight: 160, display: 'flex' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
              <ConsolePanel
                activeTab={consoleTab}
                onTabChange={setConsoleTab}
                sampleInput={activeProblem?.statement?.sampleInput || ''}
                sampleOutput={activeProblem?.statement?.sampleOutput || ''}
                inputMode={inputMode}
                onInputModeChange={setInputMode}
                customInput={customInput}
                onCustomInputChange={setCustomInput}
                customExpected={customExpected}
                onCustomExpectedChange={setCustomExpected}
                runResult={runResult}
                judgeResult={judgeResult}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
                onLoadCaseToCustom={handleLoadCaseToCustom}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
