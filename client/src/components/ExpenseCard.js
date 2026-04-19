import React, { useRef } from 'react';
import { cn } from '../lib/utils';

const LONG_PRESS_MS = 500;

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 || 12;
  return `${mo[d.getMonth()]} ${d.getDate()} · ${hr}:${min} ${ampm}`;
}

export default function ExpenseCard({ expense, onClick, selectionMode, selected, onLongPress, onToggleSelect, hidden }) {
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
  const baseAmount = Number(expense.initialTotal) || 0;
  let total = baseAmount;
  let spent = 0;

  entries.forEach(entry => {
    const amount = Number(entry.amount) || 0;
    if (entry.type === 'plus') {
      total += amount;
    } else {
      spent += amount;
    }
  });

  const remaining = Math.max(0, total - spent);
  const debt = Math.max(0, spent - total);

  const isSelected = selected;

  return (
    <div
      ref={cardRef}
      className={cn(
        "glass-pill-card rounded-[14px] px-[14px] pt-[13px] pb-[10px] cursor-pointer relative select-none transition-all duration-200 active:scale-[0.95]",
        isSelected && "z-10"
      )}
      style={{ 
        opacity: hidden ? 0 : (selectionMode && !isSelected ? 0.6 : 1),
        pointerEvents: hidden ? 'none' : 'auto',
        ...(isSelected ? {
          transform: 'scale(0.95)',
          boxShadow: '0 0 0 2.5px rgba(255,255,255,0.95), 0 12px 42px rgba(0,0,0,0.5)',
          borderColor: 'rgba(255,255,255,0.95)'
        } : {})
      }}
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
    >
      <div className="flex items-start justify-between gap-2 mb-[5px]">
        <div className="text-[16px] font-bold leading-[1.3] truncate flex-1">
          {expense.title || 'Untitled Expense'}
        </div>
        <span className="text-[11px] text-white/40 shrink-0 mt-[2px]">
          {formatDateTime(expense.updatedAt || expense.createdAt)}
        </span>
      </div>
      
      <div className="grid grid-cols-3 items-start">
        {/* Left: Base / Total */}
        <div className="flex flex-col">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5">Base</span>
          <span className="text-[15px] font-bold text-green-300">₹{baseAmount.toLocaleString()}</span>
          {total !== baseAmount && (
            <span className="text-[10px] text-white/40 mt-0.5">Total: ₹{total.toLocaleString()}</span>
          )}
        </div>

        {/* Middle: Spent (centered) */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5 text-center">Spent</span>
          <span className="text-[15px] font-bold text-red-300">₹{spent.toLocaleString()}</span>
        </div>

        {/* Right: Remaining / Debt (right-aligned) */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5 text-right">Remaining</span>
          <span className="text-[15px] font-bold text-white/90">
            ₹{remaining.toLocaleString()}
          </span>
          {debt > 0 && (
            <span className="text-[10px] text-red-300 font-bold mt-0.5">Debt: ₹{debt.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
