import React, { useRef } from 'react';
import { cn } from '../lib/utils';
import { Shield } from 'lucide-react';

const LONG_PRESS_MS = 500;

export default function AccountCard({ account, onClick, selectionMode, selected, onLongPress, onToggleSelect }) {
  const timerRef = useRef(null);
  const didLongPress = useRef(false);
  const cardRef = useRef(null);

  const startPress = () => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(account._id);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => clearTimeout(timerRef.current);

  const handleClick = () => {
    if (didLongPress.current) return;
    if (selectionMode) {
      onToggleSelect(account._id);
    } else {
      const rect = cardRef.current?.getBoundingClientRect() ?? null;
      onClick(account, rect);
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-white/10 rounded-[16px] px-5 py-4 cursor-pointer transition-all duration-150 relative select-none flex flex-col gap-3 shadow-sm border border-white/5",
        "active:bg-white/20 active:scale-95 hover:bg-white/15",
        selected && "bg-white/30 ring-2 ring-white/70 scale-[0.97]",
        selectionMode && !selected && "opacity-50"
      )}
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
    >
      <div className="flex items-center gap-3">
        <div className="w-[36px] h-[36px] rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
          <Shield size={18} strokeWidth={2} />
        </div>
        <div className="text-[17px] font-bold text-white truncate flex-1">
          {account.title || <span className="text-white/50 italic">Unnamed Account</span>}
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5 mt-1">
        {account.accountId ? (
          <div className="text-[14px] text-white/90 truncate flex items-center">
            <span className="w-[30px] inline-block text-white/40 text-[11px] uppercase tracking-wider font-semibold">ID</span>
            <span className="font-medium bg-black/20 px-2 py-0.5 rounded-md flex-1 truncate">{account.accountId}</span>
          </div>
        ) : null}
        
        {account.accountPassword ? (
          <div className="text-[14px] text-white/90 truncate flex items-center">
            <span className="w-[30px] inline-block text-white/40 text-[11px] uppercase tracking-wider font-semibold">PW</span>
            <span className="font-medium bg-black/20 px-2 py-0.5 rounded-md flex-1 truncate text-white/50 tracking-[0.2em] pt-1">••••••••</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
