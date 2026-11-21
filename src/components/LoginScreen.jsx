import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Moon, Sun, User } from 'lucide-react';
import { saveSession, verifyCredentials } from '../utils/auth.js';

export default function LoginScreen({ onAuthenticated, theme, onToggleTheme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (verifyCredentials(username, password)) {
      const session = saveSession(username);
      setError('');
      onAuthenticated(session);
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-topbar">
        <button
          id="login-theme-toggle"
          type="button"
          className="icon-btn bordered"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>

      <main className="login-card">
        <div className="login-brand">
          <span className="brand-logo login-logo">U</span>
          <div>
            <h1 className="login-title">USACO Arena</h1>
            <p className="login-subtitle">Competitive Programming Practice</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <div className="login-input-wrap">
              <User size={15} className="login-input-icon" />
              <input
                id="login-username"
                type="text"
                className="login-input"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <Lock size={15} className="login-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-input login-input-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button id="login-submit-btn" type="submit" className="btn btn-primary login-submit">
            Sign In to Arena
          </button>
        </form>
      </main>
    </div>
  );
}
