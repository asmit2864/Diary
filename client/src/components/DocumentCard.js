import React, { useRef } from 'react';
import { cn } from '../lib/utils';
import { FileText } from 'lucide-react';

const LONG_PRESS_MS = 500;

function formatDate(iso) {
  const d = new Date(iso);
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${mo[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function DocumentCard({ doc, onClick, selectionMode, selected, onLongPress, onToggleSelect }) {
  const timerRef = useRef(null);
  const didLongPress = useRef(false);
  const cardRef = useRef(null);

  const startPress = () => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(doc._id);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => clearTimeout(timerRef.current);

  const handleClick = () => {
    if (didLongPress.current) return;
    if (selectionMode) {
      onToggleSelect(doc._id);
    } else {
      const rect = cardRef.current?.getBoundingClientRect() ?? null;
      onClick(doc, rect);
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-white/10 rounded-[14px] p-4 cursor-pointer transition-all duration-150 relative select-none flex gap-4 items-center shadow-sm",
        "active:bg-white/20 active:scale-95 hover:bg-white/15",
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
      <div className="w-[42px] h-[42px] rounded-full bg-blue-400/20 text-[#93c5fd] flex items-center justify-center shrink-0">
        <FileText size={20} strokeWidth={2} />
      </div>
      
      <div className="flex-1 min-w-0">
        {doc.title ? (
          <div className="text-[16px] font-bold mb-1 leading-tight truncate text-white">{doc.title}</div>
        ) : (
          <div className="text-[16px] font-bold mb-1 leading-tight truncate text-white/50 italic">Untitled Document</div>
        )}
        
        {doc.body && (
          <div className="text-[13.5px] text-white/70 truncate">{doc.body}</div>
        )}
      </div>
      
      <div className="text-[12px] text-white/40 shrink-0 ml-2">
        {formatDate(doc.updatedAt || doc.createdAt)}
      </div>
    </div>
  );
}
