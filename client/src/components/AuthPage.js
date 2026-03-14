import React, { useState } from 'react';
import './AuthPage.css';

export default function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const reset = (m) => { setMode(m); setError(''); setPassword(''); setConfirm(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirm) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      await onAuth(mode, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Logo */}
      <div className="auth-logo">
        <span className="auth-logo-icon">📝</span>
        <h1 className="auth-logo-name">Diary</h1>
        <p className="auth-logo-sub">Your thoughts, beautifully organised</p>
      </div>

      {/* Card */}
      <div className="auth-card">
        {/* Mode toggle */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => reset('login')}
          >Log In</button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => reset('register')}
          >Register</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => reset(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Register' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
