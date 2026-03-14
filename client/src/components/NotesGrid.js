import React from 'react';
import NoteCard from './NoteCard';
import './NotesGrid.css';

export default function NotesGrid({
  notes, loading, error,
  onNoteClick, onNoteLongPress, onNoteToggleSelect,
  selectionMode, selectedIds,
  onTouchStart, onTouchEnd,
}) {
  if (loading) {
    return (
      <div className="notes-area" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="state-msg"><div className="spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notes-area" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="state-msg">
          <span className="state-icon">⚠️</span>
          <p>Couldn't load notes.<br />Check your connection.</p>
        </div>
      </div>
    );
  }

  if (!notes.length) {
    return (
      <div className="notes-area" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="state-msg">
          <span className="state-icon">📝</span>
          <p>No notes yet.<br />Tap + to add one.</p>
        </div>
      </div>
    );
  }

  const leftCol  = notes.filter((_, i) => i % 2 === 0);
  const rightCol = notes.filter((_, i) => i % 2 !== 0);

  return (
    <div className="notes-area" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="notes-grid">
        <div className="notes-col">
          {leftCol.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onClick={onNoteClick}
              onLongPress={onNoteLongPress}
              onToggleSelect={onNoteToggleSelect}
              selectionMode={selectionMode}
              selected={selectedIds.has(note._id)}
            />
          ))}
        </div>
        <div className="notes-col">
          {rightCol.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onClick={onNoteClick}
              onLongPress={onNoteLongPress}
              onToggleSelect={onNoteToggleSelect}
              selectionMode={selectionMode}
              selected={selectedIds.has(note._id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
