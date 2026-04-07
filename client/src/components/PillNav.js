import React from 'react';
import { cn } from '../lib/utils';
import { TABS } from '../utils/constants';

export default function PillNav({ activeTab, onTabChange }) {
  const activeIndex = Math.max(0, TABS.indexOf(activeTab));

  return (
    <div className="w-full max-w-[430px] mx-auto px-4 py-3 shrink-0">
      <div className="relative flex items-center p-1 bg-white/10 rounded-full border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
        
        {/* Sliding Pill Background */}
        <div 
          className="absolute top-1 bottom-1 left-1 bg-white/20 rounded-full border-[1.5px] border-white/30 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
          style={{ 
            width: 'calc((100% - 8px) / 3)',
            transform: `translateX(${activeIndex * 100}%)` 
          }}
        />

        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              className={cn(
                "relative z-10 flex-1 py-1.5 text-[12px] font-bold tracking-wider uppercase rounded-full transition-colors duration-300",
                isActive ? "text-white" : "text-white/50 hover:text-white/80"
              )}
              onClick={() => onTabChange(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
