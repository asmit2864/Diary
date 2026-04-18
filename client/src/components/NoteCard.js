import React, { useRef } from 'react';
import { cn } from '../lib/utils';

const LONG_PRESS_MS = 500;

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 || 12;
  return `${mo[d.getMonth()]} ${d.getDate()} · ${hr}:${min} ${ampm}`;
}

export default function NoteCard({ note, onClick, selectionMode, selected, onLongPress, onToggleSelect, hidden }) {
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

  const isSelected = selected;

  return (
    <div
      ref={cardRef}
      className={cn(
        "glass-pill-card rounded-[14px] px-[14px] pt-[13px] pb-[10px] cursor-pointer relative select-none transition-all duration-200 active:scale-[0.95]",
        isSelected && "z-10"
      )}
      style={{ 
        opacity: hidden ? 0 : (selectionMode && !isSelected ? 0.6 : 1),
        pointerEvents: hidden ? 'none' : 'auto',
        ...(isSelected ? {
          transform: 'scale(0.95)',
          boxShadow: '0 0 0 2px rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.4)',
          borderColor: 'rgba(255,255,255,0.8)'
        } : {})
      }}
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
    >
      <div className="flex items-start justify-between gap-2 mb-[5px]">
        <div className="text-[16px] font-bold leading-[1.3] truncate flex-1">
          {note.title || (note.body ? note.body.split('\n')[0].substring(0, 30) : 'Untitled Note')}
        </div>
        <span className="text-[11px] text-white/40 shrink-0 mt-[2px]">
          {formatDateTime(note.updatedAt || note.createdAt)}
        </span>
      </div>
      
      {note.body && <div className="text-[14px] text-white/80 leading-[1.45] whitespace-pre-wrap break-words line-clamp-6">{note.body}</div>}
    </div>
  );
}
