import React, { useState } from 'react';
import DocumentCard from './DocumentCard';
import { Loader2, Search, FolderOpen, AlertCircle } from 'lucide-react';

export default function DocumentsGrid({
  documents, loading, error,
  onDocumentClick, onDocumentLongPress, onDocumentToggleSelect,
  selectionMode, selectedIds,
  onTouchStart, onTouchEnd, vaultKey
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const containerClasses = "flex-1 flex flex-col px-3 pt-2 pb-[86px] overflow-hidden";
  const stateMsgClasses = "flex flex-col items-center justify-center py-20 px-5 text-white/50 text-center mx-auto";

  const filteredDocs = documents.filter(doc => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const titleMatch = doc.title && doc.title.toLowerCase().includes(q);
    const bodyMatch = doc.body && doc.body.toLowerCase().includes(q);
    return titleMatch || bodyMatch;
  });

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

  if (!documents.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center pb-[120px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex flex-col items-center max-w-[280px]">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-xl backdrop-blur-sm">
            <FolderOpen size={32} className="text-white/60" strokeWidth={2} />
          </div>
          <h3 className="text-[19px] font-bold text-white/90 mb-2">No documents yet</h3>
          <p className="text-[15px] text-white/40 leading-relaxed">
            Tap the + button to secure your first document
          </p>
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
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden flex flex-col gap-2.5 content-start pb-4">
        {!filteredDocs.length ? (
          <div className={stateMsgClasses}>
            <p className="text-base leading-[1.7]">No documents match "{searchQuery}"</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <DocumentCard
              key={doc._id}
              doc={doc}
              onClick={onDocumentClick}
              onLongPress={onDocumentLongPress}
              onToggleSelect={onDocumentToggleSelect}
              selectionMode={selectionMode}
              selected={selectedIds.has(doc._id)}
              vaultKey={vaultKey}
            />
          ))
        )}
      </div>
    </div>
  );
}
