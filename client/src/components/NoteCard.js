import React, { useRef } from 'react';
import './NoteCard.css';

const LONG_PRESS_MS = 500;

function formatDate(iso) {
  const d = new Date(iso);
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${mo[d.getMonth()]} ${d.getDate()}`;
}

export default function NoteCard({ note, onClick, selectionMode, selected, onLongPress, onToggleSelect }) {
  const timerRef = useRef(null);
  const didLongPress = useRef(false);
  const cardRef = useRef(null);

  const startPress = () => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(note._id);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => clearTimeout(timerRef.current);

  const handleClick = () => {
    if (didLongPress.current) return;
    if (selectionMode) {
      onToggleSelect(note._id);
    } else {
      // Pass the card's screen rect so the editor can animate from it
      const rect = cardRef.current?.getBoundingClientRect() ?? null;
      onClick(note, rect);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`note-card ${selected ? 'note-card--selected' : ''} ${selectionMode && !selected ? 'note-card--dimmed' : ''}`}
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
    >
      {note.title && <div className="note-card-title">{note.title}</div>}
      {note.body && (
        <div className="note-card-body">{note.body}</div>
      )}
      <div className="note-card-date">{formatDate(note.updatedAt || note.createdAt)}</div>
    </div>
  );
}
