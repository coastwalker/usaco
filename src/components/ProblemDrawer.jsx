import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, ExternalLink, Search, X } from 'lucide-react';

export default function ProblemDrawer({
  open,
  onClose,
  problems,
  activeProblemId,
  solvedIds,
  onSelectProblem,
}) {
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  const modules = useMemo(() => {
    const set = new Set();
    for (const p of problems) {
      if (p.guideModule) set.add(p.guideModule);
    }
    return ['All', ...Array.from(set)];
  }, [problems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      if (moduleFilter !== 'All' && p.guideModule !== moduleFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.contest.toLowerCase().includes(q) ||
        (p.guideModule && p.guideModule.toLowerCase().includes(q)) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [problems, query, moduleFilter]);

  if (!open) return null;

  const solvedCount = problems.filter((p) => solvedIds[p.id]).length;
  const pct = problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0;

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="problem-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="USACO Problem List"
      >
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title">USACO Practice Set</h2>
            <div className="drawer-subtitle">
              Official USACO Bronze & Silver-Bridge Problems
            </div>
          </div>
          <button
            type="button"
            className="icon-btn bordered"
            onClick={onClose}
            aria-label="Close problem list"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-progress-box">
          <div className="drawer-progress-top">
            <span>Progress</span>
            <strong>
              {solvedCount} / {problems.length} Solved ({pct}%)
            </strong>
          </div>
          <div className="drawer-progress-track">
            <div className="drawer-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="drawer-filters">
          <div className="drawer-search-wrap">
            <Search size={14} className="drawer-search-icon" />
            <input
              type="text"
              className="drawer-search-input"
              placeholder="Search title, contest, or topic…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="drawer-module-pills">
            {modules.map((mod) => (
              <button
                key={mod}
                type="button"
                className={`module-pill ${moduleFilter === mod ? 'active' : ''}`}
                onClick={() => setModuleFilter(mod)}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        <div className="drawer-list">
          {filtered.map((p) => {
            const solved = Boolean(solvedIds[p.id]);
            const active = p.id === activeProblemId;
            return (
              <button
                key={p.id}
                type="button"
                className={`drawer-item ${active ? 'active' : ''}`}
                onClick={() => {
                  onSelectProblem(p.id);
                  onClose();
                }}
              >
                <div className="drawer-item-status">
                  {solved ? (
                    <CheckCircle2 size={17} style={{ color: 'var(--ac-solid)' }} />
                  ) : (
                    <Circle size={17} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                  )}
                </div>

                <div className="drawer-item-main">
                  <div className="drawer-item-top">
                    <span className="drawer-item-order">#{p.order}</span>
                    <span className="drawer-item-title">{p.title}</span>
                    {p.division && p.division !== 'Bronze' && (
                      <span className={`division-badge division-${p.division.toLowerCase()}`}>
                        {p.division}
                      </span>
                    )}
                    <span className={`diff-badge diff-${(p.difficulty || 'Normal').toLowerCase()}`}>
                      {p.difficulty || 'Normal'}
                    </span>
                    {p.recommendedTag && (
                      <span className="recommended-chip">{p.recommendedTag}</span>
                    )}
                  </div>

                  <div className="drawer-item-meta">
                    <span>
                      {p.contest.replace('USACO ', '').replace(' Contest', '')} • Prob {p.number}
                    </span>
                    {p.guideModule && (
                      <>
                        <span>•</span>
                        <span className="drawer-guide-tag">{p.guideModule}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{p.testCount} tests</span>
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="empty-state">No problems match "{query}".</div>
          )}
        </div>

        <div className="drawer-footer">
          <a
            href="https://usaco.guide/bronze"
            target="_blank"
            rel="noreferrer"
            className="drawer-guide-link"
          >
            <span>Explore Full USACO Guide Bronze Roadmap</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </aside>
    </div>
  );
}
