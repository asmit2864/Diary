import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { downloadAndDecryptFile } from '../utils/cloudinary';
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

export default function DocumentCard({ doc, onClick, selectionMode, selected, onLongPress, onToggleSelect, vaultKey }) {
  const timerRef = useRef(null);
  const didLongPress = useRef(false);
  const cardRef = useRef(null);
  
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [documentType, setDocumentType] = useState(null);

  const startPress = () => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(doc._id);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => clearTimeout(timerRef.current);

  const handleClick = () => {
    if (didLongPress.current) return;
    if (selectionMode) {
      onToggleSelect(doc._id);
    } else {
      const rect = cardRef.current?.getBoundingClientRect() ?? null;
      onClick(doc, rect);
    }
  };

  useEffect(() => {
    let active = true;
    if (doc.documentUrl && vaultKey && !thumbnailUrl) {
      downloadAndDecryptFile(doc.documentUrl, vaultKey)
        .then(({ objectUrl, type }) => {
          if (active) {
            setThumbnailUrl(objectUrl);
            setDocumentType(type);
          }
        })
        .catch(err => {
          console.error("Failed to load thumbnail", err);
        });
    }
    return () => { active = false; };
  }, [doc, vaultKey, thumbnailUrl]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "glass-pill-card rounded-[16px] p-4 cursor-pointer relative select-none flex flex-col gap-3 transition-all duration-200 active:scale-[0.95]",
        selected && "z-10"
      )}
      style={{
        opacity: selectionMode && !selected ? 0.6 : 1,
        ...(selected ? {
          transform: 'scale(0.95)',
          boxShadow: '0 0 0 2px rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.4)',
          borderColor: 'rgba(255,255,255,0.8)'
        } : {})
      }}      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
    >
      {(thumbnailUrl || doc.documentUrl) && (
        <div className="w-full aspect-video md:aspect-[4/3] rounded-[10px] overflow-hidden bg-black/20 flex flex-col items-center justify-center relative shadow-inner">
          {documentType === 'application/pdf' ? (
            <>
              <FileText size={48} strokeWidth={1.5} className="text-white/40 mb-2" />
              <span className="text-[12px] font-semibold tracking-widest uppercase text-white/50">PDF Document</span>
            </>
          ) : thumbnailUrl ? (
            <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={32} strokeWidth={1.5} className="text-white/20" />
          )}
        </div>
      )}

      <div className="flex items-center gap-3 px-1">
        <div className={cn(
          "w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0",
          (thumbnailUrl || doc.documentUrl) 
            ? "bg-purple-400/20 text-purple-300" 
            : "bg-blue-400/20 text-blue-300"
        )}>
          {(thumbnailUrl || doc.documentUrl) ? <ImageIcon size={18} strokeWidth={2.5} /> : <FileText size={18} strokeWidth={2.5} />}
        </div>
        
        <div className="flex-1 overflow-hidden">
          {doc.title ? (
            <div className="text-[17px] font-bold leading-tight truncate text-white">{doc.title}</div>
          ) : (
            <div className="text-[17px] font-bold leading-tight truncate text-white/50 italic">Untitled Document</div>
          )}
        </div>
        
        <div className="text-[11px] font-medium text-white/40 shrink-0 whitespace-nowrap">
          {formatDateTime(doc.updatedAt || doc.createdAt)}
        </div>
      </div>
    </div>
  );

}
