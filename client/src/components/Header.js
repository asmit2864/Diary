import React, { useState, useRef, useEffect } from 'react';
import './Header.css';

export default function Header({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  // Derive initials from email
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?';

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };

  return (
    <header className="app-header">
      <span className="header-logo">Diary</span>

      <div className="header-avatar-wrap" ref={menuRef}>
        <button
          className="header-avatar"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Account menu"
        >
          {initials}
        </button>

        {menuOpen && (
          <div className="header-menu">
            <div className="header-menu-user">
              <span className="header-menu-avatar">{initials}</span>
              <span className="header-menu-email">{user?.email}</span>
            </div>
            <div className="header-menu-divider" />
            <button className="header-menu-item danger" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
