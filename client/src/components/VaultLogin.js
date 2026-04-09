import React, { useState, useEffect } from 'react';
import { Lock, Loader2, ShieldCheck, Delete } from 'lucide-react';
import { deriveKey } from '../utils/crypto';
import { setVaultPin, verifyVaultPin } from '../utils/api';
import { cn } from '../lib/utils';

export default function VaultLogin({ user, onUnlock }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isSetup = !user.hasVaultPin;

  useEffect(() => {
    if (pin.length === 6 && !loading) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleKeypad = (digit) => {
    if (pin.length < 6) {
      setError('');
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 6) return;
    setLoading(true);
    setError('');
    
    // Slight artificial delay for UX feel of "encryption working"
    await new Promise(r => setTimeout(r, 400));

    try {
      if (isSetup) await setVaultPin(pin);
      else await verifyVaultPin(pin);

      const key = await deriveKey(pin, user.id);
      
      // Update local hasVaultPin state so it doesn't flicker back to setup if quickly locked
      user.hasVaultPin = true; 
      
      onUnlock(key);
    } catch (err) {
      setError(err.message || 'Verification failed');
      setPin(''); // Auto clear on fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[430px] mx-auto flex flex-col justify-center px-6 items-center pb-[130px] pt-2 min-h-0 overflow-hidden">
      <div className="w-[52px] h-[52px] rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-3 shadow-lg backdrop-blur-md shrink-0">
        {isSetup ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : <Lock className="w-6 h-6 text-slate-300" />}
      </div>
      
      <h2 className="text-xl font-bold text-white mb-1.5 tracking-tight shrink-0">
        {isSetup ? 'Secure Your Vault' : 'Unlock Vault'}
      </h2>
      <p className="text-[13px] text-white/50 mb-4 text-center max-w-[260px] shrink-0 leading-snug">
        {isSetup 
          ? 'Create a 6-digit PIN to activate military-grade device encryption.'
          : 'Enter your 6-digit PIN to decrypt your sensitive data.'}
      </p>

      {/* PIN Dots Display */}
      <div className="flex gap-3 mb-3 shrink-0">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "w-3.5 h-3.5 rounded-full transition-all duration-200",
              i < pin.length ? "bg-white scale-100 shadow-[0_0_12px_rgba(255,255,255,0.8)]" : "bg-slate-700/50 scale-75"
            )}
          />
        ))}
      </div>

      <div className="h-5 mb-3 flex items-center justify-center w-full shrink-0 relative">
        {loading ? (
          <div className="flex items-center text-emerald-400 text-[13px] font-medium gap-2 absolute">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isSetup ? 'Generating Keys...' : 'Decrypting...'}
          </div>
        ) : error ? (
          <div className="text-red-400 text-[13px] font-semibold absolute">{error}</div>
        ) : null}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-x-5 gap-y-2 max-w-[280px] w-full shrink-0">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeypad(num.toString())}
            className="h-[56px] rounded-full bg-slate-800/30 text-white text-[24px] font-medium flex items-center justify-center transition-all hover:bg-slate-800/60 active:scale-90"
          >
            {num}
          </button>
        ))}
        <div className="h-[56px]" /> {/* Empty bottom-left */}
        <button
          onClick={() => handleKeypad('0')}
          className="h-[56px] rounded-full bg-slate-800/30 text-white text-[24px] font-medium flex items-center justify-center transition-all hover:bg-slate-800/60 active:scale-90"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="h-[56px] rounded-full text-white/60 flex items-center justify-center transition-all hover:bg-slate-800/30 active:scale-90 disabled:opacity-30"
          disabled={pin.length === 0}
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
