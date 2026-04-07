import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DocumentEditor({ note, category, cardRect, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(note?.title || '');
  const [body, setBody]   = useState(note?.body  || '');
  const [saved, setSaved] = useState(false);

  const titleVal  = useRef(note?.title || '');
  const bodyVal   = useRef(note?.body  || '');
  const isDirty   = useRef(false);
  const saveTO    = useRef(null);

  const titleElRef = useRef(null);
  const bodyElRef  = useRef(null);

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
  }, [note]);

  const doSave = useCallback(() => {
    return onSave({ title: titleVal.current, body: bodyVal.current });
  }, [onSave]);

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

  const handleBodyChange = (e) => {
    bodyVal.current = e.target.value;
    setBody(e.target.value);
    resize(e.target);
    scheduleSave();
  };

  const handleClose = async () => {
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && !bodyVal.current.trim();
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
      className="fixed inset-0 z-[200] flex flex-col max-w-[430px] mx-auto origin-center bg-gradient-to-b from-[#2563eb] via-[#3b82f6] to-[#60a5fa] animate-expandFromCard" 
      style={animStyle}
    >
      <div className="flex items-center px-4 pt-2.5 pb-[14px] gap-3 shrink-0">
        <button 
          className="w-[38px] h-[38px] rounded-full bg-white/20 border border-white/35 text-white flex items-center justify-center transition-colors backdrop-blur-md active:bg-white/30 shrink-0 hover:bg-white/25"
          onClick={handleClose}
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <span className="text-[13px] font-semibold bg-white/20 text-white rounded-full h-[38px] px-[14px] inline-flex items-center border border-white/35 uppercase tracking-wide backdrop-blur-md shadow-sm">
          {category}
        </span>
        <div className="flex gap-2 ml-auto shrink-0">
          <button 
            className="w-[38px] h-[38px] rounded-full bg-red-500/20 border border-white/35 text-white flex items-center justify-center transition-colors backdrop-blur-md active:bg-red-500/35 hover:bg-red-500/40 shrink-0" 
            onClick={handleDelete} 
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 [&::-webkit-scrollbar]:hidden bg-white rounded-t-[32px] mx-0 mb-0 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <textarea
          ref={titleElRef}
          className="font-serif text-[32px] font-bold border-none bg-transparent text-slate-800 outline-none w-full leading-[1.2] overflow-hidden resize-none placeholder:text-slate-300 placeholder:font-normal"
          placeholder="Document Title"
          value={title}
          rows={1}
          onChange={handleTitleChange}
        />
        
        <textarea
          ref={bodyElRef}
          className="font-sans text-[17px] border-none bg-transparent text-slate-600 outline-none w-full leading-[1.8] flex-1 min-h-[220px] overflow-hidden resize-none placeholder:text-slate-300"
          placeholder="Start drafting..."
          value={body}
          onChange={handleBodyChange}
        />
      </div>

      <div className={cn(
        "absolute bottom-9 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur-md text-white text-[12px] py-1.5 px-5 rounded-full shadow-lg transition-opacity duration-300 pointer-events-none whitespace-nowrap",
        saved ? "opacity-100" : "opacity-0"
      )}>
        ✓ Saved
      </div>
    </div>
  );
}
