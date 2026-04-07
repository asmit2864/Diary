import React from 'react';
import { Plus, X, Trash2 } from 'lucide-react';

export default function FAB({ onAdd, selectionMode, selectedCount, onDeleteSelected, onCancelSelection }) {
  // ── Selection mode UI ─────────────────────────────────────────────────────
  if (selectionMode) {
    return (
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3.5 bg-[#1e0a3c]/90 backdrop-blur-xl border border-white/15 rounded-full py-2.5 px-5 shadow-2xl z-[100] animate-in slide-in-from-bottom-5 zoom-in-95 duration-200">
        
        {/* Cancel button */}
        <button 
          className="w-9 h-9 flex items-center justify-center rounded-full border-[1.5px] border-white/40 bg-white/10 text-white transition-colors active:bg-white/25 hover:bg-white/20"
          onClick={onCancelSelection} 
          aria-label="Cancel selection"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Selected count label */}
        <span className="text-[14px] font-semibold text-white/85 whitespace-nowrap">
          {selectedCount} selected
        </span>

        {/* Delete button */}
        <button 
          className="w-[42px] h-[42px] flex items-center justify-center rounded-[14px] bg-red-500/85 text-white transition-all shadow-[0_4px_18px_rgba(255,60,60,0.4)] active:bg-red-500 active:scale-95 hover:bg-red-500/90 border-none ml-1"
          onClick={onDeleteSelected} 
          aria-label="Delete selected notes"
        >
          <Trash2 size={20} />
        </button>
      </div>
    );
  }

  // ── Normal mode UI ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-x-0 bottom-7 mx-auto max-w-[430px] pointer-events-none z-[80]">
      <div className="absolute right-5 bottom-0 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          className="w-[58px] h-[58px] flex items-center justify-center shrink-0 bg-[#b06ef3]/80 backdrop-blur-xl border-[1.5px] border-white/40 rounded-[18px] text-white transition-all duration-250 shadow-[0_8px_32px_rgba(80,0,180,0.4)] hover:bg-[#b06ef3]/90 active:bg-[#b06ef3] active:scale-95"
          onClick={onAdd}
          aria-label="Add new"
        >
          <Plus size={30} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
