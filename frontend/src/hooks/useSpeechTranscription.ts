/**
 * useSpeechTranscription — Robust Web Speech API hook for real-time captions & transcription.
 *
 * Uses SpeechRecognition (Chromium) in continuous + interim-results mode.
 * Canonical implementation: Parses event.results from 0..length-1 on every onresult event
 * to guarantee no missed interim text, no duplicate final segments, and instant UI updates.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface IWindow extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult:      ((event: ISpeechRecognitionEvent) => void) | null;
  onerror:       ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend:         (() => void) | null;
  onaudiostart:  (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend:   (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

const iwindow: IWindow =
  typeof window !== "undefined" ? (window as IWindow) : ({} as IWindow);
const SpeechRecognitionCtor: ((new () => ISpeechRecognition) | undefined) =
  iwindow.SpeechRecognition ?? iwindow.webkitSpeechRecognition;

export interface UseSpeechTranscriptionReturn {
  isSupported: boolean;
  isListening: boolean;
  liveCaption: string;
  finalTranscript: string;
  speechError: string | null;
  startListening: () => void;
  stopListening: () => string;
  resetTranscript: () => void;
}

export function useSpeechTranscription(): UseSpeechTranscriptionReturn {
  const isSupported = SpeechRecognitionCtor !== undefined;

  const [isListening,     setIsListening]     = useState(false);
  const [liveCaption,     setLiveCaption]     = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [speechError,     setSpeechError]     = useState<string | null>(null);

  const recognitionRef     = useRef<ISpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const lastLiveCaptionRef = useRef("");
  const isListeningRef     = useRef(false);

  const initRecognition = useCallback((): ISpeechRecognition | null => {
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onaudiostart = () => {
      if (recognitionRef.current !== recognition) return;
      console.log("[Speech] Mic audio stream started ✓");
      setSpeechError(null);
    };

    recognition.onspeechstart = () => {
      if (recognitionRef.current !== recognition) return;
      console.log("[Speech] Voice activity detected ✓");
    };

    // ── CANONICAL ONRESULT PARSER ──
    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      if (recognitionRef.current !== recognition) return;

      let finalStr = "";
      let interimStr = "";

      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript || "";
        if (res.isFinal) {
          finalStr += text + " ";
        } else {
          interimStr += text + " ";
        }
      }

      const cleanFinal = finalStr.trim();
      const combined = (cleanFinal + " " + interimStr).trim();

      finalTranscriptRef.current = cleanFinal;
      lastLiveCaptionRef.current = combined;

      setFinalTranscript(cleanFinal);
      setLiveCaption(combined);

      if (combined) {
        console.log("[Speech] Live caption updated:", combined);
      }
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      if (recognitionRef.current !== recognition) return;

      if (event.error === "no-speech") return;
      if (event.error === "aborted") return;

      console.warn("[Speech] Error event:", event.error);

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setSpeechError("Microphone permission denied. Check browser settings.");
        setIsListening(false);
        isListeningRef.current = false;
      } else if (event.error === "audio-capture") {
        setSpeechError("No microphone detected or mic is in use by another app.");
        setIsListening(false);
        isListeningRef.current = false;
      } else if (event.error === "network") {
        console.warn("[Speech] Network issue contacting speech service.");
      }
    };

    recognition.onend = () => {
      console.log("[Speech] Instance ended");
      if (isListeningRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
          console.log("[Speech] Auto-restarted recognition after onend");
        } catch (err) {
          console.warn("[Speech] Restart failed:", err);
        }
      }
    };

    return recognition;
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setSpeechError("Web Speech API is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // Defensive cleanup if called twice — abort existing instance before creating new one
    if (recognitionRef.current) {
      const existing = recognitionRef.current;
      recognitionRef.current = null; // null reference FIRST so onend won't restart
      try {
        existing.abort();
      } catch {}
    }

    setSpeechError(null);
    finalTranscriptRef.current = "";
    lastLiveCaptionRef.current = "";
    setFinalTranscript("");
    setLiveCaption("");

    const rec = initRecognition();
    if (!rec) return;

    recognitionRef.current = rec;
    isListeningRef.current = true;
    setIsListening(true);

    try {
      rec.start();
      console.log("[Speech] Recognition started for new question ✓");
    } catch (e) {
      console.error("[Speech] start() error:", e);
      setTimeout(() => {
        if (recognitionRef.current === rec) {
          try { rec.start(); } catch {}
        }
      }, 100);
    }
  }, [isSupported, initRecognition]);

  const stopListening = useCallback((): string => {
    isListeningRef.current = false;
    setIsListening(false);

    const rec = recognitionRef.current;
    // Null reference FIRST so any abort/stop-triggered onend immediately sees stale ref & exits silently
    recognitionRef.current = null;

    if (rec) {
      try {
        rec.stop();
      } catch {}
    }

    const result = (finalTranscriptRef.current || lastLiveCaptionRef.current).trim();
    console.log("[Speech] Stopped listening. Final result:", result);
    return result;
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    lastLiveCaptionRef.current = "";
    setFinalTranscript("");
    setLiveCaption("");
    setSpeechError(null);
  }, []);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        const rec = recognitionRef.current;
        recognitionRef.current = null;
        try { rec.abort(); } catch {}
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    liveCaption,
    finalTranscript,
    speechError,
    startListening,
    stopListening,
    resetTranscript,
  };
}
