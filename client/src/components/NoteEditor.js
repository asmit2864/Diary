import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

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
    clearTimeout(saveTO.current);
    saveTO.current = setTimeout(async () => {
      await doSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 800);
  }, [doSave]);

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

  // Save on back — waits for the PUT before reloading the grid
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
    onClose();
  };

  const handleDelete = () => {
    clearTimeout(saveTO.current);
    onDelete();
  };

  // Build CSS vars for scale-from-card animation
  const animStyle = React.useMemo(() => {
    if (!cardRect) return {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const editorW = Math.min(vw, 430);
    const editorLeft = (vw - editorW) / 2;
    // Translate: move editor's centre to card's centre
    const tx = (cardRect.left + cardRect.width  / 2) - (editorLeft + editorW / 2);
    const ty = (cardRect.top  + cardRect.height / 2) - vh / 2;
    // Scale: shrink editor to card's exact dimensions
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
      {/* Top bar */}
      <div className="flex items-center px-4 pt-4 pb-[14px] gap-3 shrink-0">
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
            title="Delete note"
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-2.5 pb-[30px] flex flex-col gap-3.5 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <textarea
          ref={titleElRef}
          className="font-serif text-[28px] border-none bg-transparent text-white outline-none w-full leading-[1.3] overflow-hidden resize-none caret-white/80 placeholder:text-white/30"
          placeholder="Title"
          value={title}
          rows={1}
          onChange={handleTitleChange}
        />
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
  );
}
