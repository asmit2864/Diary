import React, { useState } from 'react';
import AccountCard from './AccountCard';
import { Loader2, Search } from 'lucide-react';

export default function AccountsGrid({
  accounts, loading, error,
  onAccountClick, onAccountLongPress, onAccountToggleSelect,
  selectionMode, selectedIds,
  onTouchStart, onTouchEnd,
  vaultKey, onUpdateInline
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const containerClasses = "flex-1 flex flex-col px-3 pt-2 pb-[86px] overflow-hidden";
  const stateMsgClasses = "flex flex-col items-center justify-center py-20 px-5 text-white/50 text-center mx-auto";

  const filteredAccounts = accounts.filter(acc => {
    const q = searchQuery.toLowerCase();
    const titleMatch = acc.title && acc.title.toLowerCase().includes(q);
    const idMatch = acc.accountId && acc.accountId.toLowerCase().includes(q);
    return titleMatch || idMatch;
  });

  if (loading) {
    return (
      <div className={containerClasses} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className={stateMsgClasses}><Loader2 className="w-9 h-9 animate-spin text-white/80" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className={stateMsgClasses}>
          <span className="text-[44px] block mb-3.5 opacity-50">⚠️</span>
          <p className="text-base leading-[1.7]">Couldn't load accounts.<br />Check your connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      
      {/* Search Bar */}
      <div className="relative mb-4 shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
          <Search className="h-[18px] w-[18px] text-white/40" />
        </div>
        <input
          type="text"
          className="w-full bg-white/10 border-[1.5px] border-white/20 rounded-2xl pl-10 pr-4 py-3 text-[15px] text-white outline-none focus:border-white/50 transition-colors placeholder:text-white/40 backdrop-blur-sm shadow-sm"
          placeholder="Search accounts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden flex flex-col gap-3 content-start pb-4">
        {!accounts.length ? (
          <div className={stateMsgClasses}>
            <span className="text-[44px] block mb-3.5 opacity-50">🔐</span>
            <p className="text-base leading-[1.7]">No accounts saved.<br />Tap + to store credentials.</p>
          </div>
        ) : !filteredAccounts.length ? (
          <div className={stateMsgClasses}>
            <p className="text-base leading-[1.7]">No accounts match "{searchQuery}"</p>
          </div>
        ) : (
          filteredAccounts.map((acc) => (
            <AccountCard
              key={acc._id}
              account={acc}
              onClick={onAccountClick}
              onLongPress={onAccountLongPress}
              onToggleSelect={onAccountToggleSelect}
              selectionMode={selectionMode}
              selected={selectedIds.has(acc._id)}
              onUpdate={onUpdateInline}
              vaultKey={vaultKey}
            />
          ))
        )}
      </div>
    </div>
  );
}
