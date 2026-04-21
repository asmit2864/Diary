import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { encryptText } from '../utils/crypto';

export default function AccountEditor({ note: account, category, cardRect, onClose, onSave, onDelete, vaultKey }) {
  const [title, setTitle] = useState(account?.title || '');
  const [accountId, setAccountId] = useState(account?.accountId || '');
  const [accountPassword, setAccountPassword] = useState(account?.accountPassword || '');
  const [notes, setNotes] = useState(account?.notes || '');
  const saved = false;
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    let encId = accountIdVal.current;
    let encPassword = passwordVal.current;
    let encNotes = notesVal.current;

    if (vaultKey) {
      if (accountIdVal.current) encId = await encryptText(accountIdVal.current, vaultKey);
      if (passwordVal.current) encPassword = await encryptText(passwordVal.current, vaultKey);
      if (notesVal.current) encNotes = await encryptText(notesVal.current, vaultKey);
    }
    
    return onSave({ 
      title: titleVal.current, 
      accountId: encId,
      accountPassword: encPassword,
      notes: encNotes
    });
  }, [onSave, vaultKey]);

  const scheduleSave = useCallback(() => {
    isDirty.current = true;
  }, []);

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

  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure initial render is registered before triggering CSS transition
    const frame = requestAnimationFrame(() => {
      setIsOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClose = async () => {
    if (isSaving) return;
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && !accountIdVal.current.trim() && !passwordVal.current.trim() && !notesVal.current.trim();
    if (isEmpty) {
      onDelete();
      return;
    }
    if (isDirty.current) {
      setIsSaving(true);
      try { await doSave(); } catch (e) { console.error(e); }
    }
    
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 400); // Wait for bounce out transition
  };

  const handleDelete = () => {
    clearTimeout(saveTO.current);
    onDelete();
  };

  useHardwareBack(handleClose);

  const handleForceClose = async () => {
    if (isSaving) return;
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && !accountIdVal.current.trim() && !passwordVal.current.trim() && !notesVal.current.trim();
    if (isEmpty) { onDelete(); return; }
    if (isDirty.current) {
      setIsSaving(true);
      try { await doSave(); } catch (e) { console.error(e); }
    }
    onClose(); // instant, no animation delay
  };

  return (
    <>
      {/* Invisible Backing with Fade */}
      <div 
        className="fixed inset-0 z-[190] transition-opacity duration-300"
        style={{ 
          background: 'rgba(0,0,0,0.3)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        onClick={handleClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none">
        <div className="w-full max-w-[430px] h-full flex flex-col p-3">
          <div 
            className="relative w-full flex-1 flex flex-col pointer-events-auto overflow-hidden glass-pill-card" 
            style={{
              borderRadius: '16px',
              transform: isOpen ? 'translate3d(0, 0, 0)' : 'translate3d(0, 40px, 0)',
              opacity: isOpen ? 1 : 0,
              transition: 'transform 0.45s cubic-bezier(0.5, 1.5, 0.5, 1), opacity 0.35s ease-out',
              willChange: 'transform, opacity'
            }}
          >
            <div className="absolute inset-0 flex flex-col w-full h-full">
              
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                
                {/* Title Row */}
                <div className="flex items-center justify-between gap-3 w-full min-h-[42px]">
                  <textarea
                    ref={titleElRef}
                    className="font-serif text-[28px] border-none bg-transparent text-white outline-none flex-1 leading-[1.3] overflow-hidden resize-none caret-white/80 placeholder:text-white/30 pt-0.5"
                    placeholder="Account/Site Name"
                    value={title}
                    rows={1}
                    onChange={handleTitleChange}
                  />
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button 
                      className={cn("w-[42px] h-[42px] rounded-full flex items-center justify-center transition-transform shrink-0 glass-pill-card",
                        isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"
                      )}
                      onClick={isSaving ? undefined : handleDelete} 
                      title="Delete account"
                    >
                      <Trash2 size={18} className="text-[#ff6b6b]" strokeWidth={2.5} />
                    </button>
                    <button 
                      className={cn("w-[42px] h-[42px] rounded-full text-white flex items-center justify-center transition-transform shrink-0 glass-pill-card",
                        isSaving ? "cursor-not-allowed" : "cursor-pointer active:scale-95"
                      )}
                      onClick={isSaving ? undefined : handleForceClose} 
                      title="Close account"
                    >
                      {isSaving ? <Loader2 size={20} className="animate-spin text-white/80" /> : <X size={20} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/20 shrink-0 w-full" />
                
                <div className="flex flex-col gap-4 mt-2 pb-[30px]">
                  <div>
                    <label className="text-[12px] font-semibold text-white/50 uppercase tracking-wider mb-2 block">Username / Account ID</label>
                    <input
                      type="text"
                      className="w-full px-4 py-[10px] bg-white/10 border-none rounded-[19px] text-white placeholder:text-white/40 outline-none text-[15px] shadow-sm focus:bg-white/20 transition-colors"
                      placeholder="email@example.com"
                      value={accountId}
                      onChange={handleAccountIdChange}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-white/50 uppercase tracking-wider mb-2 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-4 pr-12 py-[10px] bg-white/10 border-none rounded-[19px] text-white placeholder:text-white/40 outline-none text-[15px] shadow-sm focus:bg-white/20 transition-colors"
                        placeholder="Secret password"
                        value={accountPassword}
                        onChange={handlePasswordChange}
                      />
                      <button 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-white/50 uppercase tracking-wider mb-2 block">Notes</label>
                    <textarea
                      className="w-full min-h-[80px] px-4 py-[10px] bg-white/10 border-none rounded-[19px] text-white placeholder:text-white/40 outline-none text-[15px] shadow-sm focus:bg-white/20 transition-colors resize-none overflow-hidden"
                      placeholder="Additional information..."
                      value={notes}
                      onChange={handleNotesChange}
                    />
                  </div>
                </div>
              </div>

              {/* Saved toast */}
              <div className={cn(
                "absolute bottom-9 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white text-[12px] py-1.5 px-5 rounded-full border border-white/30 transition-opacity duration-300 pointer-events-none whitespace-nowrap",
                saved ? "opacity-100" : "opacity-0"
              )}>
                ✓ Saved
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
