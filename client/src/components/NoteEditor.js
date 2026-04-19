import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useHardwareBack } from '../hooks/useHardwareBack';

export default function NoteEditor({ note, category, cardRect, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(note?.title || '');
  const [body, setBody]   = useState(note?.body  || '');
  const [saved, setSaved] = useState(false);

  // Always-current refs so callbacks never capture stale state
  const titleVal  = useRef(note?.title || '');
  const bodyVal   = useRef(note?.body  || '');
  const isDirty   = useRef(false);
  const saveTO    = useRef(null);

  // DOM refs for resize / focus
  const titleElRef = useRef(null);
  const bodyElRef  = useRef(null);

  // Auto-resize textareas
  const resize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  useEffect(() => {
    resize(titleElRef.current);
    resize(bodyElRef.current);
    if (!note?.title && !note?.body) {
      setTimeout(() => titleElRef.current?.focus(), 150);
    }
  }, [note, category]);

  // Save using ref values — always fresh
  const doSave = useCallback(() => {
    return onSave({ 
      title: titleVal.current, 
      body: bodyVal.current
    });
  }, [onSave]);

  // Debounced auto-save called directly from onChange
  const scheduleSave = useCallback(() => {
    isDirty.current = true;
  }, []);

  // onChange handlers: update ref + state + kick off save
  const handleTitleChange = (e) => {
    titleVal.current = e.target.value;
    setTitle(e.target.value);
    resize(e.target);
    scheduleSave();
  };

  const handleBodyChange = (e) => {
    bodyVal.current = e.target.value;
    setBody(e.target.value);
    resize(e.target);
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
    clearTimeout(saveTO.current);
    
    const isEmpty = 
      !titleVal.current.trim() && 
      !bodyVal.current.trim();

    if (isEmpty) {
      onDelete();
      return;
    }

    if (isDirty.current) await doSave();
    
    setIsOpen(false);
    
    setTimeout(() => {
      onClose();
    }, 400); // Wait for bounce out transition
  };

  const handleForceClose = async () => {
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && !bodyVal.current.trim();
    if (isEmpty) { onDelete(); return; }
    if (isDirty.current) await doSave();
    onClose(); // instant, no animation delay
  };

  const handleDelete = () => {
    clearTimeout(saveTO.current);
    onDelete();
  };

  useHardwareBack(handleClose);

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
      
      {/* Modal Container to enforce exact #root limits and 12px margins */}
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none">
        <div className="w-full max-w-[430px] h-full flex flex-col p-3">
          <div 
            className="relative w-full flex-1 flex flex-col pointer-events-auto overflow-hidden glass-pill-card" 
            style={{
              borderRadius: '16px',
              transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(40px)',
              opacity: isOpen ? 1 : 0,
              transition: 'transform 0.45s cubic-bezier(0.5, 1.5, 0.5, 1), opacity 0.35s ease-out',
              willChange: 'transform, opacity'
            }}
          >
        
        {/* ── Editor Full UI ── */}
        <div className="absolute inset-0 flex flex-col w-full h-full">

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        
        {/* Title Row */}
        <div className="flex items-center justify-between gap-3 w-full min-h-[42px]">
          <textarea
            ref={titleElRef}
            className="font-serif text-[28px] border-none bg-transparent text-white outline-none flex-1 leading-[1.3] overflow-hidden resize-none caret-white/80 placeholder:text-white/30 pt-0.5"
            placeholder="Title"
            value={title}
            rows={1}
            onChange={handleTitleChange}
          />
          <div className="flex items-center gap-2.5 shrink-0">
            <button 
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0 glass-pill-card" 
              onClick={handleDelete} 
              title="Delete note"
            >
              <Trash2 size={18} className="text-[#ff6b6b]" strokeWidth={2.5} />
            </button>
            <button 
              className="w-[42px] h-[42px] rounded-full text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0 glass-pill-card" 
              onClick={handleForceClose} 
              title="Close note"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="h-px bg-white/20 shrink-0 w-full" />
        
        <textarea
          ref={bodyElRef}
          className="font-sans text-[17px] border-none bg-transparent text-white/90 outline-none w-full leading-[1.8] flex-1 min-h-[220px] overflow-hidden resize-none caret-white/80 placeholder:text-white/30"
          placeholder="Start writing..."
          value={body}
          onChange={handleBodyChange}
        />
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
