import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Feather } from 'lucide-react';

export default function Header({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?';

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };

  return (
    <header className="flex-shrink-0 flex flex-col px-5 pt-4 pb-3 relative z-50 max-w-[430px] mx-auto w-full">
      {/* Top Navbar Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Feather size={22} strokeWidth={2} className="text-white/90" />
          <span className="font-serif text-[22px] font-normal text-white tracking-tight mt-0.5" style={{ textShadow: '0 1px 12px rgba(255,255,255,0.15)' }}>MyDiary</span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            className="w-10 h-10 rounded-full text-white text-[14px] font-bold font-sans flex items-center justify-center transition-all hover:scale-105 active:scale-95 glass-pill-card"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Account menu"
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="frost-dropdown absolute top-[calc(100%+10px)] right-0 min-w-[220px] rounded-2xl p-1.5 z-50">
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <span className="w-8 h-8 rounded-full bg-white/15 border border-white/25 text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                  {initials}
                </span>
                <span className="text-sm text-white/70 overflow-hidden text-ellipsis whitespace-nowrap">
                  {user?.email}
                </span>
              </div>
              <div className="h-px bg-white/10 my-1 w-full" />
              <button 
                className="flex items-center gap-2 w-full px-3 py-2.5 border-none rounded-xl bg-transparent font-sans text-[15px] font-medium cursor-pointer text-[#ff7070] transition-colors hover:bg-red-500/15 text-left" 
                onClick={handleLogout}
              >
                <LogOut size={16} strokeWidth={2.2} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
