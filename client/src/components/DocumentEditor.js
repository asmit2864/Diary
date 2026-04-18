import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, ImagePlus, Download, Share, Loader2, Camera, X, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { encryptText, encryptBlob } from '../utils/crypto';
import { uploadEncryptedBlobToCloudinary, downloadAndDecryptFile, hasCachedFile, getCachedFile } from '../utils/cloudinary';

export default function DocumentEditor({ note, category, cardRect, onClose, onSave, onDelete, vaultKey }) {
  const [title, setTitle] = useState(note?.title || '');
  const [body, setBody]   = useState(note?.body  || '');
  const [saved, setSaved] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const [documentType, setDocumentType] = useState(null);
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
    let timer;
    if (note?.documentUrl && vaultKey) {
      if (hasCachedFile(note.documentUrl)) {
        // Instant synchronous resolution to bypass the 350ms wait entirely!
        const { objectUrl, type } = getCachedFile(note.documentUrl);
        setLocalImageUrl(objectUrl);
        setDocumentType(type);
        setImageLoading(false);
      } else {
        // Delay the fetch and decrypt by 400ms to allow the entrance animation to play smoothly without main thread stutter
        timer = setTimeout(() => {
          downloadAndDecryptFile(note.documentUrl, vaultKey)
            .then(({ objectUrl, type }) => {
              if (!active) return;
              setLocalImageUrl(objectUrl);
              setDocumentType(type);
              setImageLoading(false);
            })
            .catch(err => {
              console.error("Failed to load document image", err);
              if (active) setImageLoading(false);
            });
        }, 350);
      }
    } else {
      setImageLoading(false);
    }
    return () => { 
      active = false; 
      clearTimeout(timer); 
    };
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
      setDocumentType(file.type);
      const objectUrl = URL.createObjectURL(file);
      setLocalImageUrl(objectUrl);
      
      // Encrypt and upload
      const encBlob = await encryptBlob(file, vaultKey);
      const secureUrl = await uploadEncryptedBlobToCloudinary(encBlob);
      
      documentUrlVal.current = secureUrl;
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

  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure initial render is registered before triggering CSS transition
    const frame = requestAnimationFrame(() => {
      setIsOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClose = async () => {
    if (uploading) {
      alert("Please wait while your document is securely encrypted and uploaded...");
      return false; // explicitly signal to useHardwareBack to rebuild the trap!
    }
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && !bodyVal.current.trim() && !documentUrlVal.current;
    if (isEmpty) {
      onDelete();
      return;
    }
    if (isDirty.current) await doSave();
    
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 400); // Wait for bounce out transition
  };

  const handleForceClose = async () => {
    if (uploading) {
      alert("Please wait while your document is securely encrypted and uploaded...");
      return;
    }
    clearTimeout(saveTO.current);
    const isEmpty = !titleVal.current.trim() && !bodyVal.current.trim() && !documentUrlVal.current;
    if (isEmpty) { onDelete(); return; }
    if (isDirty.current) await doSave();
    onClose(); // instant, no animation delay
  };

  const handleDelete = () => {
    clearTimeout(saveTO.current);
    onDelete();
  };

  useHardwareBack(handleClose);

  return (
    <>
      {/* Invisible Backing with Fade */}
      <div 
        className="fixed inset-0 z-[190] transition-opacity duration-300"
        style={{ 
          background: 'rgba(0,0,0,0.3)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        onClick={handleClose}
      />
      
      {/* Modal Container */}
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

              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                
                {/* Title Row & Actions */}
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex flex-col flex-1 gap-2 min-w-0">
                    <textarea
                      ref={titleElRef}
                      className="font-serif text-[28px] border-none bg-transparent text-white outline-none w-full leading-[1.3] overflow-hidden resize-none caret-white/80 placeholder:text-white/30 pt-0.5"
                      placeholder="Document Title"
                      value={title}
                      rows={1}
                      onChange={handleTitleChange}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2.5 shrink-0 pt-0.5 flex-wrap justify-end">
                    {localImageUrl && (
                      <>
                        <button 
                          className="w-[42px] h-[42px] rounded-full text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0 glass-pill-card" 
                          onClick={handleDownload} 
                          title="Download to Device"
                        >
                          <Download size={18} strokeWidth={2.5} />
                        </button>
                        <button 
                          className="w-[42px] h-[42px] rounded-full text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0 glass-pill-card" 
                          onClick={handleShare} 
                          title="Share via OS"
                        >
                          <Share size={18} strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                    <button 
                      className="w-[42px] h-[42px] rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0 glass-pill-card" 
                      onClick={handleDelete} 
                      title="Delete document"
                    >
                      <Trash2 size={18} className="text-[#ff6b6b]" strokeWidth={2.5} />
                    </button>
                    <button 
                      className="w-[42px] h-[42px] rounded-full text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0 glass-pill-card" 
                      onClick={handleForceClose} 
                      title="Close document"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                
                <div className="h-px bg-white/20 shrink-0 w-full" />

                {/* Document Viewer Area */}
                <div className="w-full min-h-[140px] bg-black/20 rounded-2xl border border-white/20 overflow-hidden relative flex flex-col items-center justify-center shrink-0">
                  {imageLoading ? (
                    <div className="flex flex-col items-center justify-center text-white/60 p-6">
                      <Loader2 className="w-8 h-8 animate-spin mb-3 text-white/80" />
                      <span className="text-sm font-medium">Decrypting Vault File...</span>
                    </div>
                  ) : localImageUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center group flex-1 min-h-[300px]">
                      {documentType === 'application/pdf' ? (
                        window.innerWidth > 768 ? (
                          <iframe 
                            src={localImageUrl} 
                            title="Vault Document PDF" 
                            className="w-full h-full flex-1 min-h-[350px] border-none bg-white rounded-[10px]"
                          />
                        ) : (
                          <div className="w-full h-full w-full flex-1 min-h-[280px] flex flex-col items-center justify-center bg-white/5 rounded-[10px] border border-white/10 shadow-inner">
                            <FileText size={64} strokeWidth={1} className="text-white/30 mb-3" />
                            <span className="text-[15px] font-semibold tracking-wide text-white/70">Secure PDF</span>
                            <span className="text-[12px] text-white/40 mt-1.5 text-center px-4 leading-relaxed">
                              Tap the <Download size={12} className="inline mb-[2px] mx-[2px]"/> download icon above<br/>to decrypt and view this document
                            </span>
                          </div>
                        )
                      ) : (
                        <img 
                          src={localImageUrl} 
                          alt="Vault Document" 
                          className="w-full h-auto max-h-[400px] object-contain rounded-[10px] m-auto"
                        />
                      )}
                    </div>
                  ) : (                    <div className="text-white/40 flex flex-col items-center p-8">
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

                <div className="mt-2 relative pb-[30px]">
                  <label className="text-[12px] font-semibold text-white/50 uppercase tracking-wider mb-2 block">Extra Notes</label>
                  <textarea
                    ref={bodyElRef}
                    className="w-full min-h-[140px] px-4 py-[10px] bg-white/10 border-none rounded-[19px] text-white placeholder:text-white/40 outline-none text-[15px] shadow-sm focus:bg-white/20 transition-colors resize-none overflow-hidden"
                    placeholder="Add some notes about this document..."
                    value={body}
                    onChange={handleBodyChange}
                  />
                </div>
              </div>

              {/* Saved toast */}
              <div className={cn(
                "absolute bottom-9 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white text-[12px] py-1.5 px-5 rounded-full border border-white/30 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50",
                saved ? "opacity-100" : "opacity-0"
              )}>
                ✓ Encrypted & Saved
              </div>
            </div>
          </div>
        </div>
      </div>
    </>  );
}
