/**
 * useAIRAVoice — Browser-native TTS hook for AIRA's voice.
 *
 * CRITICAL FIX: speak() now has a hard 4-second max timeout.
 * Previously `text.length * 75ms` created 15-second hangs on the greeting
 * phrase, blocking the entire interview flow.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAIRAVoiceReturn {
  speak: (text: string) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

const PREFERRED_VOICES = [
  "Google UK English Female",
  "Google US English Female",
  "Microsoft Zira Desktop",
  "Microsoft Aria Online",
  "Samantha",
  "Victoria",
  "Karen",
  "Moira",
  "Tessa",
];

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  for (const pref of PREFERRED_VOICES) {
    const match = voices.find(
      (v) => v.name === pref || v.name.includes(pref.split(" ").pop()!)
    );
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

export function useAIRAVoice(): UseAIRAVoiceReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = typeof window !== "undefined" && !!window.speechSynthesis;

  // Ensure voices are loaded (Chrome loads voices asynchronously)
  useEffect(() => {
    if (!isSupported) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () =>
      window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!isSupported || !text.trim()) {
          resolve();
          return;
        }

        // Cancel any in-flight speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        const voice = pickVoice();
        if (voice) utterance.voice = voice;

        utterance.rate   = 0.92;
        utterance.pitch  = 1.05;
        utterance.volume = 1.0;
        utterance.lang   = "en-US";

        let resolved = false;
        const done = () => {
          if (resolved) return;
          resolved = true;
          clearTimeout(hardTimeout);
          clearInterval(resumeTimer);
          setIsSpeaking(false);
          resolve();
        };

        // Calculate a realistic timeout based on word count:
        //   rate=0.92 ≈ 500ms per word at normal speed.
        //   Add 2s padding. Clamp between 8s (min) and 30s (max).
        // This replaces the old hard 4s that cut every question mid-sentence.
        const wordCount = text.trim().split(/\s+/).length;
        const estimatedMs = Math.max(8000, Math.min(30000, wordCount * 500 + 2000));
        const hardTimeout = setTimeout(done, estimatedMs);

        // Chrome keepalive — prevents long utterances being cut off
        const resumeTimer = setInterval(() => {
          if (!window.speechSynthesis.speaking) { clearInterval(resumeTimer); return; }
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }, 8000);

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend   = done;
        utterance.onerror = done;

        window.speechSynthesis.speak(utterance);
      });
    },
    [isSupported]
  );

  return { speak, cancel, isSpeaking, isSupported };
}
