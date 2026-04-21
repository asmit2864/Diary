import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trash2, Plus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useHardwareBack } from '../hooks/useHardwareBack';
import gsap from 'gsap';
import Draggable from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

// Polyfill for random ID if uuidv4 is not present
const genId = () => Math.random().toString(36).substring(2, 9);
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

/* ── SVG Goo Filter (rendered once, hidden) ───────────────────────── */
const PILL_SHADOW = [
  'inset 0 0 0 1px color-mix(in srgb, #fff 3%, transparent)',
  'inset 1.8px 3px 0px -2px color-mix(in srgb, #fff 27%, transparent)',
  'inset -2px -2px 0px -2px color-mix(in srgb, #fff 24%, transparent)',
  'inset -3px -8px 1px -6px color-mix(in srgb, #fff 18%, transparent)',
  'inset -0.3px -1px 4px 0px color-mix(in srgb, #000 24%, transparent)',
  'inset -1.5px 2.5px 0px -2px color-mix(in srgb, #000 40%, transparent)',
  'inset 0px 3px 4px -2px color-mix(in srgb, #000 40%, transparent)',
  'inset 2px -6.5px 1px -4px color-mix(in srgb, #000 20%, transparent)',
  '0px 1px 5px 0px color-mix(in srgb, #000 20%, transparent)',
  '0px 6px 16px 0px color-mix(in srgb, #000 16%, transparent)',
].join(', ');

function GooFilter() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ position: 'fixed', top: -9999, left: -9999, width: 0, height: 0, pointerEvents: 'none' }}>
      <defs>
        <filter id="goo">
          <feGaussianBlur
            id="SvgjsFeGaussianBlur1000"
            result="SvgjsFeGaussianBlur1000"
            in="SourceGraphic"
            stdDeviation="2"
          ></feGaussianBlur>
          <feColorMatrix
            id="SvgjsFeColorMatrix1001"
            result="SvgjsFeColorMatrix1001"
            in="SvgjsFeGaussianBlur1000"
            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 16 -10"
            type="matrix"
          ></feColorMatrix>
          <feComposite
            id="SvgjsFeComposite1002"
            result="SvgjsFeComposite1002"
            in="SvgjsFeColorMatrix1001"
            operator="atop"
          ></feComposite>
        </filter>
        <filter id="remove-black" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    -255 -255 -255 0 1"
            result="black-pixels"
          />
          <feMorphology
            in="black-pixels"
            operator="dilate"
            radius="0.5"
            result="smoothed"
          />
          <feComposite in="SourceGraphic" in2="smoothed" operator="out" />
        </filter>
      </defs>
    </svg>
  );
}

/* ── Liquid Toggle Component ───────────────────────────────────────── */
function LiquidToggle({ type, onChange }) {
  const toggleRef = useRef(null);
  const isPlus = type === 'plus';

  useEffect(() => {
    const toggle = toggleRef.current;
    if (!toggle) return;

    const config = {
      complete: isPlus ? 100 : 0,
      active: false,
      bounce: true,
      delta: true,
      bubble: true,
    };

    toggle.dataset.mapped = 'false';
    toggle.dataset.delta = 'true';
    toggle.dataset.bounce = 'true';
    toggle.style.setProperty('--complete', config.complete);
    toggle.style.setProperty('--hue', 144);

    const toggleState = async () => {
      toggle.dataset.pressed = 'true';
      if (config.bubble) toggle.dataset.active = 'true';
      await Promise.allSettled(
        !config.bounce ? toggle.getAnimations({ subtree: true }).map(a => a.finished) : []
      );
      
      const pressed = toggle.getAttribute('aria-pressed') === 'true';
      const newComplete = pressed ? 0 : 100;
      
      gsap.timeline({
        onComplete: () => {
          gsap.delayedCall(0.05, () => {
            toggle.dataset.active = 'false';
            toggle.dataset.pressed = 'false';
            toggle.setAttribute('aria-pressed', !pressed ? 'true' : 'false');
            onChange(!pressed ? 'plus' : 'minus');
          });
        }
      }).to(toggle, {
        '--complete': newComplete,
        duration: 0.12,
        delay: config.bounce && config.bubble ? 0.18 : 0,
      });
    };

    const proxy = document.createElement('div');
    const draggableArr = Draggable.create(proxy, {
      allowContextMenu: true,
      handle: toggle,
      onDragStart: function () {
        const toggleBounds = toggle.getBoundingClientRect();
        const pressed = toggle.getAttribute('aria-pressed') === 'true';
        const bounds = pressed
          ? toggleBounds.left - this.pointerX
          : toggleBounds.left + toggleBounds.width - this.pointerX;
        this.dragBounds = bounds;
        toggle.dataset.active = 'true';
      },
      onDrag: function () {
        const pressed = toggle.getAttribute('aria-pressed') === 'true';
        const dragged = this.x - this.startX;
        const complete = gsap.utils.clamp(
          0,
          100,
          pressed
            ? gsap.utils.mapRange(this.dragBounds, 0, 0, 100, dragged)
            : gsap.utils.mapRange(0, this.dragBounds, 0, 100, dragged)
        );
        this.complete = complete;
        gsap.set(toggle, { '--complete': complete, '--delta': Math.min(Math.abs(this.deltaX), 12) });
      },
      onDragEnd: function () {
        gsap.fromTo(toggle, { '--complete': this.complete }, {
          '--complete': this.complete >= 50 ? 100 : 0,
          duration: 0.15,
          onComplete: () => {
            gsap.delayedCall(0.05, () => {
              toggle.dataset.active = 'false';
              toggle.setAttribute('aria-pressed', this.complete >= 50 ? 'true' : 'false');
              onChange(this.complete >= 50 ? 'plus' : 'minus');
            });
          }
        });
      },
      onPress: function () {
        this.__pressTime = Date.now();
        if ('ontouchstart' in window && navigator.maxTouchPoints > 0) {
          toggle.dataset.active = 'true';
        }
      },
      onRelease: function () {
        this.__releaseTime = Date.now();
        gsap.set(toggle, { '--delta': 0 });
        if (
          'ontouchstart' in window &&
          navigator.maxTouchPoints > 0 &&
          ((this.startX !== undefined && this.endX !== undefined && Math.abs(this.endX - this.startX) < 4) ||
            this.endX === undefined)
        ) {
          toggle.dataset.active = 'false';
        }
        if (this.__releaseTime - this.__pressTime <= 150) {
          toggleState();
        }
      }
    });

    const handleKeydown = (e) => {
      if (e.key === 'Enter') toggleState();
      if (e.key === ' ') e.preventDefault();
    };

    const handleKeyup = (e) => {
      if (e.key === ' ') toggleState();
    };

    toggle.addEventListener('keydown', handleKeydown);
    toggle.addEventListener('keyup', handleKeyup);

    toggle.setAttribute('aria-pressed', isPlus ? 'true' : 'false');
    toggle.style.setProperty('--complete', isPlus ? 100 : 0);

    return () => {
      toggle.removeEventListener('keydown', handleKeydown);
      toggle.removeEventListener('keyup', handleKeyup);
      if (draggableArr && draggableArr[0]) draggableArr[0].kill();
    };
  }, [isPlus, onChange]);

  useEffect(() => {
    if (!toggleRef.current) return;
    const pressedStr = isPlus ? 'true' : 'false';
    if (toggleRef.current.getAttribute('aria-pressed') !== pressedStr) {
      toggleRef.current.setAttribute('aria-pressed', pressedStr);
      gsap.to(toggleRef.current, { '--complete': isPlus ? 100 : 0, duration: 0.2 });
    }
  }, [isPlus]);

  return (
    <div className="flex-shrink-0 relative overflow-visible" style={{ width: 88, height: 38 }}>
      <button 
        aria-label="toggle" 
        className="liquid-toggle" 
        ref={toggleRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          margin: 0, 
          transform: 'scale(0.6285)', 
          transformOrigin: 'top left' 
        }}
      >
        <div className="knockout">
          <div className="indicator indicator--masked">
            <div className="mask"></div>
          </div>
        </div>
        <div className="indicator__liquid">
          <div className="shadow"></div>
          <div className="wrapper">
            <div className="liquids">
              <div className="liquid__shadow"></div>
              <div className="liquid__track"></div>
            </div>
          </div>
          <div className="cover"></div>
          <div className="toggle-symbols">
            <span className="ts-minus">−</span>
            <span className="ts-plus">+</span>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ── Entry Row: read-only + edit mode ──────────────────────────────── */
function EntryRow({ entry,isEditing, selectionMode, selected, onActivate, onLongPress, onToggleSelect, onUpdate, onBlurSave, onDelete }) {
  const amountRef = useRef(null);
  const rowRef = useRef(null);
  const timerRef = useRef(null);
  const didLongPress = useRef(false);

  useEffect(() => {
    if (isEditing && amountRef.current) {
      setTimeout(() => amountRef.current?.focus(), 50);
    }
  }, [isEditing]);

  const startPress = () => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(entry.tempId);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => clearTimeout(timerRef.current);

  const handleClick = (e) => {
    if (didLongPress.current) return;
    if (selectionMode) {
      onToggleSelect(entry.tempId);
    } else {
      onActivate();
    }
  };

  const handleRowBlur = useCallback((e) => {
    // If focus moves outside this row entirely
    if (rowRef.current && !rowRef.current.contains(e.relatedTarget)) {
      onBlurSave();
    }
  }, [onBlurSave]);

  const resize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  const amt = Number(entry.amount) || 0;
  const isPositive = entry.type === 'plus';

  if (!isEditing) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-[16px] py-[11px] rounded-2xl bg-white/10 cursor-pointer active:scale-[0.98] transition-transform select-none relative",
          selected && "ring-2 ring-white/60 scale-[0.97]",
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
        <span className="text-[14px] text-white/80 truncate flex-1">
          {entry.reason || <span className="text-white/30 italic">No reason</span>}
        </span>
        <div className="flex flex-col items-end shrink-0">
          <span className={cn(
            "text-[16px] font-bold leading-tight",
            isPositive ? "text-green-300" : "text-red-300"
          )}>
            {isPositive ? '+' : '−'}₹{amt.toLocaleString()}
          </span>
          {(entry.updatedAt || entry.createdAt) && (
            <span className="text-[10.5px] text-white/35 mt-0.5">
              {formatDateTime(entry.updatedAt || entry.createdAt)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rowRef}
      className="flex flex-col gap-2 bg-white/10 p-3 rounded-2xl"
      onBlur={handleRowBlur}
    >
      {/* Amount + toggle row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative h-[38px]">
          {entry.amount ? (
            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-white/60 font-semibold pointer-events-none">₹</span>
          ) : null}
          <input
            ref={amountRef}
            type="number"
            placeholder="Amount"
            className={cn(
              "w-full h-full bg-white/10 border-none rounded-full text-white placeholder:text-white/40 outline-none text-[16px] font-semibold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none shadow-sm focus:bg-white/20 transition-colors",
              entry.amount ? "pl-[28px] pr-4" : "px-4"
            )}
            value={entry.amount}
            onChange={(e) => onUpdate({ amount: e.target.value })}
          />
        </div>
        <LiquidToggle
          type={entry.type}
          onChange={(newType) => onUpdate({ type: newType })}
        />
      </div>

      {/* Reason textarea */}
      <textarea
        ref={el => { if (el) resize(el); }}
        placeholder="Reason or details..."
        className="w-full min-h-[38px] px-4 py-[8px] bg-white/10 border-none rounded-[19px] text-white placeholder:text-white/40 outline-none text-[15px] shadow-sm focus:bg-white/20 transition-colors resize-none overflow-hidden"
        value={entry.reason}
        rows={1}
        onChange={(e) => {
          resize(e.target);
          onUpdate({ reason: e.target.value });
        }}
      />
    </div>
  );
}

/* ── Main ExpenseEditor ────────────────────────────────────────────── */
export default function ExpenseEditor({ note: expense, category, cardRect, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(expense?.title || '');
  const [initialTotal, setInitialTotal] = useState(expense?.initialTotal || 0);
  const [entries, setEntries] = useState(() => {
    return (expense?.entries || []).map(e => ({ ...e, tempId: e._id || genId() }));
  });
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState(new Set());
  const saved = false;
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectionMode = selectedEntryIds.size > 0;

  // Track visual viewport to lift buttons above mobile keyboard
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    if (!window.visualViewport) return;
    const handleViewportChange = () => {
      // Calculate how much the visual viewport has shrunk from the window innerHeight
      const offset = Math.max(0, window.innerHeight - window.visualViewport.height);
      setKeyboardOffset(offset);
    };
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange); // iOS fires scroll during keyboard animation
    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Always-current refs so callbacks never capture stale state
  const titleVal        = useRef(title);
  const initialTotalVal = useRef(initialTotal);
  const entriesVal      = useRef(entries);
  const isDirty         = useRef(false);
  const saveTO          = useRef(null);

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

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const doSave = useCallback(() => {
    const validEntries = entriesVal.current.filter(e => String(e.amount).trim() !== '' || String(e.reason).trim() !== '');
    const cleanEntries = validEntries.map(({ tempId, ...rest }) => ({ 
      ...rest, 
      amount: Number(rest.amount) || 0 
    }));
    return onSave({
      title: titleVal.current,
      initialTotal: initialTotalVal.current,
      entries: cleanEntries
    });
  }, [onSave]);

  const scheduleSave = useCallback(() => {
    isDirty.current = true;
  }, []);

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
    const newEntries = entriesVal.current.map(e => e.tempId === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e);
    entriesVal.current = newEntries;
    setEntries(newEntries);
    scheduleSave();
  };

  const addEntry = () => {
    const newEntry = { tempId: genId(), amount: '', reason: '', type: 'minus', createdAt: new Date().toISOString() };
    const newEntries = [...entriesVal.current, newEntry];
    entriesVal.current = newEntries;
    setEntries(newEntries);
    setActiveEntryId(newEntry.tempId);
    scheduleSave();
  };

  const deleteEntry = useCallback((id) => {
    const newEntries = entriesVal.current.filter(e => e.tempId !== id);
    entriesVal.current = newEntries;
    setEntries(newEntries);
    setActiveEntryId(prev => (prev === id ? null : prev));
    setSelectedEntryIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    scheduleSave();
  }, [scheduleSave]);

  const handleEntryLongPress = (id) => {
    if (activeEntryId) return; // Don't allow selection while editing
    setSelectedEntryIds(new Set([id]));
  };

  const handleEntryToggleSelect = (id) => {
    setSelectedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCancelSelection = () => {
    setSelectedEntryIds(new Set());
  };

  const handleDeleteSelectedEntries = () => {
    const newEntries = entriesVal.current.filter(e => !selectedEntryIds.has(e.tempId));
    entriesVal.current = newEntries;
    setEntries(newEntries);
    setSelectedEntryIds(new Set());
    scheduleSave();
  };

  // Called when an entry's edit form loses focus
  const handleEntryBlurSave = useCallback((id) => {
    const entry = entriesVal.current.find(e => e.tempId === id);
    if (!entry) return;
    const isEmpty = !String(entry.amount).trim() && !String(entry.reason).trim();
    if (isEmpty) {
      deleteEntry(id);
    } else {
      setActiveEntryId(null);
      scheduleSave();
    }
  }, [scheduleSave, deleteEntry]);

  const handleClose = useCallback(async () => {
    if (isSaving) return;
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && entriesVal.current.length === 0;
    if (isEmpty) { onDelete(); return; }
    if (isDirty.current) {
      setIsSaving(true);
      try { await doSave(); } catch (e) { console.error(e); }
    }
    setIsOpen(false);
    setTimeout(() => onClose(), 400);
  }, [onDelete, onClose, doSave, isSaving]);

  useHardwareBack(handleClose);

  const handleDelete = () => {
    clearTimeout(saveTO.current);
    onDelete();
  };

  const handleForceClose = async () => {
    if (isSaving) return;
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && entriesVal.current.length === 0;
    if (isEmpty) { onDelete(); return; }
    if (isDirty.current) {
      setIsSaving(true);
      try { await doSave(); } catch (e) { console.error(e); }
    }
    onClose(); // instant, no animation delay
  };

  // Calculate totals
  let total = Number(initialTotalVal.current) || 0;
  let spent = 0;
  entries.forEach(entry => {
    const amt = Number(entry.amount) || 0;
    if (entry.type === 'plus') total += amt;
    else spent += amt;
  });
  const remaining = Math.max(0, total - spent);
  const debt = Math.max(0, spent - total);

  return (
    <>
      {/* SVG Goo filter — rendered once per editor mount */}
      <GooFilter />

      <style>{`
        @keyframes selectionBarIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .gn-add {
          border: none;
          cursor: pointer;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: rgba(255,255,255,0.92);
          flex-shrink: 0;
          transition: scale 200ms cubic-bezier(0.5, 0, 0, 1);
        }
        .gn-add:hover  { scale: 1.09; }
        .gn-add:active { scale: 0.90; }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[190] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.3)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none">
        <div className="w-full max-w-[430px] h-full flex flex-col p-3">
          <div
            className="relative w-full flex-1 flex flex-col pointer-events-auto overflow-hidden glass-pill-card"
            style={{
              borderRadius: '16px',
              transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(40px)',
              opacity: isOpen ? 1 : 0,
              transition: 'transform 0.45s cubic-bezier(0.5, 1.5, 0.5, 1), opacity 0.35s ease-out',
              willChange: 'transform, opacity'
            }}
          >
            <div className="absolute inset-0 flex flex-col w-full h-full">

              {/* Scrollable body */}
              <div
                className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none' }}
              >
                {/* ── Title row ── */}
                <div className="flex items-center justify-between gap-3 w-full min-h-[42px]">
                  <textarea
                    ref={titleElRef}
                    className="font-serif text-[28px] border-none bg-transparent text-white outline-none flex-1 leading-[1.3] overflow-hidden resize-none caret-white/80 placeholder:text-white/30 pt-0.5"
                    placeholder="Expense Title"
                    value={title}
                    rows={1}
                    onChange={handleTitleChange}
                  />
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      className={cn("w-[42px] h-[42px] rounded-full flex items-center justify-center transition-transform shrink-0 glass-pill-card",
                        isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"
                      )}
                      onClick={isSaving ? undefined : handleDelete}
                      title="Delete expense"
                    >
                      <Trash2 size={18} className="text-[#ff6b6b]" strokeWidth={2.5} />
                    </button>
                    <button
                      className={cn("w-[42px] h-[42px] rounded-full text-white flex items-center justify-center transition-transform shrink-0 glass-pill-card",
                        isSaving ? "cursor-not-allowed" : "cursor-pointer active:scale-95"
                      )}
                      onClick={isSaving ? undefined : handleForceClose}
                      title="Close expense"
                    >
                      {isSaving ? <Loader2 size={20} className="animate-spin text-white/80" /> : <X size={20} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/20 shrink-0 w-full" />

                {/* ── Stats row ── */}
                <div className="bg-white/10 rounded-2xl p-4">
                  {/* Labels row */}
                  <div className="grid grid-cols-3 mb-1">
                    <span className="text-[11px] text-white/50 uppercase tracking-wider font-bold">Base Amount</span>
                    <span className="text-[11px] text-white/50 uppercase tracking-wider font-bold text-center">Spent</span>
                    <span className="text-[11px] text-white/50 uppercase tracking-wider font-bold text-right">Remaining</span>
                  </div>
                  {/* Amounts row */}
                  <div className="grid grid-cols-3 items-center gap-1">
                    <div className="flex items-center text-[16px] font-bold text-green-300 min-w-0">
                      <span className="text-green-300 mr-0.5 text-[13px] shrink-0">₹</span>
                      <input
                        type="number"
                        className="min-w-0 flex-1 bg-transparent outline-none border-none text-green-300 placeholder:text-green-300/40 p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        placeholder="0"
                        value={initialTotal === 0 && initialTotalVal.current === 0 ? '' : initialTotal}
                        onChange={handleInitialTotalChange}
                      />
                    </div>
                    <span className="text-[16px] font-bold text-red-300 text-center truncate">₹{spent.toLocaleString()}</span>
                  <span className="text-[16px] font-bold text-right truncate text-white">
                    ₹{remaining.toLocaleString()}
                  </span>
                </div>
                {/* Total / Debt sub-labels */}
                <div className="grid grid-cols-3 mt-1">
                  <div>
                    {total !== (Number(initialTotal) || 0) && (
                      <span className="text-[11px] text-white/50 block">
                        Total: ₹{total.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div />
                  <div className="text-right">
                    {debt > 0 && (
                      <span className="text-[11px] text-red-300 font-bold block">
                        Debt: ₹{debt.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                </div>

                <div className="h-px bg-white/20 shrink-0 w-full" />

                {/* ── Entries list ── */}
                <div className="flex flex-col gap-2.5 pb-24">
                  {entries.map(entry => (
                    <EntryRow
                      key={entry.tempId}
                      entry={entry}
                      isEditing={activeEntryId === entry.tempId}
                      selectionMode={selectionMode}
                      selected={selectedEntryIds.has(entry.tempId)}
                      onActivate={() => setActiveEntryId(entry.tempId)}
                      onLongPress={handleEntryLongPress}
                      onToggleSelect={handleEntryToggleSelect}
                      onUpdate={(updates) => updateEntry(entry.tempId, updates)}
                      onBlurSave={() => handleEntryBlurSave(entry.tempId)}
                      onDelete={() => deleteEntry(entry.tempId)}
                    />
                  ))}
                </div>
              </div>

              {/* Selection Overlay — matches FloatingNavbar pattern */}
              {selectionMode && (
                <div style={{
                  position: 'absolute',
                  bottom: 24 + keyboardOffset,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 220,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'bottom 0.1s ease-out'
                }}>
                  {/* Label pill */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    height: 58, padding: '0 20px', borderRadius: 999,
                    background: 'rgba(187, 187, 188, 0.12)',
                    backdropFilter: 'blur(14px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(14px) saturate(180%)',
                    boxShadow: PILL_SHADOW,
                    overflow: 'hidden',
                    animation: 'selectionBarIn 220ms cubic-bezier(0.4, 0, 0.2, 1) both',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
                      {selectedEntryIds.size} selected
                    </span>
                  </div>

                  {/* Cancel button */}
                  <button
                    className="gn-add"
                    onClick={handleCancelSelection}
                    aria-label="Cancel selection"
                    style={{
                      width: 58, height: 58,
                      background: 'rgba(187, 187, 188, 0.12)',
                      backdropFilter: 'blur(14px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(14px) saturate(180%)',
                      boxShadow: PILL_SHADOW,
                      overflow: 'hidden',
                      animation: 'selectionBarIn 220ms cubic-bezier(0.4, 0, 0.2, 1) both',
                    }}
                  >
                    <X size={22} strokeWidth={2.5} />
                  </button>

                  {/* Delete button */}
                  <button
                    className="gn-add"
                    onClick={handleDeleteSelectedEntries}
                    aria-label="Delete selected"
                    style={{
                      width: 58, height: 58,
                      background: 'rgba(187, 187, 188, 0.12)',
                      backdropFilter: 'blur(14px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(14px) saturate(180%)',
                      boxShadow: PILL_SHADOW,
                      color: 'hsl(0, 94%, 82%)',
                      overflow: 'hidden',
                      animation: 'selectionBarIn 220ms cubic-bezier(0.4, 0, 0.2, 1) both',
                    }}
                  >
                    <Trash2 size={22} strokeWidth={2.2} />
                  </button>
                </div>
              )}

              {/* Floating Add Button */}
              {!selectionMode && (
                <button
                  className="absolute right-6 w-[62px] h-[62px] rounded-full flex items-center justify-center glass-pill-card transition-all active:scale-90 shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[210] shrink-0"
                  style={{ bottom: 24 + keyboardOffset, transition: 'bottom 0.1s ease-out' }}
                  onClick={addEntry}
                  title="Add Entry"
                >
                  <Plus size={30} strokeWidth={2.5} />
                </button>
              )}

              {/* Saved toast */}
              <div 
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white text-[12px] py-1.5 px-5 rounded-full border border-white/30 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-[210]",
                  saved ? "opacity-100" : "opacity-0"
                )}
                style={{ bottom: 32 + keyboardOffset, transition: saved ? 'bottom 0.1s ease-out' : 'bottom 0.1s ease-out, opacity 0.3s' }}
              >
                ✓ Saved
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
