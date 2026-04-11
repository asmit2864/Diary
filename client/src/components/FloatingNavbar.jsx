import React, { useRef, useLayoutEffect } from "react";
import { Book, Shield, File, IndianRupee, Plus, X, Trash2 } from "lucide-react";

const TABS = ['Notes', 'Expenses', 'Documents', 'Accounts'];

const TAB_ICONS = {
  Notes:     <Book        size={21} strokeWidth={2.2} />,
  Expenses:  <IndianRupee size={21} strokeWidth={2.2} />,
  Documents: <File        size={21} strokeWidth={2.2} />,
  Accounts:  <Shield      size={21} strokeWidth={2.2} />,
};

// ── Faithful port of the dark-mode glass shadows from theme-switcher.html ──
// dark mode: --glass-reflex-light: 0.3, --glass-reflex-dark: 2
const PILL_SHADOW = [
  'inset 0 0 0 1px color-mix(in srgb, #fff 3%, transparent)',          // 0.3*10%
  'inset 1.8px 3px 0px -2px color-mix(in srgb, #fff 27%, transparent)',// 0.3*90%
  'inset -2px -2px 0px -2px color-mix(in srgb, #fff 24%, transparent)',// 0.3*80%
  'inset -3px -8px 1px -6px color-mix(in srgb, #fff 18%, transparent)',// 0.3*60%
  'inset -0.3px -1px 4px 0px color-mix(in srgb, #000 24%, transparent)',// 2*12%
  'inset -1.5px 2.5px 0px -2px color-mix(in srgb, #000 40%, transparent)',// 2*20%
  'inset 0px 3px 4px -2px color-mix(in srgb, #000 40%, transparent)',  // 2*20%
  'inset 2px -6.5px 1px -4px color-mix(in srgb, #000 20%, transparent)',// 2*10%
  '0px 1px 5px 0px color-mix(in srgb, #000 20%, transparent)',         // 2*10%
  '0px 6px 16px 0px color-mix(in srgb, #000 16%, transparent)',        // 2*8%
].join(', ');

const IND_SHADOW = [
  'inset 0 0 0 1px color-mix(in srgb, #fff 3%, transparent)',
  'inset 2px 1px 0px -1px color-mix(in srgb, #fff 27%, transparent)',
  'inset -1.5px -1px 0px -1px color-mix(in srgb, #fff 24%, transparent)',
  'inset -2px -6px 1px -5px color-mix(in srgb, #fff 18%, transparent)',
  'inset -1px 2px 3px -1px color-mix(in srgb, #000 40%, transparent)',
  'inset 0px -4px 1px -2px color-mix(in srgb, #000 20%, transparent)',
  '0px 3px 6px 0px color-mix(in srgb, #000 16%, transparent)',
].join(', ');

// ── Dimensions (scaled for 4 options) ──
// Original HTML: 3 options × 68px + 2 gaps × 8px + 2 padding × 12px = 244px pill
// Our 4 options: 4 × 62px + 3 gaps × 6px + 2 padding × 6px = 278px pill
const OPTION_W    = 62;   // px — default (overridden dynamically when pill stretches)
const GAP         = 6;    // px — gap between buttons
const PAD         = 6;    // px — pill left/right padding
const PILL_H      = 58;   // px — pill height
const IND_INSET   = 4;    // px — indicator inset from pill edges (top/left)
// IND_W and STEP are derived from real measured width inside the pill (see pillRef logic)
const IND_BASE_X  = IND_INSET; // px — indicator base left for tab index 0

export default function FloatingNavbar({
  activeTab,
  setActiveTab,
  onAdd,
  selectionMode,
  selectedCount,
  onDeleteSelected,
  onCancelSelection,
}) {
  const activeIdx    = TABS.indexOf(activeTab);
  const prevIdxRef   = useRef(activeIdx);
  const indicatorRef = useRef(null);
  const pillRef      = useRef(null);
  const stepRef      = useRef(OPTION_W + GAP); // updated on first paint

  // ── Measure real step size from rendered pill ─────────────────────
  // Runs once after first paint to learn the actual option slot width.
  useLayoutEffect(() => {
    if (!pillRef.current) return;
    const pill = pillRef.current;
    const totalInnerW = pill.clientWidth - PAD * 2;
    // 4 options + 3 gaps fill the inner width
    const optW = (totalInnerW - GAP * (TABS.length - 1)) / TABS.length;
    stepRef.current = optW + GAP;

    // Also set indicator's initial translate (no animation)
    if (indicatorRef.current) {
      indicatorRef.current.style.width = `${optW + (PAD - IND_INSET) * 2}px`;
      indicatorRef.current.style.translate = `${activeIdx * stepRef.current}px 0`;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Animation restart via useLayoutEffect ─────────────────────────
  useLayoutEffect(() => {
    const next = TABS.indexOf(activeTab);
    const prev = prevIdxRef.current;
    if (next === prev) return;

    const goingRight = next > prev;
    prevIdxRef.current = next;

    const el = indicatorRef.current;
    if (!el) return;

    // Update slide position using measured step
    el.style.translate = `${next * stepRef.current}px 0`;

    // transform-origin:
    //   going right → origin="left"  (tail stretches leftward behind)
    //   going left  → origin="right" (tail stretches rightward behind)
    el.style.transformOrigin = goingRight ? 'left center' : 'right center';

    // Restart scale animation: clear → reflow → re-apply
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'glassIndScale 440ms ease';
  }, [activeTab]);

  // ── Selection mode ────────────────────────────────────────────────
  if (selectionMode) {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        zIndex: 100, display: 'flex', justifyContent: 'center',
        padding: '8px 12px 12px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          height: PILL_H, padding: '8px 18px', borderRadius: 999,
          backgroundColor: 'color-mix(in srgb, #bbbbbc 12%, transparent)',
          backdropFilter: 'blur(14px) saturate(180%)',
          WebkitBackdropFilter: 'blur(14px) saturate(180%)',
          boxShadow: PILL_SHADOW,
        }}>
          <button onClick={onCancelSelection} aria-label="Cancel" style={{
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            border: '1.5px solid rgba(255,255,255,0.28)',
            background: 'rgba(255,255,255,0.10)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} strokeWidth={2.5} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
            {selectedCount} selected
          </span>
          <button onClick={onDeleteSelected} aria-label="Delete" style={{
            width: 38, height: 38, borderRadius: 12, cursor: 'pointer',
            background: 'rgba(239,68,68,0.85)', border: 'none', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ── Main nav ──────────────────────────────────────────────────────
  return (
    <>
      {/*
        Inject the keyframes + helper styles once.
        Using the CSS `scale` standalone property (not `transform: scale(...)`)
        exactly as the original HTML does, so it composes with `translate`
        without overwriting it.
      */}
      <style>{`
        @keyframes glassIndScale {
          0%   { scale: 1   1; }
          50%  { scale: 1.2 1; }
          100% { scale: 1   1; }
        }

        .gn-btn {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.42);
          border-radius: 999px;
          position: relative;
          z-index: 1;
          transition: color 160ms ease;
        }
        .gn-btn:hover { color: rgba(255,255,255,0.82); }
        .gn-btn:hover .gn-icon { scale: 1.18; }
        .gn-btn.active { color: rgba(255,255,255,0.97); }
        .gn-btn.active .gn-icon { scale: 1 !important; }

        .gn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: scale 200ms cubic-bezier(0.5, 0, 0, 1);
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

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '8px 12px 12px',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}>

        {/* ── Pill ─────────────────────────────────────────────── */}
        <div
          ref={pillRef}
          style={{
            pointerEvents: 'auto',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: GAP,
            flex: 1,
            height: PILL_H,
            padding: `${IND_INSET}px ${PAD}px`,
            borderRadius: 999,
            boxSizing: 'border-box',
            backgroundColor: 'color-mix(in srgb, #bbbbbc 12%, transparent)',
            backdropFilter: 'blur(14px) saturate(180%)',
            WebkitBackdropFilter: 'blur(14px) saturate(180%)',
            boxShadow: PILL_SHADOW,
          }}>

          {/* Sliding glass indicator — position/size/animation managed via indicatorRef */}
          <div
            ref={indicatorRef}
            style={{
              position: 'absolute',
              left: IND_BASE_X,
              top: IND_INSET,
              width: OPTION_W + (PAD - IND_INSET) * 2, // initial — overwritten by pillRef measure
              height: `calc(100% - ${IND_INSET * 2}px)`,
              borderRadius: 999,
              translate: `${activeIdx * (OPTION_W + GAP)}px 0`, // initial — overwritten
              transition: 'translate 400ms cubic-bezier(1, 0, 0.4, 1)',
              backgroundColor: 'color-mix(in srgb, #bbbbbc 36%, transparent)',
              boxShadow: IND_SHADOW,
              zIndex: 0,
            }}
          />

          {/* Tab buttons — flex:1 so they spread evenly across full pill width */}
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`gn-btn${tab === activeTab ? ' active' : ''}`}
              style={{ flex: 1, height: '100%' }}
              onClick={() => setActiveTab && setActiveTab(tab)}
              aria-label={tab}
            >
              <span className="gn-icon">
                {TAB_ICONS[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Add button (same glass pill, circle, same height) ── */}
        <button
          className="gn-add"
          style={{
            pointerEvents: 'auto',
            width: PILL_H,
            height: PILL_H,
            backgroundColor: 'color-mix(in srgb, #bbbbbc 12%, transparent)',
            backdropFilter: 'blur(14px) saturate(180%)',
            WebkitBackdropFilter: 'blur(14px) saturate(180%)',
            boxShadow: PILL_SHADOW,
          }}
          onClick={() => onAdd(activeTab)}
          aria-label="Add new"
        >
          <Plus size={25} strokeWidth={2.5} />
        </button>

      </div>
    </>
  );
}
