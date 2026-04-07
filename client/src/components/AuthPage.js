import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Feather, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-3 bg-white/15 border-white/30 text-white hover:bg-white/25 hover:text-white rounded-full h-12"
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
            </Button>
          </div>

          <div className="flex items-center text-center text-white/45 text-[13px] font-medium mb-6 uppercase tracking-wide before:flex-1 before:border-b before:border-white/15 after:flex-1 after:border-b after:border-white/15">
            <span className="px-3">or continue with email</span>
          </div>

          {/* Mode toggle */}
          <div className="relative flex bg-black/15 rounded-xl p-1 mb-6">
            <div
              className={cn(
                "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/20 rounded-lg transition-transform duration-300 ease-out",
                mode === 'login' ? "translate-x-0" : "translate-x-full"
              )}
            />
            <button
              className={cn(
                "flex-1 py-2 rounded-lg text-[15px] font-medium transition-colors z-10",
                mode === 'login' ? "text-white font-semibold" : "text-white/55"
              )}
              onClick={() => reset('login')}
            >Log In</button>
            <button
              className={cn(
                "flex-1 py-2 rounded-lg text-[15px] font-medium transition-colors z-10",
                mode === 'register' ? "text-white font-semibold" : "text-white/55"
              )}
              onClick={() => reset('register')}
            >Register</button>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-white/65 uppercase tracking-wide">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/50 focus-visible:bg-white/20 h-12 rounded-xl text-base"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-white/65 uppercase tracking-wide">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/50 focus-visible:bg-white/20 h-12 rounded-xl text-base"
              />
            </div>

            <div
              className={cn(
                "flex flex-col gap-1.5 overflow-hidden transition-all duration-300 ease-out",
                mode === 'register' ? "max-h-[100px] opacity-100" : "max-h-0 opacity-0 -mt-4 pointer-events-none"
              )}
            >
              <label className="text-[13px] font-semibold text-white/65 uppercase tracking-wide">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required={mode === 'register'}
                autoComplete="new-password"
                tabIndex={mode === 'register' ? 0 : -1}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/50 focus-visible:bg-white/20 h-12 rounded-xl text-base"
              />
            </div>

            {error && (
              <p className="bg-red-400/20 border border-red-400/40 rounded-xl p-3 text-sm text-red-200 mt-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-12 bg-white/25 border border-white/45 rounded-xl text-white font-semibold hover:bg-white/30 active:scale-95 transition-all text-base"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Please wait…</>
              ) : mode === 'login' ? 'Log In' : 'Create Account'}
            </Button>
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
