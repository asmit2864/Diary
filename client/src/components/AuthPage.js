import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FiFeather } from 'react-icons/fi';
import './AuthPage.css';

export default function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const googleLoginHandler = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleSubmit(new Event('submit'), 'google', tokenResponse.access_token);
    },
    onError: () => {
      setError('Google Sign-In failed');
    },
  });

  const reset = (m) => { setMode(m); setError(''); setPassword(''); setConfirm(''); };

  const handleSubmit = async (e, forceMode, googleCred) => {
    e?.preventDefault();
    setError('');
    const currentMode = forceMode || mode;
    if (currentMode === 'register' && password !== confirm) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      if (currentMode === 'google') {
        await onAuth('google', googleCred);
      } else {
        await onAuth(currentMode, email, password);
      }
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
        <span className="auth-logo-icon"><FiFeather /></span>
        <h1 className="auth-logo-name">Diary</h1>
        <p className="auth-logo-sub">Your thoughts, beautifully organised</p>
      </div>

      {/* Card */}
      <div className="auth-card">
        
        <div className="auth-google-wrapper">
          <button
            className="auth-submit auth-google-btn"
            onClick={() => googleLoginHandler()}
            type="button"
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        {/* Mode toggle */}
        <div className="auth-tabs">
          <div className={`auth-tab-pill ${mode}`} />
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

          <div className={`auth-field auth-field-confirm ${mode === 'register' ? 'expanded' : ''}`}>
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required={mode === 'register'}
              autoComplete="new-password"
              tabIndex={mode === 'register' ? 0 : -1}
            />
          </div>

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
