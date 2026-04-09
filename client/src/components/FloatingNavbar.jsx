import React, { useState, useEffect, useRef } from "react";
import { Book, Shield, File, IndianRupee, Plus, X, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

const TABS = ['Notes', 'Expenses', 'Documents', 'Accounts'];

export default function FloatingNavbar({ 
  activeTab, 
  setActiveTab, 
  onAdd,
  selectionMode,
  selectedCount,
  onDeleteSelected,
  onCancelSelection
}) {
  const prevTabRef = useRef(activeTab);
  const [pillKey, setPillKey] = useState(0);
  const animRef = useRef('slideInFade');

  useEffect(() => {
    if (activeTab === prevTabRef.current) return;
    const prevIdx = TABS.indexOf(prevTabRef.current);
    const nextIdx = TABS.indexOf(activeTab);
    animRef.current = nextIdx > prevIdx ? 'slideInLeft' : 'slideInRight';
    prevTabRef.current = activeTab;
    setPillKey(k => k + 1); // force remount of pill div
  }, [activeTab]);

  if (selectionMode) {
    return (
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3.5 bg-[#1e0a3c]/90 backdrop-blur-xl border border-white/15 rounded-full py-2.5 px-5 z-[100]">
        <button 
          className="w-9 h-9 flex items-center justify-center rounded-full border-[1.5px] border-white/40 bg-white/10 text-white transition-colors active:bg-white/25 hover:bg-white/20"
          onClick={onCancelSelection}
          aria-label="Cancel selection"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
        <span className="text-[14px] font-semibold text-white/85 whitespace-nowrap">
          {selectedCount} selected
        </span>
        <button 
          className="w-[42px] h-[42px] flex items-center justify-center rounded-[14px] bg-red-500/85 text-white transition-all active:bg-red-500 active:scale-95 hover:bg-red-500/90 border-none ml-1"
          onClick={onDeleteSelected}
          aria-label="Delete selected"
        >
          <Trash2 size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[30px] left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">

      {/* Section label pill */}
      <div
        key={pillKey}
        style={{ animation: `${animRef.current} 0.28s cubic-bezier(0.22, 1, 0.36, 1) both` }}
        className="px-4 h-[22px] inline-flex items-center rounded-full bg-white/15 backdrop-blur-xl border border-white/20 pointer-events-none"
      >
        <span style={{ lineHeight: '22px', display: 'block', transform: 'translateY(0.75px)' }} className="text-white text-[11px] font-semibold tracking-[0.15em] uppercase">
          {activeTab}
        </span>
      </div>

      {/* Nav bar */}
      <nav className="flex items-center justify-between w-full max-w-[400px] rounded-full border border-white/20 bg-[#ffffff10] backdrop-blur-2xl p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] pointer-events-auto">
        
        <button
          className={cn("rounded-full w-12 h-12 flex items-center justify-center transition-all", activeTab === 'Notes' ? 'text-white bg-white/20' : 'text-white/50 hover:text-white hover:bg-white/10 active:bg-transparent')}
          onClick={(e) => { e.currentTarget.blur(); setActiveTab && setActiveTab('Notes'); }}
        >
          <Book className="h-[22px] w-[22px]" />
        </button>

        <button
          className={cn("rounded-full w-12 h-12 flex items-center justify-center transition-all", activeTab === 'Expenses' ? 'text-white bg-white/20' : 'text-white/50 hover:text-white hover:bg-white/10 active:bg-transparent')}
          onClick={(e) => { e.currentTarget.blur(); setActiveTab && setActiveTab('Expenses'); }}
        >
          <IndianRupee className="h-[22px] w-[22px]" />
        </button>

        <button
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white text-[#9b44ff] hover:bg-white/90 shadow-[0_4px_14px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform shrink-0"
          onClick={() => onAdd(activeTab)}
          aria-label="Add new"
        >
          <Plus className="h-7 w-7 stroke-[2.5]" />
        </button>

        <button
          className={cn("rounded-full w-12 h-12 flex items-center justify-center transition-all", activeTab === 'Documents' ? 'text-white bg-white/20' : 'text-white/50 hover:text-white hover:bg-white/10 active:bg-transparent')}
          onClick={(e) => { e.currentTarget.blur(); setActiveTab && setActiveTab('Documents'); }}
        >
          <File className="h-[22px] w-[22px]" />
        </button>

        <button
          className={cn("rounded-full w-12 h-12 flex items-center justify-center transition-all", activeTab === 'Accounts' ? 'text-white bg-white/20' : 'text-white/50 hover:text-white hover:bg-white/10 active:bg-transparent')}
          onClick={(e) => { e.currentTarget.blur(); setActiveTab && setActiveTab('Accounts'); }}
        >
          <Shield className="h-[22px] w-[22px]" />
        </button>
      </nav>
    </div>
  );
}
