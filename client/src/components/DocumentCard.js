import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { downloadEncryptedBlob } from '../utils/cloudinary';
import { decryptBlob } from '../utils/crypto';

const LONG_PRESS_MS = 500;

function formatDate(iso) {
  const d = new Date(iso);
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${mo[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function DocumentCard({ doc, onClick, selectionMode, selected, onLongPress, onToggleSelect, vaultKey }) {
  const timerRef = useRef(null);
  const didLongPress = useRef(false);
  const cardRef = useRef(null);
  
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

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
      downloadEncryptedBlob(doc.documentUrl)
        .then(async (blob) => {
          if (!active) return;
          const decBlob = await decryptBlob(blob, vaultKey);
          if (active) setThumbnailUrl(URL.createObjectURL(decBlob));
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
        "glass-card rounded-2xl overflow-hidden cursor-pointer relative select-none flex flex-col",
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
      {/* Conditional layout based on attachment */}
      {(thumbnailUrl || doc.documentUrl) ? (
        <div className="w-full aspect-[4/3] max-h-[260px] bg-black/40 flex items-center justify-center relative">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={40} strokeWidth={1.5} className="text-white/20" />
          )}
          
          {/* Overlay Box */}
          <div className="absolute bottom-2 left-2 right-2 bg-[#7b2fff]/85 backdrop-blur-md border border-white/20 rounded-xl flex items-center gap-3 py-2 px-3 shadow-lg">
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {doc.title ? (
                <div className="text-[14.5px] font-bold leading-tight truncate text-white">{doc.title}</div>
              ) : (
                <div className="text-[14.5px] font-bold leading-tight truncate text-white/70 italic">Untitled</div>
              )}
            </div>
            <div className="text-[11.5px] font-medium text-white/80 shrink-0 flex items-center leading-none tracking-wide pt-0.5">
              {formatDate(doc.updatedAt || doc.createdAt)}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 w-full flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-400/20 text-[#93c5fd] flex items-center justify-center shrink-0">
            <FileText size={18} strokeWidth={2.5} />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {doc.title ? (
              <div className="text-[17px] font-bold leading-tight truncate text-white">{doc.title}</div>
            ) : (
              <div className="text-[17px] font-bold leading-tight truncate text-white/50 italic">Untitled Document</div>
            )}
          </div>
          
          <div className="text-[12px] font-medium text-white/40 shrink-0 pl-2 flex items-center leading-none tracking-wide pt-0.5">
            {formatDate(doc.updatedAt || doc.createdAt)}
          </div>
        </div>
      )}
    </div>
  );
}
