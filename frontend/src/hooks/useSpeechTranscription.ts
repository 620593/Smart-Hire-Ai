/**
 * useSpeechTranscription — Web Speech API hook for real-time captions.
 *
 * Uses SpeechRecognition (Chromium) in continuous + interim-results mode.
 * Provides a live caption string (shown in the overlay while the user speaks)
 * and accumulates a finalTranscript across multiple recognition segments.
 *
 * KEY BUG FIX (multi-question transcription):
 *   The onend auto-restart handler previously only checked `isListeningRef.current`.
 *   After Q1 stopListening() → Q2 startListening(), the stale Q1 rec.onend would
 *   fire AFTER Q2's startListening() set isListeningRef=true. Seeing it true, the
 *   OLD recognition restarted and competed with the new one — Chrome kills both,
 *   leaving the user with a mic that shows "Listening" but transcribes nothing.
 *
 *   FIX: onend checks `recognitionRef.current === recognition` to ensure only
 *   the CURRENTLY ACTIVE instance auto-restarts. Stale instances are silently dropped.
 *
 *   Also: stopListening() now nulls recognitionRef BEFORE calling abort() so the
 *   abort-triggered onend immediately sees a stale ref and does not restart.
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

  const [isListening,     setIsListening]     = useState(false);
  const [liveCaption,     setLiveCaption]     = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  const recognitionRef     = useRef<ISpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");   // sync copy for synchronous reads
  const isListeningRef     = useRef(false);

  // ── Initialise a fresh recognition instance ──────────────────────────────
  //
  // CRITICAL: The onend handler uses `recognitionRef.current === recognition`
  // to check whether THIS instance is still the active one before restarting.
  // Without this guard, a stale Q(n-1) instance fires onend after Q(n)'s
  // startListening() has set isListeningRef=true, causing the old instance to
  // restart and compete with the new one — Chrome kills both → no transcription.
  //
  const initRecognition = useCallback((): ISpeechRecognition | null => {
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      // Only process results from the currently-active recognition
      if (recognitionRef.current !== recognition) return;

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
      // Show accumulated final + current interim so caption never goes blank
      const combined = (finalTranscriptRef.current + " " + interim).trim();
      setLiveCaption(combined || "");
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      // Only handle errors from the currently-active recognition
      if (recognitionRef.current !== recognition) return;
      // "no-speech" is not a real error — just silence
      if (event.error === "no-speech") return;
      console.warn("[useSpeechTranscription] Recognition error:", event.error);
    };

    recognition.onend = () => {
      // KEY FIX: Only auto-restart if THIS instance is still the active one.
      // Stale instances (from previous questions) must NOT restart — they would
      // compete with the new instance and break transcription for all subsequent Qs.
      if (isListeningRef.current && recognitionRef.current === recognition) {
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
    if (!isSupported) return;

    // If somehow called while already listening, stop the old instance first
    // so we don't end up with two competing recognitions
    if (recognitionRef.current) {
      const old = recognitionRef.current;
      recognitionRef.current = null; // null BEFORE abort so onend doesn't restart
      try { old.abort(); } catch { /* ignore */ }
    }

    // Only skip if isListeningRef says we're active AND we have an instance
    // (the above block handles the "already have one" case, so just guard flag)
    isListeningRef.current = false; // reset so we can proceed

    const rec = initRecognition();
    if (!rec) return;

    recognitionRef.current = rec;
    isListeningRef.current = true;
    setIsListening(true);
    setLiveCaption("");

    try {
      rec.start();
      console.log("[Speech] Recognition started for new question");
    } catch (e) {
      console.error("[Speech] Failed to start recognition:", e);
    }
  }, [isSupported, initRecognition]);

  // ── stopListening ────────────────────────────────────────────────────────
  const stopListening = useCallback((): string => {
    isListeningRef.current = false;
    setIsListening(false);
    setLiveCaption("");

    // Null recognitionRef BEFORE calling abort() so the abort-triggered
    // onend immediately sees recognitionRef.current !== recognition and
    // does not attempt to restart this instance.
    const rec = recognitionRef.current;
    recognitionRef.current = null;

    if (rec) {
      try {
        // abort() discards pending audio — more immediate than stop()
        // which would process remaining audio and fire late onresult events
        // that could corrupt the next question's transcript.
        rec.abort();
      } catch {
        // Already stopped — ignore
      }
    }

    console.log("[Speech] Stopped. Transcript:", finalTranscriptRef.current.trim().slice(0, 80));
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
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      if (rec) {
        try { rec.abort(); } catch { /* ignore */ }
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
