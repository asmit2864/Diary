import React from 'react';
import ExpenseCard from './ExpenseCard';
import { Loader2, Receipt, AlertCircle } from 'lucide-react';

export default function ExpensesGrid({
  expenses, loading, error,
  onExpenseClick, onExpenseLongPress, onExpenseToggleSelect,
  selectionMode, selectedIds, hiddenExpenseId,
  onTouchStart, onTouchEnd,
}) {
  const containerClasses = "flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2 pb-[86px] [&::-webkit-scrollbar]:hidden";
  const stateMsgClasses = "flex flex-col items-center justify-center py-20 px-5 text-white/50 text-center";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-5 text-white/50 pb-[86px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Loader2 className="w-10 h-10 animate-spin text-white/80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center pb-[120px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex flex-col items-center max-w-[280px]">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20 shadow-lg">
            <AlertCircle size={32} className="text-red-400/80" strokeWidth={2} />
          </div>
          <h3 className="text-[19px] font-bold text-white/90 mb-2">Sync Failed</h3>
        </div>
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center pb-[120px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex flex-col items-center max-w-[280px]">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-xl backdrop-blur-sm">
            <Receipt size={32} className="text-white/60" strokeWidth={2} />
          </div>
          <h3 className="text-[19px] font-bold text-white/90 mb-2">No expenses yet</h3>
          <p className="text-[15px] text-white/40 leading-relaxed">
            Tap the + button to start tracking your budget
          </p>
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
            hidden={expense._id === hiddenExpenseId}
          />
        ))}
      </div>
    </div>
  );
}
