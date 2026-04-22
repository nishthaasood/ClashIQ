import { useState, useRef, useCallback, useEffect } from "react";

// ── Chrome / Browser TTS ────────────────────────────────────
export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const speak = useCallback((text) => {
    if (!text) return;
    // Cancel any current speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported");
      return;
    }

    // Small delay to ensure cancel() has processed
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings for a strong AI opponent sound
      utterance.rate = 0.92;
      utterance.pitch = 0.8;
      utterance.volume = 1.0;

      // Try to pick a deep/authoritative voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = [
        "Google UK English Male",
        "Microsoft David",
        "Daniel",
        "Alex",
        "Fred",
      ];
      
      let selectedVoice = null;
      for (const name of preferred) {
        const found = voices.find(v => v.name.includes(name));
        if (found) { selectedVoice = found; break; }
      }
      
      // Fallback: pick any English male voice
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("male"))
          || voices.find(v => v.lang.startsWith("en"))
          || null;
      }

      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 100);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, []);

  // Chrome bug: speechSynthesis pauses after ~15s on some Chrome versions
  useEffect(() => {
    if (!isSpeaking) return;
    const interval = setInterval(() => {
      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  return { speak, stopSpeaking, isSpeaking };
}

// ── Speech Recognition ──────────────────────────────────────
export function useSpeechRecognition({ onResult, onEnd } = {}) {
  const [isListening, setIsListening] = useState(false);
  const recRef = useRef(null);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported. Please use Chrome."); return; }

    if (recRef.current) { recRef.current.stop(); }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";

    r.onstart = () => setIsListening(true);
    r.onend = () => { setIsListening(false); onEnd?.(); };
    r.onerror = (e) => { console.error("SR error:", e); setIsListening(false); };
    r.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      onResult?.(transcript);
    };

    recRef.current = r;
    r.start();
  }, [onResult, onEnd]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => () => recRef.current?.stop(), []);

  return { isListening, startListening, stopListening };
}