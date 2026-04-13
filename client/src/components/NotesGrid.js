import React from 'react';
import NoteCard from './NoteCard';
import { Loader2 } from 'lucide-react';

export default function NotesGrid({
  notes, loading, error,
  onNoteClick, onNoteLongPress, onNoteToggleSelect,
  selectionMode, selectedIds, hiddenNoteId,
  onTouchStart, onTouchEnd,
}) {
  const containerClasses = "flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2 pb-[86px] [&::-webkit-scrollbar]:hidden";
  const stateMsgClasses = "flex flex-col items-center justify-center py-20 px-5 text-white/50 text-center";

  if (loading) {
    return (
      <div className={containerClasses} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ scrollbarWidth: 'none' }}>
        <div className={stateMsgClasses}><Loader2 className="w-9 h-9 animate-spin text-white/80" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ scrollbarWidth: 'none' }}>
        <div className={stateMsgClasses}>
          <span className="text-[44px] block mb-3.5 opacity-50">⚠️</span>
          <p className="text-base leading-[1.7]">Couldn't load notes.<br />Check your connection.</p>
        </div>
      </div>
    );
  }

  if (!notes.length) {
    return (
      <div className={containerClasses} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ scrollbarWidth: 'none' }}>
        <div className={stateMsgClasses}>
          <span className="text-[44px] block mb-3.5 opacity-50">📝</span>
          <p className="text-base leading-[1.7]">No notes yet.<br />Tap + to add one.</p>
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
