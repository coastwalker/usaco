import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  GraduationCap,
  History,
  Lightbulb,
  Sliders,
} from 'lucide-react';
import SleepVisualizer from './SleepVisualizer.jsx';

export default function ProblemPanel({
  problem,
  submissions,
  language,
  onUseSampleInput,
  onLoadSubmissionCode,
}) {
  const [activeTab, setActiveTab] = useState('description');
  const [copiedKey, setCopiedKey] = useState('');
  const [revealedHints, setRevealedHints] = useState({});
  const [showSolution, setShowSolution] = useState(false);

  // Reset tab and spoilers when switching problems
  useEffect(() => {
    setActiveTab('description');
    setRevealedHints({});
    setShowSolution(false);
  }, [problem?.id]);

  if (!problem) {
    return (
      <section className="pane left-pane">
        <div className="empty-state">Loading USACO problem…</div>
      </section>
    );
  }

  const copyText = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1600);
    } catch {
      // Clipboard may be restricted
    }
  };

  const toggleHint = (level) => {
    setRevealedHints((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  const solutionCode =
    problem.editorial?.solutions?.[language] || problem.editorial?.solutions?.python || '';

  return (
    <section className="pane left-pane">
      <div className="pane-tabs">
        <div className="tab-list" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'description'}
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            <BookOpen size={14} />
            Description
          </button>

          {problem.visualizer === 'sleeping-in-class' && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'visualizer'}
              className={`tab-btn ${activeTab === 'visualizer' ? 'active' : ''}`}
              onClick={() => setActiveTab('visualizer')}
            >
              <Sliders size={14} />
              Visualizer
            </button>
          )}

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'hints'}
            className={`tab-btn ${activeTab === 'hints' ? 'active' : ''}`}
            onClick={() => setActiveTab('hints')}
          >
            <Lightbulb size={14} />
            Hints
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'submissions'}
            className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            <History size={14} />
            Submissions
            {submissions.length > 0 && (
              <span className="tab-count">{submissions.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="pane-body">
        {activeTab === 'description' && (
          <article className="prose">
            <div className="problem-header">
              <div className="problem-meta-row">
                <span>{problem.contest}</span>
                <span>•</span>
                <span>Problem {problem.number}</span>
                <span>•</span>
                <span>{problem.testCount} Official Test Cases</span>
                {problem.difficulty && (
                  <span
                    className={`diff-badge diff-${problem.difficulty.toLowerCase()}`}
                  >
                    {problem.difficulty}
                  </span>
                )}
                {problem.recommendedTag && (
                  <span className="recommended-chip">{problem.recommendedTag}</span>
                )}
              </div>

              <h1 className="problem-title">{problem.title}</h1>

              {(problem.guideUrl || problem.resultsUrl || problem.editorialUrl) && (
                <div className="resource-links-row">
                  {problem.guideUrl && (
                    <a
                      href={problem.guideUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="resource-chip"
                    >
                      <GraduationCap size={13} />
                      <span>USACO Guide: {problem.guideModule || 'Bronze'}</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                  {problem.resultsUrl && (
                    <a
                      href={problem.resultsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="resource-chip"
                    >
                      <span>Contest Results</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                  {problem.editorialUrl && (
                    <a
                      href={problem.editorialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="resource-chip"
                    >
                      <span>Official USACO Editorial</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              )}

              <div className="limits-strip">
                <span className="limit-chip">
                  C++ Time: <strong>{(problem.limits.timeLimitCppMs / 1000).toFixed(0)}s</strong>
                </span>
                <span className="limit-chip">
                  Python / Java Time:{' '}
                  <strong>{(problem.limits.timeLimitPythonMs / 1000).toFixed(0)}s</strong>
                </span>
                <span className="limit-chip">
                  Memory: <strong>{problem.limits.memoryLimitMb} MB</strong>
                </span>
                <span className="limit-chip">
                  I/O:{' '}
                  <strong>
                    {problem.fileIo
                      ? `${problem.fileIo.in} / .out or stdin`
                      : 'stdin / stdout'}
                  </strong>
                </span>
              </div>
            </div>

            {problem.statement.paragraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}

            <h2 className="section-heading">Input Format (stdin)</h2>
            {problem.statement.inputFormat.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}

            <h2 className="section-heading">Output Format (stdout)</h2>
            {problem.statement.outputFormat.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}

            <h2 className="section-heading">
              {problem.statement.additionalSamples?.length ? 'Sample Test Case 1' : 'Sample Test Case'}
            </h2>
            <div className="io-grid">
              <div className="io-box">
                <div className="io-box-header">
                  <span>Sample Input</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      className="icon-btn compact"
                      onClick={() =>
                        onUseSampleInput(
                          problem.statement.sampleInput,
                          problem.statement.sampleOutput
                        )
                      }
                      title="Load sample into Testcase runner"
                    >
                      Try
                    </button>
                    <button
                      type="button"
                      className="icon-btn compact"
                      onClick={() => copyText('sample-in', problem.statement.sampleInput)}
                      aria-label="Copy sample input"
                    >
                      {copiedKey === 'sample-in' ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <pre className="io-pre">{problem.statement.sampleInput}</pre>
              </div>

              <div className="io-box">
                <div className="io-box-header">
                  <span>Sample Output</span>
                  <button
                    type="button"
                    className="icon-btn compact"
                    onClick={() => copyText('sample-out', problem.statement.sampleOutput)}
                    aria-label="Copy sample output"
                  >
                    {copiedKey === 'sample-out' ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
                <pre className="io-pre">{problem.statement.sampleOutput}</pre>
              </div>
            </div>

            {problem.statement.sampleExplanation?.length > 0 && (
              <>
                <h2 className="section-heading">Explanation</h2>
                <div className="explanation-list">
                  {problem.statement.sampleExplanation.map((item, idx) => (
                    <div key={idx} className="explanation-card">
                      <div className="explanation-title">{item.title}</div>
                      <div className="explanation-detail">{item.detail}</div>
                      <div className="explanation-steps">{item.steps}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {problem.statement.additionalSamples?.map((extra, sIdx) => (
              <div key={sIdx} style={{ marginTop: 18 }}>
                <h2 className="section-heading">Sample Test Case {sIdx + 2}</h2>
                <div className="io-grid">
                  <div className="io-box">
                    <div className="io-box-header">
                      <span>Sample Input {sIdx + 2}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="icon-btn compact"
                          onClick={() => onUseSampleInput(extra.input, extra.output)}
                          title="Load sample into Testcase runner"
                        >
                          Try
                        </button>
                        <button
                          type="button"
                          className="icon-btn compact"
                          onClick={() => copyText(`extra-in-${sIdx}`, extra.input)}
                          aria-label="Copy sample input"
                        >
                          {copiedKey === `extra-in-${sIdx}` ? (
                            <Check size={13} />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="io-pre">{extra.input}</pre>
                  </div>

                  <div className="io-box">
                    <div className="io-box-header">
                      <span>Sample Output {sIdx + 2}</span>
                      <button
                        type="button"
                        className="icon-btn compact"
                        onClick={() => copyText(`extra-out-${sIdx}`, extra.output)}
                        aria-label="Copy sample output"
                      >
                        {copiedKey === `extra-out-${sIdx}` ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                    <pre className="io-pre">{extra.output}</pre>
                  </div>
                </div>
                {extra.explanation && (
                  <div className="explanation-card">
                    <div className="explanation-detail" style={{ marginBottom: 0 }}>
                      {extra.explanation}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="tags-row">
              {problem.tags?.map((tag) => (
                <span key={tag} className="topic-tag">
                  {tag}
                </span>
              ))}
              {problem.credits && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  Problem credits: {problem.credits}
                </span>
              )}
            </div>
          </article>
        )}

        {activeTab === 'visualizer' && <SleepVisualizer />}

        {activeTab === 'hints' && (
          <div>
            {problem.whyItMatters && (
              <div className="why-matters-box">
                <div className="why-matters-title">Why This Problem Matters</div>
                <p className="why-matters-body">{problem.whyItMatters}</p>
              </div>
            )}
            <p className="viz-intro" style={{ marginBottom: 14 }}>
              Stuck on <strong>{problem.title}</strong>? Reveal one hint at a time so you can
              still discover the key insight yourself!
            </p>
            <div className="hint-list">
              {problem.hints?.map((hint) => {
                const open = !!revealedHints[hint.level];
                return (
                  <div key={hint.level} className="hint-card">
                    <button
                      type="button"
                      className="hint-toggle"
                      onClick={() => toggleHint(hint.level)}
                    >
                      <span>
                        Hint {hint.level}: {hint.title}
                      </span>
                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {open && <div className="hint-body">{hint.body}</div>}
                  </div>
                );
              })}
            </div>

            {problem.editorial && (
              <div className="editorial-box">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Official Reference Solution</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      Only peek after trying your own implementation!
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowSolution((s) => !s)}
                  >
                    <Eye size={14} />
                    {showSolution ? 'Hide Solution' : 'Reveal Solution'}
                  </button>
                </div>

                {showSolution && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '0 0 8px' }}>
                      {problem.editorial.summary}
                    </p>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {problem.editorial.complexity}
                    </div>
                    <pre className="editorial-code">{solutionCode}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div>
            {submissions.length === 0 ? (
              <div className="empty-state">
                No submissions yet for <strong>{problem.title}</strong>.
                <br />
                Write your solution on the right and click <strong>Submit</strong> to test against
                all {problem.testCount} official USACO test cases!
              </div>
            ) : (
              <div className="submission-list">
                {submissions.map((sub) => (
                  <div key={sub.id} className="submission-row">
                    <div className="submission-meta">
                      <div className="submission-top">
                        <span className={`verdict-badge verdict-${sub.verdict}`}>
                          {sub.verdict}
                        </span>
                        <strong style={{ fontSize: 13.5 }}>
                          {sub.passedCount} / {sub.totalCount} passed
                        </strong>
                        <span className="topic-tag">{sub.language.toUpperCase()}</span>
                      </div>
                      <div className="submission-sub">
                        Max {sub.maxTimeMs} ms • {new Date(sub.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onLoadSubmissionCode(sub.language, sub.code)}
                    >
                      Load Code
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
