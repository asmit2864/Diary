import React, { useEffect, useState, useRef } from 'react';
import { Mic, X, Loader2 } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { cn } from '../lib/utils';
import { parseVoiceNote } from '../utils/api';

export default function VoiceNoteModal({ isOpen, onClose, onParsed }) {
  const { isListening, transcript, interimTranscript, startListening, stopListening, reset, error } = useSpeech();
  const [isProcessing, setIsProcessing] = useState(false);
  const silenceTimerRef = useRef(null);

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
      setIsProcessing(false);
      startListening();
    } else {
      stopListening();
      clearTimeout(silenceTimerRef.current);
    }
    
    return () => {
      stopListening();
      clearTimeout(silenceTimerRef.current);
    };
  }, [isOpen, startListening, stopListening, reset]);

  // Silence detection: stop and process if user hasn't spoken for 3 seconds
  // Or process immediately if they manually stop it.
  useEffect(() => {
    if (!isListening) return;

    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (transcript || interimTranscript) {
        handleProcessVoice();
      }
    }, 3000); // 3 seconds of silence = automatic processing

    return () => clearTimeout(silenceTimerRef.current);
  }, [transcript, interimTranscript, isListening]);

  const handleProcessVoice = async () => {
    stopListening();
    clearTimeout(silenceTimerRef.current);
    
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText) {
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      const parsedData = await parseVoiceNote(fullText);
      onParsed(parsedData); // App.js will handle adding the note
      onClose(); // Close the modal
    } catch(err) {
      console.error(err);
      alert("Failed to process your voice note.");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    stopListening();
    onClose();
  };

  useHardwareBack(handleClose);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .mic-pulse::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-color: #ef4444; /* red-500 */
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          z-index: -1;
        }
      `}</style>
      
      {/* Dark overlay backdrop */}
      <div 
        className="fixed inset-0 z-[300] bg-zinc-900/95 backdrop-blur-md flex flex-col justify-end p-6 transition-opacity"
        onClick={handleClose}
      >
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white"
        >
          <X size={24} />
        </button>

        <div 
          className="flex-1 w-full max-w-lg mx-auto flex flex-col items-center justify-start pt-24 pointer-events-none"
        >
          <p className="text-white/80 text-2xl font-light text-center leading-relaxed">
            {transcript && <span className="text-white font-medium">{transcript} </span>}
            {interimTranscript && <span className="text-white/60">{interimTranscript}</span>}
            {!transcript && !interimTranscript && (
              <span className="text-white/40">Listening...</span>
            )}
          </p>

          {error && (
            <p className="text-red-400 mt-4 text-sm font-medium">{error}</p>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center gap-3 mt-8">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-indigo-300 font-medium tracking-wide">Processing note...</p>
            </div>
          )}
        </div>

        {/* Mic Container placed at the bottom */}
        <div className="w-full h-32 flex items-center justify-center shrink-0 mb-8 pointer-events-auto">
          {!isProcessing && (
            <button
              onClick={() => {
                if (isListening) handleProcessVoice();
                else startListening();
              }}
              className={cn(
                "relative flex items-center justify-center w-20 h-20 rounded-full shadow-2xl transition-transform active:scale-95",
                isListening ? "bg-red-500 text-white mic-pulse" : "bg-white/10 text-white/80 hover:bg-white/20"
              )}
            >
              <Mic size={36} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
