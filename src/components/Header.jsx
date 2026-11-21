import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  LogOut,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  User,
} from 'lucide-react';

function formatTime(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export default function Header({
  problems,
  activeProblem,
  onSelectProblem,
  isSolved,
  theme,
  onToggleTheme,
  username,
  onSignOut,
}) {
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="brand-mark" title="USACO Competitive Programming Arena">
          <span className="brand-logo">U</span>
          <span>USACO Arena</span>
        </div>

        <span className="header-divider" />

        {problems.length > 0 && activeProblem && (
          <div className="problem-select-wrap">
            <select
              id="problem-selector"
              aria-label="Select USACO problem"
              className="problem-select"
              value={activeProblem.id}
              onChange={(e) => onSelectProblem(e.target.value)}
            >
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number}. {p.title} ({p.contest.replace('USACO ', '').replace(' Contest', '')})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="problem-select-chevron" />
          </div>
        )}

        {activeProblem && <span className="division-badge">{activeProblem.division}</span>}

        {isSolved && (
          <span className="solved-pill" title="Passed all official test cases">
            <CheckCircle2 size={13} />
            Solved
          </span>
        )}
      </div>

      <div className="header-center">
        <div className="timer-group" title="Practice contest timer">
          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="timer-readout">{formatTime(seconds)}</span>
          <button
            id="timer-toggle-btn"
            type="button"
            className="icon-btn compact"
            onClick={() => setTimerRunning((r) => !r)}
            aria-label={timerRunning ? 'Pause timer' : 'Start timer'}
            title={timerRunning ? 'Pause timer' : 'Start timer'}
          >
            {timerRunning ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button
            id="timer-reset-btn"
            type="button"
            className="icon-btn compact"
            onClick={() => {
              setTimerRunning(false);
              setSeconds(0);
            }}
            aria-label="Reset timer"
            title="Reset timer"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <div className="header-right">
        {activeProblem?.sourceUrl && (
          <a
            href={activeProblem.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="icon-btn bordered"
            title="Open original problem on usaco.org"
          >
            <span>usaco.org</span>
            <ExternalLink size={13} />
          </a>
        )}

        <button
          id="theme-toggle-btn"
          type="button"
          className="icon-btn bordered"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {username && (
          <>
            <span className="user-pill" title={`Signed in as ${username}`}>
              <User size={13} />
              <span>{username}</span>
            </span>
            <button
              id="sign-out-btn"
              type="button"
              className="icon-btn bordered"
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
