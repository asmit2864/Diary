import React, { useRef, useEffect } from 'react';
import { TABS } from '../utils/constants';
import './TabBar.css';

export default function TabBar({ activeTab, onTabChange }) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const active = wrapperRef.current?.querySelector('.tab.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTab]);

  return (
    <div className="tabs-row" ref={wrapperRef}>
      {TABS.map((tab) => (
        <button
          key={tab}
          className={`tab ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
