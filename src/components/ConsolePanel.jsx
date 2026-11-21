import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, FileCode2, Play, Terminal } from 'lucide-react';

const VERDICT_META = {
  AC: { symbol: '*', label: 'Accepted' },
  OK: { symbol: '✓', label: 'Executed' },
  WA: { symbol: 'x', label: 'Wrong Answer' },
  TLE: { symbol: 't', label: 'Time Limit Exceeded' },
  RE: { symbol: '!', label: 'Runtime Error' },
  CE: { symbol: 'C', label: 'Compilation Error' },
  OLE: { symbol: 'O', label: 'Output Limit Exceeded' },
};

export default function ConsolePanel({
  activeTab,
  onTabChange,
  sampleInput,
  sampleOutput,
  inputMode,
  onInputModeChange,
  customInput,
  onCustomInputChange,
  customExpected,
  onCustomExpectedChange,
  runResult,
  judgeResult,
  isRunning,
  isSubmitting,
  errorMessage,
  onLoadCaseToCustom,
}) {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  useEffect(() => {
    if (!judgeResult?.results?.length) return;
    const firstFail = judgeResult.results.findIndex((r) => r.status !== 'AC');
    setSelectedCaseIdx(firstFail >= 0 ? firstFail : 0);
  }, [judgeResult]);

  const selectedCase = judgeResult?.results?.[selectedCaseIdx] || null;

  return (
    <section className="pane console-pane">
      <div className="pane-tabs">
        <div className="tab-list" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'testcase'}
            className={`tab-btn ${activeTab === 'testcase' ? 'active' : ''}`}
            onClick={() => onTabChange('testcase')}
          >
            <FileCode2 size={14} />
            Testcase
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'run'}
            className={`tab-btn ${activeTab === 'run' ? 'active' : ''}`}
            onClick={() => onTabChange('run')}
          >
            <Terminal size={14} />
            Run Result
            {runResult && (
              <span className={`verdict-badge verdict-${runResult.status}`}>
                {runResult.status}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'judge'}
            className={`tab-btn ${activeTab === 'judge' ? 'active' : ''}`}
            onClick={() => onTabChange('judge')}
          >
            <Award size={14} />
            USACO Judge
            {judgeResult && (
              <span className={`verdict-badge verdict-${judgeResult.verdict}`}>
                {judgeResult.passedCount}/{judgeResult.totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="console-body">
        {errorMessage && (
          <pre className="error-pre" style={{ marginBottom: 12 }}>
            {errorMessage}
          </pre>
        )}

        {activeTab === 'testcase' && (
          <div>
            <div className="testcase-controls">
              <div className="pill-switch" role="group" aria-label="Testcase source">
                <button
                  type="button"
                  className={`pill-option ${inputMode === 'sample' ? 'active' : ''}`}
                  onClick={() => onInputModeChange('sample')}
                >
                  Official Sample
                </button>
                <button
                  type="button"
                  className={`pill-option ${inputMode === 'custom' ? 'active' : ''}`}
                  onClick={() => onInputModeChange('custom')}
                >
                  Custom Input
                </button>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Click <strong>Run</strong> to test your code with this stdin
              </span>
            </div>

            {inputMode === 'sample' ? (
              <div className="io-editor-grid">
                <div className="io-field">
                  <label>Sample Input (stdin)</label>
                  <pre className="io-pre io-box">{sampleInput}</pre>
                </div>
                <div className="io-field">
                  <label>Expected Output (stdout)</label>
                  <pre className="io-pre io-box">{sampleOutput}</pre>
                </div>
              </div>
            ) : (
              <div className="io-editor-grid">
                <div className="io-field">
                  <label htmlFor="custom-stdin">Custom Input (stdin)</label>
                  <textarea
                    id="custom-stdin"
                    className="io-textarea"
                    value={customInput}
                    onChange={(e) => onCustomInputChange(e.target.value)}
                    placeholder="Paste custom input here…"
                    spellCheck={false}
                  />
                </div>
                <div className="io-field">
                  <label htmlFor="custom-expected">Expected Output (optional)</label>
                  <textarea
                    id="custom-expected"
                    className="io-textarea"
                    value={customExpected}
                    onChange={(e) => onCustomExpectedChange(e.target.value)}
                    placeholder="Optional: paste expected output to compare automatically"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'run' && (
          <div>
            {isRunning ? (
              <div className="running-banner">
                <span className="spinner" />
                <span>Compiling and running your code…</span>
              </div>
            ) : !runResult ? (
              <div className="empty-state">
                Click <strong>Run</strong> (or press <code>Ctrl/Cmd + Enter</code>) to test your
                code against the sample or custom input.
              </div>
            ) : (
              <div>
                <div className="judge-summary">
                  <div className="judge-summary-left">
                    <span className={`verdict-badge verdict-${runResult.status}`}>
                      {runResult.status}
                    </span>
                    <span className="judge-score">
                      {VERDICT_META[runResult.status]?.label || runResult.status}
                    </span>
                  </div>
                  <div className="judge-metrics">
                    <span>Runtime: {runResult.elapsedMs} ms</span>
                    <span>Mode: {runResult.mode === 'sample' ? 'Sample' : 'Custom'}</span>
                  </div>
                </div>

                {runResult.compileError ? (
                  <div>
                    <div className="section-heading" style={{ marginTop: 4 }}>
                      Compiler Diagnostics
                    </div>
                    <pre className="error-pre">{runResult.compileError}</pre>
                  </div>
                ) : (
                  <div className="diff-grid">
                    <div className="io-box">
                      <div className="io-box-header">
                        <span>Your Output (stdout)</span>
                      </div>
                      <pre className="io-pre">
                        {runResult.stdout !== '' ? runResult.stdout : '(empty output)'}
                      </pre>
                    </div>

                    {runResult.expectedOutput ? (
                      <div className="io-box">
                        <div className="io-box-header">
                          <span>Expected Output</span>
                        </div>
                        <pre className="io-pre">{runResult.expectedOutput}</pre>
                      </div>
                    ) : null}

                    {runResult.stderr ? (
                      <div className="io-box">
                        <div className="io-box-header">
                          <span>Standard Error (stderr)</span>
                        </div>
                        <pre className="error-pre" style={{ border: 'none', borderRadius: 0 }}>
                          {runResult.stderr}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'judge' && (
          <div>
            {isSubmitting ? (
              <div className="running-banner">
                <span className="spinner" />
                <span>Judging against all official USACO test cases…</span>
              </div>
            ) : !judgeResult ? (
              <div className="empty-state">
                Click <strong>Submit</strong> to grade your solution against every official USACO
                test case (including large stress tests up to N = 10⁵).
              </div>
            ) : (
              <div>
                <div className="judge-summary">
                  <div className="judge-summary-left">
                    <span className={`verdict-badge verdict-${judgeResult.verdict}`}>
                      {judgeResult.verdict}
                    </span>
                    <span className="judge-score">
                      {judgeResult.verdict === 'AC' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={16} style={{ color: 'var(--ac-solid)' }} />
                          All {judgeResult.totalCount} Official Test Cases Passed!
                        </span>
                      ) : (
                        `${judgeResult.passedCount} / ${judgeResult.totalCount} Test Cases Passed`
                      )}
                    </span>
                  </div>
                  <div className="judge-metrics">
                    <span>Max: {judgeResult.maxTimeMs} ms</span>
                    <span>Total: {judgeResult.totalTimeMs} ms</span>
                    {judgeResult.timeLimitMs && <span>Limit: {judgeResult.timeLimitMs} ms</span>}
                  </div>
                </div>

                {judgeResult.compileError ? (
                  <pre className="error-pre">{judgeResult.compileError}</pre>
                ) : (
                  <>
                    <div className="usaco-grid" role="list" aria-label="USACO test case verdicts">
                      {judgeResult.results.map((tc, idx) => {
                        const meta = VERDICT_META[tc.status] || { symbol: '?' };
                        return (
                          <button
                            key={tc.index}
                            type="button"
                            className={`usaco-box status-${tc.status} ${
                              selectedCaseIdx === idx ? 'selected' : ''
                            }`}
                            onClick={() => setSelectedCaseIdx(idx)}
                            title={`Test #${tc.index}: ${meta.label} (${tc.elapsedMs} ms)`}
                          >
                            <span className="usaco-box-num">
                              {tc.isSample ? `#${tc.index} S` : `#${tc.index}`}
                            </span>
                            <span className="usaco-box-symbol">{meta.symbol}</span>
                            <span className="usaco-box-time">{tc.elapsedMs}ms</span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedCase && (
                      <div className="case-detail-card">
                        <div className="case-detail-head">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong>
                              Test Case #{selectedCase.index}
                              {selectedCase.isSample ? ' (Sample)' : ''}
                            </strong>
                            <span className={`verdict-badge verdict-${selectedCase.status}`}>
                              {selectedCase.status} —{' '}
                              {VERDICT_META[selectedCase.status]?.label || selectedCase.status}
                            </span>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 12,
                                color: 'var(--text-muted)',
                              }}
                            >
                              {selectedCase.elapsedMs} ms
                            </span>
                          </div>

                          {selectedCase.inputPreview && !selectedCase.inputPreview.truncated && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                onLoadCaseToCustom(
                                  selectedCase.inputPreview.text,
                                  selectedCase.expectedPreview?.text || ''
                                )
                              }
                            >
                              <Play size={12} />
                              Debug in Custom Input
                            </button>
                          )}
                        </div>

                        <div className="diff-grid">
                          {selectedCase.inputPreview && (
                            <div className="io-box">
                              <div className="io-box-header">
                                <span>Input Preview</span>
                              </div>
                              <pre className="io-pre">{selectedCase.inputPreview.text}</pre>
                            </div>
                          )}

                          {selectedCase.expectedPreview && (
                            <div className="io-box">
                              <div className="io-box-header">
                                <span>Expected Output</span>
                              </div>
                              <pre className="io-pre">{selectedCase.expectedPreview.text}</pre>
                            </div>
                          )}

                          {selectedCase.actualPreview && (
                            <div className="io-box">
                              <div className="io-box-header">
                                <span>Your Output</span>
                              </div>
                              <pre className="io-pre">
                                {selectedCase.actualPreview.text !== ''
                                  ? selectedCase.actualPreview.text
                                  : '(empty output)'}
                              </pre>
                            </div>
                          )}
                        </div>

                        {selectedCase.stderr && (
                          <div style={{ marginTop: 10 }}>
                            <div className="section-heading" style={{ marginTop: 4 }}>
                              stderr
                            </div>
                            <pre className="error-pre">{selectedCase.stderr}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
