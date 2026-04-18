import React from 'react';
import NoteCard from './NoteCard';
import { Loader2, Pencil, AlertCircle } from 'lucide-react';

export default function NotesGrid({
  notes, loading, error,
  onNoteClick, onNoteLongPress, onNoteToggleSelect,
  selectionMode, selectedIds, hiddenNoteId,
  onTouchStart, onTouchEnd,
}) {
  const containerClasses = "flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2 pb-[86px] [&::-webkit-scrollbar]:hidden";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-5 text-white/50 pb-[86px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Loader2 className="w-10 h-10 animate-spin text-white/80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center pb-[120px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex flex-col items-center max-w-[280px]">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20 shadow-lg">
            <AlertCircle size={32} className="text-red-400/80" strokeWidth={2} />
          </div>
          <h3 className="text-[19px] font-bold text-white/90 mb-2">Sync Failed</h3>
        </div>
      </div>
    );
  }

  if (!notes.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center pb-[120px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex flex-col items-center max-w-[280px]">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-xl backdrop-blur-sm">
            <Pencil size={32} className="text-white/60" strokeWidth={2} />
          </div>
          <h3 className="text-[19px] font-bold text-white/90 mb-2">No notes yet</h3>
          <p className="text-[15px] text-white/40 leading-relaxed">
            Tap the + button to capture your thoughts
          </p>
        </div>
      </div>
    );
  }

  const leftCol  = notes.filter((_, i) => i % 2 === 0);
  const rightCol = notes.filter((_, i) => i % 2 !== 0);

  return (
    <div className={containerClasses} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-2.5 items-start">
        <div className="flex-1 flex flex-col gap-2.5">
          {leftCol.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onClick={onNoteClick}
              onLongPress={onNoteLongPress}
              onToggleSelect={onNoteToggleSelect}
              selectionMode={selectionMode}
              selected={selectedIds.has(note._id)}
              hidden={note._id === hiddenNoteId}
            />
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-2.5">
          {rightCol.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onClick={onNoteClick}
              onLongPress={onNoteLongPress}
              onToggleSelect={onNoteToggleSelect}
              selectionMode={selectionMode}
              selected={selectedIds.has(note._id)}
              hidden={note._id === hiddenNoteId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
