import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { encryptText } from '../utils/crypto';

export default function AccountEditor({ note: account, category, cardRect, onClose, onSave, onDelete, vaultKey }) {
  const [title, setTitle] = useState(account?.title || '');
  const [accountId, setAccountId] = useState(account?.accountId || '');
  const [accountPassword, setAccountPassword] = useState(account?.accountPassword || '');
  const [notes, setNotes] = useState(account?.notes || '');
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const titleVal  = useRef(account?.title || '');
  const accountIdVal = useRef(account?.accountId || '');
  const passwordVal = useRef(account?.accountPassword || '');
  const notesVal  = useRef(account?.notes || '');
  const isDirty   = useRef(false);
  const saveTO    = useRef(null);

  const titleElRef = useRef(null);

  const resize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  useEffect(() => {
    resize(titleElRef.current);
    if (!account?.title && !account?.accountId) {
      setTimeout(() => titleElRef.current?.focus(), 150);
    }
  }, [account]);

  const doSave = useCallback(async () => {
    let encPassword = passwordVal.current;
    let encNotes = notesVal.current;
    if (vaultKey) {
      encPassword = await encryptText(passwordVal.current, vaultKey);
      encNotes = await encryptText(notesVal.current, vaultKey);
    }
    return onSave({ 
      title: titleVal.current, 
      accountId: accountIdVal.current,
      accountPassword: encPassword,
      notes: encNotes
    });
  }, [onSave, vaultKey]);

  const scheduleSave = useCallback(() => {
    isDirty.current = true;
    clearTimeout(saveTO.current);
    saveTO.current = setTimeout(async () => {
      await doSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 800);
  }, [doSave]);

  const handleTitleChange = (e) => {
    titleVal.current = e.target.value;
    setTitle(e.target.value);
    resize(e.target);
    scheduleSave();
  };

  const handleAccountIdChange = (e) => {
    accountIdVal.current = e.target.value;
    setAccountId(e.target.value);
    scheduleSave();
  };

  const handlePasswordChange = (e) => {
    passwordVal.current = e.target.value;
    setAccountPassword(e.target.value);
    scheduleSave();
  };

  const handleNotesChange = (e) => {
    notesVal.current = e.target.value;
    setNotes(e.target.value);
    scheduleSave();
  };

  const handleClose = async () => {
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && !accountIdVal.current.trim() && !passwordVal.current.trim() && !notesVal.current.trim();
    if (isEmpty) {
      onDelete();
      return;
    }
    if (isDirty.current) await doSave();
    onClose();
  };

  const handleDelete = () => {
    clearTimeout(saveTO.current);
    onDelete();
  };

  const animStyle = React.useMemo(() => {
    if (!cardRect) return {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const editorW = Math.min(vw, 430);
    const editorLeft = (vw - editorW) / 2;
    const tx = (cardRect.left + cardRect.width  / 2) - (editorLeft + editorW / 2);
    const ty = (cardRect.top  + cardRect.height / 2) - vh / 2;
    const sx = cardRect.width  / editorW;
    const sy = cardRect.height / vh;
    return {
      '--tx': `${tx}px`,
      '--ty': `${ty}px`,
      '--sx': sx,
      '--sy': sy,
    };
  }, [cardRect]);

  return (
    <div 
      className="fixed inset-0 z-[200] flex flex-col max-w-[430px] mx-auto origin-center bg-gradient-to-b from-[#7b2fff] via-[#9b44ff_40%] via-[#b06ef3_70%] to-[#d49dff] animate-expandFromCard" 
      style={animStyle}
    >
      <div className="flex items-center px-4 pt-2.5 pb-[14px] gap-3 shrink-0">
        <button 
          className="w-[38px] h-[38px] rounded-full bg-white/20 border border-white/35 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur-md active:bg-white/30 shrink-0 hover:bg-white/25"
          onClick={handleClose}
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <span className="text-[13px] font-semibold bg-white/20 text-white rounded-full h-[38px] px-[14px] inline-flex items-center border border-white/35 uppercase tracking-wide backdrop-blur-md">
          {category}
        </span>
        <div className="flex gap-2 ml-auto shrink-0">
          <button 
            className="w-[38px] h-[38px] rounded-full bg-red-400/20 border border-red-400/35 text-[#ff6b6b] flex items-center justify-center cursor-pointer transition-colors backdrop-blur-md active:bg-red-400/35 hover:bg-red-400/25 shrink-0" 
            onClick={handleDelete} 
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2.5 pb-[30px] flex flex-col gap-3.5 [&::-webkit-scrollbar]:hidden">
        <textarea
          ref={titleElRef}
          className="font-serif text-[28px] border-none bg-transparent text-white outline-none w-full leading-[1.3] overflow-hidden resize-none caret-white/80 placeholder:text-white/30"
          placeholder="Account/Site Name"
          value={title}
          rows={1}
          onChange={handleTitleChange}
        />
        <div className="h-px bg-white/20 shrink-0 w-full" />
        
        <div className="flex flex-col gap-5 mt-2">
          <div>
            <label className="text-[15px] font-semibold text-white/80 mb-2 block">Username / Account ID</label>
            <input
              type="text"
              className="w-full bg-white/10 border-[1.5px] border-white/30 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/70 transition-colors placeholder:text-white/30 backdrop-blur-sm"
              placeholder="email@example.com"
              value={accountId}
              onChange={handleAccountIdChange}
            />
          </div>
          <div>
            <label className="text-[15px] font-semibold text-white/80 mb-2 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-white/10 border-[1.5px] border-white/30 rounded-2xl pl-4 pr-12 py-3 text-white outline-none focus:border-white/70 transition-colors placeholder:text-white/30 backdrop-blur-sm"
                placeholder="Secret password"
                value={accountPassword}
                onChange={handlePasswordChange}
              />
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[15px] font-semibold text-white/80 mb-2 block">Notes</label>
            <textarea
              className="w-full bg-white/10 border-[1.5px] border-white/30 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/70 transition-colors placeholder:text-white/30 backdrop-blur-sm resize-none min-h-[100px]"
              placeholder="Additional information..."
              value={notes}
              onChange={handleNotesChange}
            />
          </div>
        </div>
      </div>

      <div className={cn(
        "absolute bottom-9 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white text-[12px] py-1.5 px-5 rounded-full border border-white/30 transition-opacity duration-300 pointer-events-none whitespace-nowrap",
        saved ? "opacity-100" : "opacity-0"
      )}>
        ✓ Saved
      </div>
    </div>
  );
}
