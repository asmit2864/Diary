import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Just verify support on mount
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Speech recognition not supported in this browser.');
      }
    }
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      // FORCE kill any old recognition instance instantly so it CANNOT double-fire
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Standard Google spec for parsing continuous results without duplicate bleeding
      recognition.onresult = (event) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }
        
        if (finalStr) {
           setTranscript((prev) => prev + finalStr);
        }
        setInterimTranscript(interimStr);
      };

      recognition.onerror = (event) => {
        if (event.error !== 'aborted') {
          console.error("Speech recognition error", event.error);
          setError(event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort(); // Abort instantly kills queued events
      }
    } catch(e) {}
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    reset,
    error,
    isSupported: !!recognitionRef.current
  };
}
