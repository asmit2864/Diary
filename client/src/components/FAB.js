import React, { useState, useEffect, useRef } from 'react';
import { TABS, TAB_DOT_COLORS } from '../utils/constants';
import './FAB.css';

export default function FAB({ onCategorySelect, selectionMode, selectedCount, onDeleteSelected, onCancelSelection }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close FAB menu when selection mode activates
  useEffect(() => { if (selectionMode) setOpen(false); }, [selectionMode]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (open && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const handleSelect = (tab) => {
    setOpen(false);
    onCategorySelect(tab);
  };

  // ── Selection mode UI ─────────────────────────────────────────────────────
  if (selectionMode) {
    return (
      <div className="fab-wrap fab-selection-row">
        {/* Cancel button */}
        <button className="fab-cancel-btn" onClick={onCancelSelection} aria-label="Cancel selection">
          ✕
        </button>

        {/* Selected count label */}
        <span className="fab-selected-label">{selectedCount} selected</span>

        {/* Delete button */}
        <button className="fab-delete-btn" onClick={onDeleteSelected} aria-label="Delete selected notes">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    );
  }

  // ── Normal mode UI ────────────────────────────────────────────────────────
  return (
    <>
      {open && <div className="fab-backdrop" onClick={() => setOpen(false)} />}

      <div className="fab-wrap" ref={menuRef}>
        {/* Category menu */}
        <div className={`fab-menu ${open ? 'open' : ''}`}>
          {TABS.map((tab) => (
            <div key={tab} className="fab-item" onClick={() => handleSelect(tab)}>
              <span className="fab-dot" style={{ background: TAB_DOT_COLORS[tab] }} />
              {tab}
            </div>
          ))}
        </div>

        {/* Main + button */}
        <button
          className={`fab-btn ${open ? 'open' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-label="New note"
        >
          +
        </button>
      </div>
    </>
  );
}
