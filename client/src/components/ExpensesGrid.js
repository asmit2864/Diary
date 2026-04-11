import React from 'react';
import ExpenseCard from './ExpenseCard';
import { Loader2 } from 'lucide-react';

export default function ExpensesGrid({
  expenses, loading, error,
  onExpenseClick, onExpenseLongPress, onExpenseToggleSelect,
  selectionMode, selectedIds,
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
          <p className="text-base leading-[1.7]">Couldn't load expenses.<br />Check your connection.</p>
        </div>
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div className={containerClasses} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ scrollbarWidth: 'none' }}>
        <div className={stateMsgClasses}>
          <span className="text-[44px] block mb-3.5 opacity-50">💸</span>
          <p className="text-base leading-[1.7]">No expenses yet.<br />Tap + to add one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ scrollbarWidth: 'none' }}>
      <div className="flex flex-col gap-3 items-stretch">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense._id}
            expense={expense}
            onClick={onExpenseClick}
            onLongPress={onExpenseLongPress}
            onToggleSelect={onExpenseToggleSelect}
            selectionMode={selectionMode}
            selected={selectedIds.has(expense._id)}
          />
        ))}
      </div>
    </div>
  );
}
