import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Delete } from 'lucide-react';
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

  // Exact same glass shadow as the + add button in FloatingNavbar
  const PILL_SHADOW = [
    'inset 0 0 0 1px color-mix(in srgb, #fff 3%, transparent)',
    'inset 1.8px 3px 0px -2px color-mix(in srgb, #fff 27%, transparent)',
    'inset -2px -2px 0px -2px color-mix(in srgb, #fff 24%, transparent)',
    'inset -3px -8px 1px -6px color-mix(in srgb, #fff 18%, transparent)',
    'inset -0.3px -1px 4px 0px color-mix(in srgb, #000 24%, transparent)',
    'inset -1.5px 2.5px 0px -2px color-mix(in srgb, #000 40%, transparent)',
    'inset 0px 3px 4px -2px color-mix(in srgb, #000 40%, transparent)',
    'inset 2px -6.5px 1px -4px color-mix(in srgb, #000 20%, transparent)',
    '0px 1px 5px 0px color-mix(in srgb, #000 20%, transparent)',
    '0px 6px 16px 0px color-mix(in srgb, #000 16%, transparent)',
  ].join(', ');

  // Button size = min(column-width, available-row-height)
  //   column-width  ≈ (100vw - 40px padding - 2×10px gap) / 3 = (100vw - 60px) / 3
  //   row-height    ≈ (100dvh - 380px overhead) / 4
  //   380px = header(56) + top-pad(14) + top-section(~136) + outer-gap(10) + nav-clear(88) + 3×row-gaps(30) + safety margin
  const BTN = 'min(calc((100vw - 60px) / 3), calc((100dvh - 380px) / 4))';
  const BTN_FONT = 'clamp(16px, min(4.5vw, calc((100dvh - 380px) / 18)), 28px)';

  return (
    <div
      className="flex-1 w-full max-w-[430px] mx-auto flex flex-col items-center min-h-0 overflow-hidden"
      style={{ padding: '14px 20px 82px', justifyContent: 'center', gap: 20 }}
    >
      {/* ── Top section: icon + title + subtitle ── */}
      <div className="shrink-0 flex flex-col items-center w-full" style={{ gap: 8 }}>

        {/* Glass icon — exact same style as the + add button */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'color-mix(in srgb, #bbbbbc 12%, transparent)',
            backdropFilter: 'blur(14px) saturate(180%)',
            WebkitBackdropFilter: 'blur(14px) saturate(180%)',
            boxShadow: PILL_SHADOW,
          }}
        >
          {isSetup
            ? <ShieldCheck className="w-6 h-6 text-emerald-400" />
            : <Lock className="w-6 h-6 text-white/90" />}
        </div>

        {/* Title + subtitle / error */}
        <div className="text-center">
          <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">
            {isSetup ? 'Secure Your Vault' : 'Unlock Vault'}
          </h2>
          <p className={cn("text-[12px] mt-1 transition-colors duration-200", error ? 'text-red-400 font-semibold' : 'text-white/50')}>
            {error || (isSetup ? 'Create a 6-digit PIN to protect your vault.' : 'Enter your 6-digit PIN.')}
          </p>
        </div>
      </div>

      {/* ── PIN dots — perfectly centered between top section and numpad ── */}
      <div className="shrink-0 flex gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full transition-all duration-200",
              i < pin.length
                ? "bg-white scale-100 shadow-[0_0_10px_rgba(255,255,255,0.85)]"
                : "bg-white/15 scale-90"
            )}
          />
        ))}
      </div>

      {/* ── Numpad — explicit CSS min() sizing, never overflows ── */}
      <div
        className="w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          placeItems: 'center',
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeypad(num.toString())}
            style={{
              width: BTN,
              height: BTN,
              fontSize: BTN_FONT,
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: 'color-mix(in srgb, #bbbbbc 12%, transparent)',
              backdropFilter: 'blur(14px) saturate(180%)',
              WebkitBackdropFilter: 'blur(14px) saturate(180%)',
              boxShadow: PILL_SHADOW,
            }}
            className="text-white font-semibold flex items-center justify-center transition-all duration-150 active:scale-90"
          >
            {num}
          </button>
        ))}

        {/* Bottom row: empty | 0 | backspace */}
        <div style={{ width: BTN, height: BTN }} />
        <button
          onClick={() => handleKeypad('0')}
          style={{
            width: BTN,
            height: BTN,
            fontSize: BTN_FONT,
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: 'color-mix(in srgb, #bbbbbc 12%, transparent)',
            backdropFilter: 'blur(14px) saturate(180%)',
            WebkitBackdropFilter: 'blur(14px) saturate(180%)',
            boxShadow: PILL_SHADOW,
          }}
          className="text-white font-semibold flex items-center justify-center transition-all duration-150 active:scale-90"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={pin.length === 0}
          style={{ width: BTN, height: BTN, borderRadius: '50%', flexShrink: 0 }}
          className="text-white/60 flex items-center justify-center transition-all duration-150 hover:bg-white/10 active:scale-90 disabled:opacity-20"
        >
          <Delete style={{ width: 'clamp(16px, 5vw, 24px)', height: 'clamp(16px, 5vw, 24px)' }} />
        </button>
      </div>
    </div>
  );
}
