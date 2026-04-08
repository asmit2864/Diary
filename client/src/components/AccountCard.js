import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { encryptText } from '../utils/crypto';
import { getIconForTitle } from '../utils/getIconForTitle';

const LONG_PRESS_MS = 500;

export default function AccountCard({ account, onClick, selectionMode, selected, onLongPress, onToggleSelect, onUpdate, vaultKey }) {
  const timerRef = useRef(null);
  const didLongPress = useRef(false);
  const cardRef = useRef(null);

  const [editingId, setEditingId] = useState('');
  const [editingPw, setEditingPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    setEditingId(account.accountId || '');
    setEditingPw(account.accountPassword || '');
  }, [account]);

  const handleIdBlur = async () => {
    if (editingId === (account.accountId || '')) return;
    if (onUpdate && vaultKey) {
      const encId = await encryptText(editingId, vaultKey);
      onUpdate(account._id, { accountId: encId });
    }
  };

  const handlePwBlur = async () => {
    if (editingPw === (account.accountPassword || '')) return;
    if (onUpdate && vaultKey) {
      const encPw = await encryptText(editingPw, vaultKey);
      onUpdate(account._id, { accountPassword: encPw });
    }
  };

  const [isPressed, setIsPressed] = useState(false);

  const startPress = () => {
    setIsPressed(true);
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(account._id);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    setIsPressed(false);
    clearTimeout(timerRef.current);
  };

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
        "hover:bg-white/15",
        isPressed && "bg-white/20 scale-95",
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
          {getIconForTitle(account.title)}
        </div>
        <div className="text-[17px] font-bold text-white truncate flex-1">
          {account.title || <span className="text-white/50 italic">Unnamed Account</span>}
        </div>
      </div>
      
      <div 
        className="flex flex-col gap-1.5 mt-1 cursor-auto"
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >
        {account.accountId !== undefined ? (
          <div className="text-[14px] text-white/90 flex items-center w-full min-w-0">
            <span className="w-[30px] shrink-0 text-white/40 text-[11px] uppercase tracking-wider font-semibold">ID</span>
            <input 
              className="font-medium bg-black/20 px-2.5 flex-1 min-w-0 rounded-md truncate h-[32px] outline-none focus:ring-1 focus:ring-white/30 text-white placeholder:text-white/20 transition-all caret-white"
              value={editingId}
              onChange={e => setEditingId(e.target.value)}
              onBlur={handleIdBlur}
              placeholder="Account ID"
              spellCheck="false"
            />
          </div>
        ) : null}
        
        {account.accountPassword !== undefined ? (
          <div className="text-[14px] text-white/90 flex items-center w-full min-w-0">
            <span className="w-[30px] shrink-0 text-white/40 text-[11px] uppercase tracking-wider font-semibold">PW</span>
            <div className="flex-1 min-w-0 relative flex items-center h-[32px]">
              <input 
                type={showPw ? "text" : "password"}
                className={cn(
                  "font-medium bg-black/20 pl-2.5 pr-9 w-full rounded-md truncate h-full outline-none focus:ring-1 focus:ring-white/30 text-white placeholder:text-white/20 transition-all caret-white",
                  !showPw && editingPw && "font-sans tracking-[0.2em]"
                )}
                value={editingPw}
                onChange={e => setEditingPw(e.target.value)}
                onBlur={handlePwBlur}
                placeholder="Password"
                spellCheck="false"
              />
              <button 
                type="button"
                className="absolute right-1 w-[26px] h-[26px] flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPw(!showPw); }}
              >
                {showPw ? <EyeOff size={14} strokeWidth={2.5} /> : <Eye size={14} strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
