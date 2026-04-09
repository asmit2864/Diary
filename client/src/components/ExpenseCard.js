import React, { useRef } from 'react';
import { cn } from '../lib/utils';

const LONG_PRESS_MS = 500;

export default function ExpenseCard({ expense, onClick, selectionMode, selected, onLongPress, onToggleSelect }) {
  const timerRef = useRef(null);
  const didLongPress = useRef(false);
  const cardRef = useRef(null);

  const startPress = () => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(expense._id);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => clearTimeout(timerRef.current);

  const handleClick = () => {
    if (didLongPress.current) return;
    if (selectionMode) {
      onToggleSelect(expense._id);
    } else {
      const rect = cardRef.current?.getBoundingClientRect() ?? null;
      onClick(expense, rect);
    }
  };

  // Calculate totals
  const entries = expense.entries || [];
  let total = expense.initialTotal || 0;
  let spent = 0;

  entries.forEach(entry => {
    const amount = Number(entry.amount) || 0;
    if (entry.type === 'plus') {
      total += amount;
    } else {
      spent += amount;
    }
  });

  const remaining = total - spent;

  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-white/10 rounded-[14px] px-[14px] pt-[13px] pb-[10px] cursor-pointer transition-all duration-150 relative select-none",
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
      <div className="text-[16px] font-bold mb-[8px] leading-[1.3] truncate">{expense.title || 'Untitled Expense'}</div>
      
      <div className="flex justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5">Total</span>
          <span className="text-[15px] font-bold text-green-300">₹{total.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5">Spent</span>
          <span className="text-[15px] font-bold text-red-300">₹{spent.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5">Remaining</span>
          <span className={cn("text-[15px] font-bold", remaining >= 0 ? "text-white/90" : "text-red-300")}>
            ₹{remaining.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
