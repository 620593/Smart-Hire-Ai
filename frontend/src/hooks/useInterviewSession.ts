/**
 * useInterviewSession — Orchestrator hook for the full interview pipeline.
 *
 * Coordinates useVideoAnalysis and useSpeechTranscription, manages question
 * state, and drives the per-question analyze → finalize backend calls.
 *
 * Flow per question:
 *   idle → startAnswer() → listening → submitAnswer() → 2-sec processing → done
 * After all questions: finalizeInterview() → returns InterviewFinalizeResponse.
 */

import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";

import { useVideoAnalysis } from "@/hooks/useVideoAnalysis";
import { useSpeechTranscription } from "@/hooks/useSpeechTranscription";
import { analyzeQuestion, finalizeInterview } from "@/services/interview";
import type {
  AnswerPhase,
  InterviewFinalizeResponse,
  InterviewQuestion,
  QuestionAnalysisResponse,
  VisionMetrics,
} from "@/types/interview";

// ---------------------------------------------------------------------------
// Default interview questions (used when none are supplied via route state)
// ---------------------------------------------------------------------------

export const DEFAULT_QUESTIONS: InterviewQuestion[] = [
  {
    text: "Tell me about yourself and your professional background.",
    category: "Introduction",
    tip: "Keep it concise: present → past → future. Highlight what's relevant to this role.",
  },
  {
    text: "Describe a challenging technical problem you solved and walk me through your approach.",
    category: "Problem Solving",
    tip: "Use the STAR method: Situation → Task → Action → Result.",
  },
  {
    text: "Tell me about a time you had to resolve a conflict within your team.",
    category: "Conflict Resolution",
    tip: "Focus on listening, empathy, and the positive outcome for the team.",
  },
  {
    text: "How do you prioritise tasks when working under tight deadlines?",
    category: "Time Management",
    tip: "Mention frameworks: Eisenhower matrix, MoSCoW, or daily standups.",
  },
  {
    text: "Where do you see yourself in 3–5 years, and how does this role fit that path?",
    category: "Career Goals",
    tip: "Show alignment between your ambitions and what the company offers.",
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionState {
  phase: AnswerPhase;
  currentIndex: number;
  questions: InterviewQuestion[];
  results: QuestionAnalysisResponse[];
  liveCaption: string;
  isProcessing: boolean;
  processingMessage: string;
  error: string | null;
}

export interface UseInterviewSessionReturn {
  session: SessionState;
  // From sub-hooks (exposed for UI)
  isVisionReady: boolean;
  isListening: boolean;
  liveMetrics: VisionMetrics;
  speechError: string | null;
  // Actions
  startAnswer: () => void;
  submitAnswer: () => Promise<void>;
  endInterview: (candidateName?: string, jobTitle?: string) => Promise<InterviewFinalizeResponse>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInterviewSession(
  videoRef: RefObject<HTMLVideoElement | null>,
  questions: InterviewQuestion[] = DEFAULT_QUESTIONS
): UseInterviewSessionReturn {
  const [session, setSession] = useState<SessionState>({
    phase: "idle",
    currentIndex: 0,
    questions,
    results: [],
    liveCaption: "",
    isProcessing: false,
    processingMessage: "",
    error: null,
  });

  // Sub-hooks
  const vision = useVideoAnalysis({ videoRef });
  const speech = useSpeechTranscription();

  // Keep a ref to the current finalTranscript for synchronous access in submitAnswer
  const capturedTranscriptRef = useRef("");

  // ── startAnswer ──────────────────────────────────────────────────────────
  const startAnswer = useCallback(() => {
    speech.resetTranscript();
    capturedTranscriptRef.current = "";

    setSession((prev) => ({
      ...prev,
      phase: "listening",
      liveCaption: "",
      error: null,
    }));

    speech.startListening();
    void vision.startCapture();
  }, [speech, vision]);

  // ── submitAnswer ─────────────────────────────────────────────────────────
  const submitAnswer = useCallback(async () => {
    // Capture final transcript synchronously before stopping recognition
    const transcript = speech.stopListening();
    capturedTranscriptRef.current = transcript;

    // Stop vision capture and grab accumulated metrics
    const visionMetrics = vision.stopCapture();

    setSession((prev) => ({
      ...prev,
      phase: "processing",
      liveCaption: "",
      isProcessing: true,
      processingMessage: "Analysing your answer…",
    }));

    // 2-second idle window (as per spec)
    await new Promise((r) => setTimeout(r, 2000));

    const currentQuestion = session.questions[session.currentIndex];

    try {
      const result = await analyzeQuestion({
        question_index: session.currentIndex,
        question_text: currentQuestion.text,
        transcript: capturedTranscriptRef.current,
        vision_metrics: visionMetrics,
      });

      setSession((prev) => ({
        ...prev,
        phase: "done",
        isProcessing: false,
        processingMessage: "",
        results: [...prev.results, result],
        // Advance to next question automatically
        currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
      }));
    } catch (err) {
      console.error("[useInterviewSession] analyzeQuestion failed:", err);
      setSession((prev) => ({
        ...prev,
        phase: "done",
        isProcessing: false,
        processingMessage: "",
        error: err instanceof Error ? err.message : "Analysis failed. Please continue.",
        // Still advance
        currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
      }));
    }
  }, [session.currentIndex, session.questions, speech, vision]);

  // ── endInterview ─────────────────────────────────────────────────────────
  const endInterview = useCallback(
    async (
      candidateName = "Candidate",
      jobTitle = ""
    ): Promise<InterviewFinalizeResponse> => {
      // Stop any ongoing capture
      if (vision.isActive) vision.stopCapture();
      if (speech.isListening) speech.stopListening();

      setSession((prev) => ({
        ...prev,
        isProcessing: true,
        processingMessage: "Generating your interview report…",
      }));

      const response = await finalizeInterview({
        candidate_name: candidateName,
        job_title: jobTitle,
        question_results: session.results,
      });

      setSession((prev) => ({
        ...prev,
        isProcessing: false,
        processingMessage: "",
      }));

      return response;
    },
    [session.results, vision, speech]
  );

  // ── Sync liveCaption into session state ──────────────────────────────────
  // We update session.liveCaption whenever speech.liveCaption changes by
  // returning it directly from the hook (avoids unnecessary re-renders of
  // the entire session object).

  return {
    session: {
      ...session,
      liveCaption: speech.liveCaption,
    },
    isVisionReady: vision.isInitialized,
    isListening: speech.isListening,
    liveMetrics: vision.liveMetrics,
    speechError: vision.error,
    startAnswer,
    submitAnswer,
    endInterview,
  };
}
