import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import './NoteEditor.css';

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
  }, [note]);

  // Save using ref values — always fresh
  const doSave = useCallback(() => {
    return onSave({ title: titleVal.current, body: bodyVal.current });
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
    <div className="editor-overlay" style={animStyle}>
      {/* Top bar */}
      <div className="editor-topbar">
        <button className="back-btn" onClick={handleClose}>
          <IoArrowBack size={20} />
        </button>
        <span className="editor-badge">{category}</span>
        <div className="editor-actions">
          <button className="editor-action-btn" onClick={handleDelete} title="Delete note">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="editor-body">
        <textarea
          ref={titleElRef}
          className="editor-title"
          placeholder="Title"
          value={title}
          rows={1}
          onChange={handleTitleChange}
        />
        <div className="editor-divider" />
        <textarea
          ref={bodyElRef}
          className="editor-content"
          placeholder="Start writing..."
          value={body}
          onChange={handleBodyChange}
        />
      </div>

      {/* Saved toast */}
      <div className={`saved-toast ${saved ? 'show' : ''}`}>✓ Saved</div>
    </div>
  );
}
