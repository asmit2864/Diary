import React, { useRef } from 'react';
import { cn } from '../lib/utils';

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
      className={cn(
        "glass-card rounded-[14px] px-[14px] pt-[13px] pb-[10px] cursor-pointer relative select-none",
        selected && "ring-2 ring-white/60 scale-[0.97]",
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
      {note.title && <div className="text-[16px] font-bold mb-[5px] leading-[1.3] truncate">{note.title}</div>}
      
      {note.body && <div className="text-[14px] text-white/80 leading-[1.45] whitespace-pre-wrap break-words line-clamp-6">{note.body}</div>}
      <div className="text-[12.5px] text-white/50 mt-2 text-right">{formatDate(note.updatedAt || note.createdAt)}</div>
    </div>
  );
}
