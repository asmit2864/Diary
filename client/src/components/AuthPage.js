import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Feather, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

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
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6 gap-8 overflow-y-auto z-50">
      
      {/* Logo */}
      <div className="flex flex-col items-center gap-1.5 text-center mt-8">
        <span className="text-[46px] leading-none text-white/95 drop-shadow-md">
          <Feather size={46} strokeWidth={1.5} />
        </span>
        <h1 className="font-serif text-[42px] font-normal text-white tracking-tight m-0">
          Diary
        </h1>
        <p className="text-[15px] text-white/60 m-0">
          Your thoughts, beautifully organised
        </p>
      </div>

      {/* Card */}
      <Card className="w-full max-w-[380px] bg-white/10 backdrop-blur-xl shadow-2xl rounded-[24px] border border-white/20 p-2">
        <CardContent className="p-6">
          
          <div className="mb-6 w-full">
            <button
              className="w-full h-[54px] flex items-center justify-center gap-3 glass-pill-card active:scale-[0.98] transition-transform rounded-[18px] text-white text-[15px] font-medium shadow-xl"
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

          <div className="flex items-center text-center text-white/45 text-[13px] font-medium mb-6 uppercase tracking-wide before:flex-1 before:border-b before:border-white/15 after:flex-1 after:border-b after:border-white/15">
            <span className="px-3">or continue with email</span>
          </div>

          {/* Mode toggle */}
          <div className="relative flex glass-pill-card rounded-[18px] p-1.5 mb-8 shadow-xl">
            <div
              className={cn(
                "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white/20 rounded-[14px] transition-transform duration-300 ease-out shadow-sm",
                mode === 'login' ? "translate-x-0" : "translate-x-full"
              )}
            />
            <button
              className={cn(
                "flex-1 py-2.5 rounded-[14px] text-[15px] font-medium transition-colors z-10 outline-none",
                mode === 'login' ? "text-white font-semibold" : "text-white/50"
              )}
              onClick={() => reset('login')}
            >Log In</button>
            <button
              className={cn(
                "flex-1 py-2.5 rounded-[14px] text-[15px] font-medium transition-colors z-10 outline-none",
                mode === 'register' ? "text-white font-semibold" : "text-white/50"
              )}
              onClick={() => reset('register')}
            >Register</button>
          </div>

          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email (you@example.com)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 rounded-[18px] px-5 py-[18px] text-[15px] text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/40 focus-visible:bg-white/10 shadow-inner outline-none transition-all"
            />

            <input
              type="password"
              placeholder="Password (••••••••)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-white/5 border border-white/10 rounded-[18px] px-5 py-[18px] text-[15px] text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/40 focus-visible:bg-white/10 shadow-inner outline-none transition-all"
            />

            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                mode === 'register' ? "max-h-[100px] opacity-100" : "max-h-0 opacity-0 -mt-3 pointer-events-none"
              )}
            >
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required={mode === 'register'}
                autoComplete="new-password"
                tabIndex={mode === 'register' ? 0 : -1}
                className="w-full bg-white/5 border border-white/10 rounded-[18px] px-5 py-[18px] text-[15px] text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/40 focus-visible:bg-white/10 shadow-inner outline-none transition-all"
              />
            </div>

            {error && (
              <p className="bg-red-400/20 border border-red-400/30 rounded-xl p-3 text-sm text-red-200 mt-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full h-[54px] glass-pill-card rounded-[18px] text-white font-bold flex items-center justify-center active:scale-[0.98] transition-all text-[16px] shadow-xl outline-none"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin text-white/70" /> Please wait…</>
              ) : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-[15px] text-white/50">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => reset(mode === 'login' ? 'register' : 'login')}
              className="bg-transparent border-none text-white/85 font-semibold underline underline-offset-2 hover:text-white"
            >
              {mode === 'login' ? 'Register' : 'Log In'}
            </button>
          </p>

        </CardContent>
      </Card>
    </div>
  );
}
