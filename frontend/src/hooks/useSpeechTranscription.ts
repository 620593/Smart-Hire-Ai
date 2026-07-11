/**
 * useSpeechTranscription — Web Speech API hook for real-time captions.
 *
 * Uses SpeechRecognition (Chromium) in continuous + interim-results mode.
 * Provides a live caption string (shown in the overlay while the user speaks)
 * and accumulates a finalTranscript across multiple recognition segments.
 *
 * Shows a browser-compatibility warning if the API is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// TypeScript: the Web Speech API is not in the default TS lib.
// We declare a minimal interface to avoid the compiler errors.
// ---------------------------------------------------------------------------

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
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// ---------------------------------------------------------------------------
// Browser compatibility shim
// ---------------------------------------------------------------------------

const iwindow: IWindow = typeof window !== "undefined" ? (window as IWindow) : ({} as IWindow);
const SpeechRecognitionCtor: ((new () => ISpeechRecognition) | undefined) =
  iwindow.SpeechRecognition ?? iwindow.webkitSpeechRecognition;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSpeechTranscriptionReturn {
  /** True if the browser supports the Web Speech API. */
  isSupported: boolean;
  /** True while recognition is actively running. */
  isListening: boolean;
  /** Real-time interim caption shown while the user is speaking. */
  liveCaption: string;
  /** Full accumulated final transcript for the current session. */
  finalTranscript: string;
  /** Start recognition (idempotent). */
  startListening: () => void;
  /** Stop recognition and return the final transcript. */
  stopListening: () => string;
  /** Clear the accumulated transcript (call before each question). */
  resetTranscript: () => void;
}

export function useSpeechTranscription(): UseSpeechTranscriptionReturn {
  const isSupported = SpeechRecognitionCtor !== undefined;

  const [isListening, setIsListening] = useState(false);
  const [liveCaption, setLiveCaption] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const finalTranscriptRef = useRef(""); // kept in sync with state for synchronous reads
  const isListeningRef = useRef(false);

  // ── Initialise recognition instance ─────────────────────────────────────
  const initRecognition = useCallback((): ISpeechRecognition | null => {
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += " " + text;
          setFinalTranscript(finalTranscriptRef.current.trim());
        } else {
          interim += text;
        }
      }
      setLiveCaption(interim || "");
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      // "no-speech" is not a real error — just silence
      if (event.error === "no-speech") return;
      console.warn("[useSpeechTranscription] Recognition error:", event.error);
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening (avoids "timed out" stops)
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started — ignore
        }
      }
    };

    return recognition;
  }, []);

  // ── startListening ───────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!isSupported || isListeningRef.current) return;

    const rec = initRecognition();
    if (!rec) return;

    recognitionRef.current = rec;
    isListeningRef.current = true;
    setIsListening(true);
    setLiveCaption("");

    try {
      rec.start();
    } catch {
      // Already running — ignore
    }
  }, [isSupported, initRecognition]);

  // ── stopListening ────────────────────────────────────────────────────────
  const stopListening = useCallback((): string => {
    isListeningRef.current = false;
    setIsListening(false);
    setLiveCaption("");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped — ignore
      }
      recognitionRef.current = null;
    }

    return finalTranscriptRef.current.trim();
  }, []);

  // ── resetTranscript ──────────────────────────────────────────────────────
  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setFinalTranscript("");
    setLiveCaption("");
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    liveCaption,
    finalTranscript,
    startListening,
    stopListening,
    resetTranscript,
  };
}
