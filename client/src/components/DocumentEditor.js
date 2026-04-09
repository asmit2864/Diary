import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Trash2, ImagePlus, Download, Copy, Share, Loader2, Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import { encryptText, encryptBlob, decryptBlob } from '../utils/crypto';
import { uploadEncryptedBlobToCloudinary, downloadEncryptedBlob } from '../utils/cloudinary';

export default function DocumentEditor({ note, category, cardRect, onClose, onSave, onDelete, vaultKey }) {
  const [title, setTitle] = useState(note?.title || '');
  const [body, setBody]   = useState(note?.body  || '');
  const [documentUrl, setDocumentUrl] = useState(note?.documentUrl || '');
  const [saved, setSaved] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(!!note?.documentUrl);

  const titleVal  = useRef(note?.title || '');
  const bodyVal   = useRef(note?.body  || '');
  const documentUrlVal = useRef(note?.documentUrl || '');
  const isDirty   = useRef(false);
  const saveTO    = useRef(null);

  const titleElRef = useRef(null);
  const bodyElRef  = useRef(null);
  const fileInputRef = useRef(null);

  const resize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  useEffect(() => {
    resize(titleElRef.current);
    resize(bodyElRef.current);
    if (!note?.title && !note?.body && !note?.documentUrl) {
      setTimeout(() => titleElRef.current?.focus(), 150);
    }
  }, [note]);

  // Decrypt the existing image blob on load
  useEffect(() => {
    let active = true;
    if (note?.documentUrl && vaultKey) {
      downloadEncryptedBlob(note.documentUrl)
        .then(async (blob) => {
          if (!active) return;
          const decBlob = await decryptBlob(blob, vaultKey);
          if (active) {
            setLocalImageUrl(URL.createObjectURL(decBlob));
            setImageLoading(false);
          }
        })
        .catch(err => {
          console.error("Failed to load document image", err);
          if (active) setImageLoading(false);
        });
    } else {
      setImageLoading(false);
    }
    return () => { active = false; };
  }, [note, vaultKey]);

  const doSave = useCallback(async () => {
    let encTitle = titleVal.current;
    let encBody = bodyVal.current;
    let encUrl = documentUrlVal.current;
    
    if (vaultKey) {
      encTitle = await encryptText(titleVal.current, vaultKey);
      encBody = await encryptText(bodyVal.current, vaultKey);
      if (documentUrlVal.current) {
        encUrl = await encryptText(documentUrlVal.current, vaultKey);
      }
    }
    
    return onSave({ 
      title: encTitle, 
      body: encBody,
      documentUrl: encUrl
    });
  }, [onSave, vaultKey]);

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

  const handleBodyChange = (e) => {
    bodyVal.current = e.target.value;
    setBody(e.target.value);
    resize(e.target);
    scheduleSave();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !vaultKey) return;
    
    try {
      setUploading(true);
      
      // Instant local preview
      const objectUrl = URL.createObjectURL(file);
      setLocalImageUrl(objectUrl);
      
      // Encrypt and upload
      const encBlob = await encryptBlob(file, vaultKey);
      const secureUrl = await uploadEncryptedBlobToCloudinary(encBlob);
      
      documentUrlVal.current = secureUrl;
      setDocumentUrl(secureUrl);
      scheduleSave();
      
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to encrypt and upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async () => {
    if (!localImageUrl) return;
    const a = document.createElement('a');
    a.href = localImageUrl;
    a.download = titleVal.current ? `${titleVal.current}-decrypted` : 'vault-document-decrypted';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async () => {
    if (!localImageUrl) return;
    try {
      const res = await fetch(localImageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new window.ClipboardItem({ [blob.type]: blob })
      ]);
      alert("Image copied to clipboard!");
    } catch (err) {
      console.error("Copy failed", err);
      alert("Copying failed. Note: Only certain image types can be copied to the clipboard in browsers.");
    }
  };

  const handleShare = async () => {
    if (!localImageUrl) return;
    try {
      const res = await fetch(localImageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'document.jpg', { type: blob.type });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: titleVal.current || 'Vault Document',
        });
      } else {
        alert("Your browser does not support sharing files natively.");
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  const handleClose = async () => {
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && !bodyVal.current.trim() && !documentUrlVal.current;
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
      '--tx': `${tx}px`,
      '--ty': `${ty}px`,
      '--sx': sx,
      '--sy': sy,
    };
  }, [cardRect]);

  return (
    <div 
      className="fixed inset-0 z-[200] flex flex-col max-w-[430px] mx-auto origin-center bg-gradient-to-b from-[#7b2fff] via-[#9b44ff_40%] via-[#b06ef3_70%] to-[#d49dff] animate-expandFromCard" 
      style={animStyle}
    >
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
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2.5 pb-[30px] flex flex-col gap-3.5 [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3 items-start shrink-0 w-full">
          <textarea
            ref={titleElRef}
            className="flex-1 font-serif text-[28px] border-none bg-transparent text-white outline-none w-full leading-[1.3] overflow-hidden resize-none caret-white/80 placeholder:text-white/30"
            placeholder="Document Title"
            value={title}
            rows={1}
            onChange={handleTitleChange}
          />
          {localImageUrl && (
            <div className="flex gap-2 shrink-0 pt-1">
              <button onClick={handleDownload} className="w-9 h-9 rounded-full bg-white/10 text-white/90 border border-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition-all shadow-sm active:scale-95" title="Download to Device">
                <Download size={16} strokeWidth={2.5} />
              </button>
              <button onClick={handleCopy} className="w-9 h-9 rounded-full bg-white/10 text-white/90 border border-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition-all shadow-sm active:scale-95" title="Copy to Clipboard">
                <Copy size={16} strokeWidth={2.5} />
              </button>
              <button onClick={handleShare} className="w-9 h-9 rounded-full bg-white/10 text-white/90 border border-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition-all shadow-sm active:scale-95" title="Share via OS">
                <Share size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
        
        {/* Document Viewer Area */}
        <div className="w-full min-h-[140px] bg-black/20 rounded-2xl border border-white/20 overflow-hidden relative flex flex-col items-center justify-center shrink-0">
          {imageLoading ? (
            <div className="flex flex-col items-center justify-center text-white/60 p-6">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-white/80" />
              <span className="text-sm font-medium">Decrypting Vault File...</span>
            </div>
          ) : localImageUrl ? (
            <div className="relative w-full h-full flex flex-col group">
              <img 
                src={localImageUrl} 
                alt="Vault Document" 
                className="w-full h-auto max-h-[400px] object-contain bg-black/40"
              />
            </div>
          ) : (
            <div className="text-white/40 flex flex-col items-center p-8">
              <ImagePlus size={36} className="mb-2 opacity-50" />
              <span className="text-sm">No Document Attached</span>
            </div>
          )}
          
          {/* Upload Overlay */}
          <div className="absolute top-2 right-2 flex gap-2">
            <label className="cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
              />
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all shadow shadow-black/30" title="Take Photo">
                <Camera size={18} />
              </div>
            </label>
            <label className="cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all shadow shadow-black/30" title="Upload File">
                {uploading ? <Loader2 size={18} className="animate-spin text-emerald-400" /> : <ImagePlus size={18} />}
              </div>
            </label>
          </div>
        </div>

        <div className="mt-2 relative">
          <label className="text-[13px] font-semibold text-white/70 uppercase tracking-widest pl-1 mb-1 block">Extra Notes</label>
          <textarea
            ref={bodyElRef}
            className="font-sans text-[16px] bg-white/10 border-[1.5px] border-white/20 rounded-2xl p-4 text-white outline-none w-full leading-[1.8] min-h-[140px] resize-none caret-white/80 placeholder:text-white/30 focus:border-white/50 transition-colors backdrop-blur-sm"
            placeholder="Add some notes about this document..."
            value={body}
            onChange={handleBodyChange}
          />
        </div>
      </div>

      <div className={cn(
        "absolute bottom-9 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white text-[12px] py-1.5 px-5 rounded-full border border-white/30 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50",
        saved ? "opacity-100" : "opacity-0"
      )}>
        ✓ Encrypted & Saved
      </div>
    </div>
  );
}
