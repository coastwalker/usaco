import React, { useMemo, useState } from 'react';
import { RotateCcw, Undo2 } from 'lucide-react';

const PRESETS = [
  { label: 'Sample 1', values: [1, 2, 3, 1, 1, 1] },
  { label: 'Sample 2', values: [2, 2, 3] },
  { label: 'Sample 3', values: [0, 0, 0, 0, 0] },
  { label: 'Tricky', values: [2, 1, 3, 2, 1, 3] },
];

function computeOptimalMoves(arr) {
  const n = arr.length;
  if (n <= 1) return 0;
  const total = arr.reduce((acc, x) => acc + x, 0);
  if (total === 0) return 0;

  for (let r = n; r >= 1; r -= 1) {
    if (total % r !== 0) continue;
    const target = total / r;
    let cur = 0;
    let ok = true;
    for (const x of arr) {
      cur += x;
      if (cur > target) {
        ok = false;
        break;
      }
      if (cur === target) cur = 0;
    }
    if (ok) return n - r;
  }
  return n - 1;
}

export default function SleepVisualizer() {
  const [initial, setInitial] = useState(PRESETS[0].values);
  const [history, setHistory] = useState([PRESETS[0].values]);
  const [customText, setCustomText] = useState('1 2 3 1 1 1');
  const [parseError, setParseError] = useState('');

  const current = history[history.length - 1];
  const mergesDone = history.length - 1;
  const totalSum = useMemo(() => current.reduce((acc, v) => acc + v, 0), [current]);
  const optimalMoves = useMemo(() => computeOptimalMoves(initial), [initial]);
  const allEqual = current.length > 0 && current.every((v) => v === current[0]);

  const loadArray = (arr) => {
    setInitial(arr);
    setHistory([arr]);
    setCustomText(arr.join(' '));
    setParseError('');
  };

  const handleMerge = (idx) => {
    if (idx < 0 || idx >= current.length - 1) return;
    const next = [
      ...current.slice(0, idx),
      current[idx] + current[idx + 1],
      ...current.slice(idx + 2),
    ];
    setHistory((prev) => [...prev, next]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    setHistory([initial]);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const parts = customText.trim().split(/[\s,]+/).filter(Boolean);
    if (parts.length < 1 || parts.length > 14) {
      setParseError('Enter between 1 and 14 non-negative integers.');
      return;
    }
    const nums = parts.map((p) => Number(p));
    if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 1000)) {
      setParseError('All values must be whole numbers from 0 to 1000.');
      return;
    }
    loadArray(nums);
  };

  return (
    <div className="viz-shell">
      <p className="viz-intro">
        Click any <strong>+</strong> button between two adjacent class periods to combine them.
        Watch how the <strong>total sum</strong> never changes, and try to make all remaining
        numbers equal in the fewest possible merges!
      </p>

      <div className="viz-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadArray(preset.values)}
          >
            {preset.label}: [{preset.values.join(', ')}]
          </button>
        ))}
      </div>

      <form className="viz-custom-form" onSubmit={handleCustomSubmit}>
        <input
          type="text"
          className="text-input"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Custom array e.g. 2 1 3 1 2"
          aria-label="Custom class periods array"
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Load Array
        </button>
      </form>
      {parseError && (
        <div style={{ color: 'var(--wa-fg)', fontSize: '12.5px' }}>{parseError}</div>
      )}

      <div className="viz-stats">
        <div className="viz-stat">
          <div className="viz-stat-label">Total Sum</div>
          <div className="viz-stat-value">{totalSum}</div>
          <div className="viz-stat-sub">Always invariant</div>
        </div>
        <div className="viz-stat">
          <div className="viz-stat-label">Modifications</div>
          <div className="viz-stat-value">{mergesDone}</div>
          <div className="viz-stat-sub">N − r = {initial.length} − {current.length}</div>
        </div>
        <div className="viz-stat">
          <div className="viz-stat-label">Remaining (r)</div>
          <div className="viz-stat-value">{current.length}</div>
          <div className="viz-stat-sub">
            {totalSum === 0
              ? 'All zeros'
              : totalSum % current.length === 0
                ? `${totalSum} ÷ ${current.length} = ${totalSum / current.length}`
                : `${current.length} ∤ ${totalSum}`}
          </div>
        </div>
      </div>

      <div className="viz-stage">
        <div className="viz-cells">
          {current.map((val, idx) => (
            <React.Fragment key={`${idx}-${val}-${current.length}`}>
              <div className={`viz-cell ${allEqual ? 'equal-win' : ''}`}>
                <div className="viz-cell-val">{val}</div>
                <div className="viz-cell-idx">#{idx + 1}</div>
              </div>
              {idx < current.length - 1 && (
                <button
                  type="button"
                  className="viz-merge-btn"
                  onClick={() => handleMerge(idx)}
                  title={`Combine ${val} + ${current[idx + 1]} = ${val + current[idx + 1]}`}
                  aria-label={`Combine period ${idx + 1} and ${idx + 2}`}
                >
                  +
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleUndo}
          disabled={history.length <= 1}
        >
          <Undo2 size={14} />
          Undo
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleReset}
          disabled={history.length <= 1}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {allEqual ? (
        <div className={`viz-banner ${mergesDone === optimalMoves ? 'success' : 'info'}`}>
          <span>
            {mergesDone === optimalMoves ? (
              <>
                <strong>Optimal!</strong> Every class period is now{' '}
                <code>{current[0]}</code> in <strong>{mergesDone}</strong>{' '}
                {mergesDone === 1 ? 'modification' : 'modifications'}.
              </>
            ) : (
              <>
                All periods equal <code>{current[0]}</code> in <strong>{mergesDone}</strong>{' '}
                modifications — can you reset and reach equal numbers in just{' '}
                <strong>{optimalMoves}</strong>?
              </>
            )}
          </span>
        </div>
      ) : (
        <div className="viz-banner info">
          <span>
            Notice: because the sum is <strong>{totalSum}</strong>, any valid final array of{' '}
            <code>r</code> equal elements must have <code>r</code> divide{' '}
            <strong>{totalSum}</strong>.
          </span>
        </div>
      )}

      {history.length > 1 && (
        <div className="viz-history">
          <div className="section-heading" style={{ marginTop: 4 }}>
            Merge Log
          </div>
          {history.map((snap, i) => (
            <div key={i} className="viz-history-row">
              Step {i}: [ {snap.join('  ')} ]
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
