import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

// Polyfill for random ID if uuidv4 is not present
const genId = () => Math.random().toString(36).substring(2, 9);

export default function ExpenseEditor({ note: expense, category, cardRect, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(expense?.title || '');
  const [initialTotal, setInitialTotal] = useState(expense?.initialTotal || 0);
  const [entries, setEntries] = useState(() => {
    return (expense?.entries || []).map(e => ({ ...e, tempId: e._id || genId() }));
  });
  const [saved, setSaved] = useState(false);

  // Always-current refs so callbacks never capture stale state
  const titleVal  = useRef(title);
  const initialTotalVal = useRef(initialTotal);
  const entriesVal = useRef(entries);
  const isDirty   = useRef(false);
  const saveTO    = useRef(null);

  // Auto-resize textareas
  const titleElRef = useRef(null);
  const resize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  useEffect(() => {
    resize(titleElRef.current);
    if (!expense?.title && !expense?.entries?.length) {
      setTimeout(() => titleElRef.current?.focus(), 150);
    }
  }, [expense, category]);

  const doSave = useCallback(() => {
    // Before saving, strip tempId
    const cleanEntries = entriesVal.current.map(({ tempId, ...rest }) => rest);
    return onSave({ 
      title: titleVal.current, 
      initialTotal: initialTotalVal.current,
      entries: cleanEntries
    });
  }, [onSave]);

  const scheduleSave = useCallback(() => {
    isDirty.current = true;
    clearTimeout(saveTO.current);
    saveTO.current = setTimeout(async () => {
      await doSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 800);
  }, [doSave]);

  const handleTitleChange = (e) => {
    titleVal.current = e.target.value;
    setTitle(e.target.value);
    resize(e.target);
    scheduleSave();
  };

  const handleInitialTotalChange = (e) => {
    const val = Number(e.target.value) || 0;
    initialTotalVal.current = val;
    setInitialTotal(e.target.value);
    scheduleSave();
  };

  const updateEntry = (id, updates) => {
    const newEntries = entriesVal.current.map(e => e.tempId === id ? { ...e, ...updates } : e);
    entriesVal.current = newEntries;
    setEntries(newEntries);
    scheduleSave();
  };

  const addEntry = () => {
    const newEntries = [...entriesVal.current, { tempId: genId(), amount: '', reason: '', type: 'minus' }];
    entriesVal.current = newEntries;
    setEntries(newEntries);
    scheduleSave();
  };

  const deleteEntry = (id) => {
    const newEntries = entriesVal.current.filter(e => e.tempId !== id);
    entriesVal.current = newEntries;
    setEntries(newEntries);
    scheduleSave();
  };

  const handleClose = async () => {
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && entriesVal.current.length === 0;
    if (isEmpty) {
      onDelete();
      return;
    }
    if (isDirty.current) await doSave();
    onClose();
  };

  const handleDelete = () => {
    clearTimeout(saveTO.current);
    onDelete();
  };

  // Calculate totals
  let total = Number(initialTotalVal.current) || 0;
  let spent = 0;
  entries.forEach(entry => {
    const amt = Number(entry.amount) || 0;
    if (entry.type === 'plus') total += amt;
    else spent += amt;
  });
  const remaining = total - spent;

  const animStyle = React.useMemo(() => {
    if (!cardRect) return {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const editorW = Math.min(vw, 430);
    const editorLeft = (vw - editorW) / 2;
    const tx = (cardRect.left + cardRect.width  / 2) - (editorLeft + editorW / 2);
    const ty = (cardRect.top  + cardRect.height / 2) - vh / 2;
    const sx = cardRect.width  / editorW;
    const sy = cardRect.height / vh;
    return {
      '--tx': `${tx}px`, '--ty': `${ty}px`, '--sx': sx, '--sy': sy,
    };
  }, [cardRect]);

  return (
    <div 
      className="fixed inset-0 z-[200] flex flex-col max-w-[430px] mx-auto origin-center bg-gradient-to-b from-[#7b2fff] via-[#9b44ff_40%] via-[#b06ef3_70%] to-[#d49dff] animate-expandFromCard" 
      style={animStyle}
    >
      {/* Top bar */}
      <div className="flex items-center px-4 pt-4 pb-[14px] gap-3 shrink-0">
        <button 
          className="w-[38px] h-[38px] rounded-full bg-white/20 border border-white/35 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur-md active:bg-white/30 shrink-0 hover:bg-white/25"
          onClick={handleClose}
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        
        <span className="text-[13px] font-semibold bg-white/20 text-white rounded-full h-[38px] px-[14px] inline-flex items-center border border-white/35 uppercase tracking-wide backdrop-blur-md">
          {category}
        </span>
        
        <div className="flex gap-2 ml-auto shrink-0">
          <button 
            className="w-[38px] h-[38px] rounded-full bg-red-400/20 border border-red-400/35 text-[#ff6b6b] flex items-center justify-center cursor-pointer transition-colors backdrop-blur-md active:bg-red-400/35 hover:bg-red-400/25 shrink-0" 
            onClick={handleDelete} 
            title="Delete expense entry"
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-2.5 pb-[90px] flex flex-col gap-3.5 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <textarea
          ref={titleElRef}
          className="font-serif text-[28px] border-none bg-transparent text-white outline-none w-full leading-[1.3] overflow-hidden resize-none caret-white/80 placeholder:text-white/30"
          placeholder="Expense Title"
          value={title}
          rows={1}
          onChange={handleTitleChange}
        />
        
        {/* Stats Row */}
        <div className="flex justify-between items-center bg-white/10 rounded-2xl p-4 mt-2">
          <div className="flex flex-col items-start leading-[1.2]">
            <span className="text-[11px] text-white/50 uppercase tracking-wider font-bold mb-1">Base Amount</span>
            <div className="flex items-center text-[18px] font-bold text-green-300">
              <span className="text-green-300 mr-1 mt-0.5 text-[15px]">₹</span>
              <input
                type="number"
                className="w-[60px] bg-transparent outline-none border-none text-green-300 placeholder:text-green-300/40 p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder="0"
                value={initialTotal === 0 && initialTotalVal.current === 0 ? '' : initialTotal}
                onChange={handleInitialTotalChange}
              />
            </div>
            {total !== (Number(initialTotal) || 0) && (
              <span className="text-[11px] text-white/50 mt-1">Total: ₹{total.toLocaleString()}</span>
            )}
          </div>
          <div className="h-8 w-px bg-white/20 mx-2" />
          <div className="flex flex-col items-center leading-[1.2]">
            <span className="text-[11px] text-white/50 uppercase tracking-wider font-bold mb-1">Spent</span>
            <span className="text-[20px] font-bold text-red-300">₹{spent.toLocaleString()}</span>
          </div>
          <div className="h-8 w-px bg-white/20 mx-2" />
          <div className="flex flex-col items-end leading-[1.2]">
            <span className="text-[11px] text-white/50 uppercase tracking-wider font-bold mb-1">Remaining</span>
            <span className={cn("text-[20px] font-bold", remaining >= 0 ? "text-white" : "text-red-300")}>
              ₹{remaining.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="h-px bg-white/20 shrink-0 w-full my-1" />

        {/* Entries List */}
        <div className="flex flex-col gap-3">
          {entries.map(entry => (
            <div key={entry.tempId} className="flex flex-col gap-2 group relative bg-white/5 p-2 rounded-[22px] border border-white/5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative h-[38px]">
                  {entry.amount ? (
                    <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-white/60 font-semibold pointer-events-none">
                      ₹
                    </span>
                  ) : null}
                  <input
                    type="number"
                    placeholder="Amount"
                    className={cn(
                      "w-full h-full bg-white/10 border-none rounded-full text-white placeholder:text-white/40 outline-none text-[16px] font-semibold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none shadow-sm focus:bg-white/20 transition-colors",
                      entry.amount ? "pl-[28px] pr-4" : "px-4"
                    )}
                    value={entry.amount}
                    onChange={(e) => updateEntry(entry.tempId, { amount: e.target.value })}
                  />
                </div>
                <button
                  className={cn(
                    "w-[42px] h-[38px] rounded-full flex items-center justify-center font-bold text-[18px] transition-all shadow-sm active:scale-95 shrink-0",
                    entry.type === 'plus' ? "bg-emerald-500 text-white" : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80"
                  )}
                  onClick={() => updateEntry(entry.tempId, { type: 'plus' })}
                >
                  +
                </button>
                <button
                  className={cn(
                    "w-[42px] h-[38px] rounded-full flex items-center justify-center font-bold text-[22px] transition-all shadow-sm leading-[0] active:scale-95 shrink-0",
                    entry.type === 'minus' ? "bg-rose-500 text-white" : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80"
                  )}
                  onClick={() => updateEntry(entry.tempId, { type: 'minus' })}
                >
                  -
                </button>
                
                {/* Delete pill */}
                <button
                  className="w-[42px] h-[38px] rounded-full flex items-center justify-center transition-all shadow-sm bg-white/10 text-white/50 hover:bg-red-500/20 hover:text-red-400 active:scale-95 shrink-0"
                  onClick={() => deleteEntry(entry.tempId)}
                  title="Delete Entry"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>
              </div>
              <textarea
                ref={el => { if (el) resize(el); }}
                placeholder="Reason or details..."
                className="w-full min-h-[38px] px-4 py-[8px] bg-white/10 border-none rounded-[19px] text-white placeholder:text-white/40 outline-none text-[15px] shadow-sm focus:bg-white/20 transition-colors resize-none overflow-hidden"
                value={entry.reason}
                rows={1}
                onChange={(e) => {
                  resize(e.target);
                  updateEntry(entry.tempId, { reason: e.target.value });
                }}
              />
            </div>
          ))}
          
          <button 
            className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-[16px] text-white/80 font-semibold mt-2 justify-center"
            onClick={addEntry}
          >
            <Plus size={18} /> Add Entry
          </button>
        </div>
      </div>

      {/* Saved toast */}
      <div className={cn(
        "absolute bottom-9 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white text-[12px] py-1.5 px-5 rounded-full border border-white/30 transition-opacity duration-300 pointer-events-none whitespace-nowrap",
        saved ? "opacity-100" : "opacity-0"
      )}>
        ✓ Saved
      </div>
    </div>
  );
}
