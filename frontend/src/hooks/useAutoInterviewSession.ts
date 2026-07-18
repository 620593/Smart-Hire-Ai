/**
 * useAutoInterviewSession — Fully automated, LLM-driven interview orchestrator.
 *
 * KEY FIXES:
 *
 *  [CRITICAL] React Strict Mode double-mount bug:
 *    useRef(true) initializes isMountedRef, but in dev/Strict Mode React
 *    intentionally simulates unmount → the cleanup fires → isMountedRef.current
 *    becomes false. The subsequent re-mount never resets it. Every
 *    `if (!isMountedRef.current) return` then exits silently, killing the
 *    async interview chain right after the greeting.
 *    FIX: reset isMountedRef.current = true INSIDE the useEffect body.
 *
 *  [CRITICAL] TTS blocking: speak() had a maxDuration = text.length * 75ms
 *    causing 15-second hangs. Fixed: hard 4s timeout in useAIRAVoice.
 *
 *  [CRITICAL] Fire-and-forget TTS: greeting/thinking/encourage phrases now
 *    use `void speak(...)` — only the question itself is awaited.
 *
 *  [PERF] Question generation race: Q1 starts generating immediately after
 *    greeting fires; a 3-second race means a fallback is used if backend is slow.
 *
 * Architecture:
 *  LLM-1 (Interviewer)  → generateNextQuestion() → DynamicQuestionService
 *  LLM-2 (Evaluator)    → analyzeQuestion()       → InterviewAnalysisService
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { useVideoAnalysis } from "@/hooks/useVideoAnalysis";
import { useSpeechTranscription } from "@/hooks/useSpeechTranscription";
import { useAIRAVoice } from "@/hooks/useAIRAVoice";
import {
  analyzeQuestion,
  finalizeInterview,
  generateNextQuestion,
} from "@/services/interview";
import type {
  InterviewFinalizeResponse,
  QuestionAnalysisResponse,
  VisionMetrics,
} from "@/types/interview";
import type { AIRAState } from "@/components/avatar/AIRAAvatar";
import type { GeneratedQuestion } from "@/services/interview";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERVIEW_DURATION_SEC  = 10 * 60;  // 600 seconds
const SILENCE_AFTER_SPEECH_MS = 2500;
const NO_SPEECH_TIMEOUT_MS    = 9000;
// Removed: MIN_WORDS_BEFORE_NEXT — any answer is accepted after 2.5s silence
// Removed: MAX_QUESTIONS (5) — questions continue until time expires or user ends

// Max ms to wait for LLM-1 before using fallback question
const Q_GEN_TIMEOUT_MS        = 5000;

const REPEAT_TRIGGERS = [
  "repeat", "again", "didn't understand", "don't understand",
  "what did you say", "pardon", "say that again", "can't hear",
  "not sure what you asked", "what was the question",
];

// ---------------------------------------------------------------------------
// AIRA scripted lines
// ---------------------------------------------------------------------------

const GREET = (name: string) =>
  `Hello ${name}! I'm AIRA, your AI interview assistant. I'll ask questions based on your background — questions continue until time is up or you choose to end. Let's begin!`;

const ELABORATE   = "Could you elaborate a bit more?";
const THINKING    = "Got it, evaluating your answer.";
const ENCOURAGE   = "Great, moving to the next question.";
const NO_ANSWER   = "Take your time, share your answer whenever ready.";
const TIMEOUT_MSG = "Time's up! Compiling your results now.";
const DONE_MSG    = "All done! Generating your report now.";
const GENERATING  = "Preparing your next question.";

// Fallback questions for when the LLM backend is unavailable / slow
// Fresher-appropriate: clear, approachable, entry-level
const FALLBACK_QUESTIONS: GeneratedQuestion[] = [
  { text: "Tell me a bit about yourself and why you're interested in this role.", category: "Introduction", tip: "Keep it to 2 minutes — cover your background, skills, and why this role excites you." },
  { text: "Can you describe a project you worked on during your studies or training that you're proud of?", category: "Project Experience", tip: "Describe what you built, your role, and what you learned." },
  { text: "What programming languages or tools have you worked with, and which are you most comfortable with?", category: "Technical Skills", tip: "Be honest about your comfort level and mention any personal or college projects." },
  { text: "Tell me about a time you had to learn something new quickly. How did you approach it?", category: "Adaptability", tip: "Focus on your learning process — videos, docs, practice — and what you achieved." },
  { text: "How do you handle working in a team when there are disagreements or different approaches?", category: "Collaboration", tip: "Give a real example; emphasise listening, compromising, and focusing on the goal." },
  { text: "Where do you see yourself in the next 2 years, and how does this role fit into that plan?", category: "Career Goals", tip: "Show enthusiasm and connect your growth goals to what this company offers." },
  { text: "Describe a challenge you faced in a college project or internship and how you solved it.", category: "Problem Solving", tip: "Use the STAR format: Situation, Task, Action, Result." },
  { text: "What do you know about our company, and what excites you most about working here?", category: "Culture Fit", tip: "Research the company beforehand — mention specific products, values, or recent news." },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InterviewPhase =
  | "idle"
  | "greeting"
  | "generating_question"
  | "speaking_question"
  | "listening"
  | "processing"
  | "done"
  | "finished";

export interface AutoSessionState {
  phase:             InterviewPhase;
  currentIndex:      number;
  questions:         GeneratedQuestion[];
  results:           QuestionAnalysisResponse[];
  liveCaption:       string;
  isProcessing:      boolean;
  processingMessage: string;
  error:             string | null;
  timeRemainingSec:  number;
  isFinished:        boolean;
  airaState:         AIRAState;
  airaSubtitle:      string;
  elaborateCount:    number;
  currentQuestion:   GeneratedQuestion | null;
}

export interface UseAutoInterviewSessionReturn {
  session:          AutoSessionState;
  isVisionReady:    boolean;
  isListening:      boolean;
  liveMetrics:      VisionMetrics;
  isSpeaking:       boolean;
  startInterview: (
    candidateName?: string,
    jobTitle?:      string,
    resumeText?:    string,
    jobDescription?: string,
    onFinished?:    (report: InterviewFinalizeResponse | null) => void,
  ) => Promise<void>;
  endInterviewEarly: () => Promise<InterviewFinalizeResponse | null>;
}

// ---------------------------------------------------------------------------
// Helper: race LLM-1 against a timeout, return fallback on loss
// ---------------------------------------------------------------------------

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  const timeout = new Promise<T>((resolve) =>
    setTimeout(() => resolve(fallback), ms)
  );
  return Promise.race([promise, timeout]);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAutoInterviewSession(
  videoRef: RefObject<HTMLVideoElement | null>,
  seedQ1?: GeneratedQuestion | null,
  externalStreamRef?: RefObject<MediaStream | null>,
): UseAutoInterviewSessionReturn {

  const [session, setSession] = useState<AutoSessionState>({
    phase:             "idle",
    currentIndex:      0,
    questions:         [],
    results:           [],
    liveCaption:       "",
    isProcessing:      false,
    processingMessage: "",
    error:             null,
    timeRemainingSec:  INTERVIEW_DURATION_SEC,
    isFinished:        false,
    airaState:         "greeting",
    airaSubtitle:      "",
    elaborateCount:    0,
    currentQuestion:   null,
  });

  const vision = useVideoAnalysis({ videoRef, externalStream: externalStreamRef });
  const speech = useSpeechTranscription();
  const { speak, cancel: cancelVoice, isSpeaking } = useAIRAVoice();

  // ------------ Stable refs --------------------------------------------
  const sessionRef        = useRef(session);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noAnswerTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef     = useRef(false);

  // CRITICAL FIX: isMountedRef MUST be reset to true inside the useEffect body.
  // React StrictMode (dev) intentionally: mount → cleanup (sets to false) → remount.
  // Without the reset, isMountedRef.current stays false and every async guard
  // `if (!isMountedRef.current) return` kills the interview chain silently.
  const isMountedRef = useRef(true);

  const candidateNameRef  = useRef("Candidate");
  const jobTitleRef       = useRef("");
  const resumeTextRef     = useRef("");
  const jobDescRef        = useRef("");
  const onFinishedRef     = useRef<((r: InterviewFinalizeResponse | null) => void) | undefined>(undefined);
  const askedTextsRef     = useRef<string[]>([]);
  const lastCaptionRef    = useRef("");
  const capturedTxRef     = useRef("");

  // Stable cross-refs to break circular async deps
  const askQuestionRef  = useRef<((idx: number, q: GeneratedQuestion) => Promise<void>) | undefined>(undefined);
  const submitAnswerRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => { sessionRef.current = session; }, [session]);

  // CRITICAL FIX: reset isMountedRef.current = true in the mount body so
  // the React StrictMode double-mount cycle doesn't leave it as false.
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ------------ safe state setter --------------------------------------
  const safeSet = useCallback(
    (updater: (prev: AutoSessionState) => AutoSessionState) => {
      if (isMountedRef.current) setSession(updater);
    },
    []
  );

  const setAira = useCallback(
    (state: AIRAState, subtitle: string) => {
      safeSet((p) => ({ ...p, airaState: state, airaSubtitle: subtitle }));
    },
    [safeSet]
  );

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current)  clearTimeout(silenceTimerRef.current);
    if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
    silenceTimerRef.current  = null;
    noAnswerTimerRef.current = null;
  }, []);

  // ------------ 10-minute countdown timer ------------------------------
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const id = setInterval(() => {
      setSession((p) => {           // use setSession directly — no isMountedRef guard needed for intervals
        const next = p.timeRemainingSec - 1;
        if (next <= 0) {
          clearInterval(id);
          return { ...p, timeRemainingSec: 0 };
        }
        return { ...p, timeRemainingSec: next };
      });
    }, 1000);
    timerRef.current = id;
    console.log("[TIMER] Started — interval id:", id);
  }, []);

  // ------------ LLM-1: fetch next dynamic question ---------------------
  const fetchNextQuestion = useCallback(
    async (questionNumber: number): Promise<GeneratedQuestion> => {
      const s = sessionRef.current;

      const priorQAPairs = s.results.map((r, i) => ({
        question_text:     r.question_text,
        answer_transcript: r.transcript,
        answer_score:      r.result.overall_score,
        category:          s.questions[i]?.category ?? "General",
      }));

      const coveredCategories = s.questions
        .slice(0, questionNumber - 1)
        .map((q) => q.category)
        .filter(Boolean);

      const backendCall = generateNextQuestion({
        job_title:          jobTitleRef.current,
        resume_text:        resumeTextRef.current,
        job_description:    jobDescRef.current,
        prior_qa_pairs:     priorQAPairs,
        question_number:    questionNumber,
        total_questions:    MAX_QUESTIONS,
        covered_categories: coveredCategories,
      }).then((res): GeneratedQuestion => ({
        text:     res.question_text,
        category: res.category,
        tip:      res.tip,
      }));

      // Race against timeout — use fallback if backend is slow
      const fallback = seedQ1 && questionNumber === 1
        ? seedQ1
        : FALLBACK_QUESTIONS[(questionNumber - 1) % FALLBACK_QUESTIONS.length];

      const result = await withTimeout(backendCall, Q_GEN_TIMEOUT_MS, fallback);
      console.log(`[LLM-1] Q${questionNumber} ready:`, result.text.slice(0, 60));
      return result;
    },
    [seedQ1]
  );

  // ------------ ASK QUESTION (speak question + start listening) --------
  const askQuestion = useCallback(
    async (idx: number, q: GeneratedQuestion) => {
      console.log(`[INTERVIEW] askQuestion(${idx}) →`, q.text.slice(0, 60));

      // Track asked questions for dedup
      askedTextsRef.current.push(q.text);

      setAira("speaking", q.text);
      safeSet((p) => ({
        ...p,
        phase:           "speaking_question",
        airaSubtitle:    q.text,
        currentIndex:    idx,
        currentQuestion: q,
        isProcessing:    false,
        questions: [
          ...p.questions.slice(0, idx),
          q,
          ...p.questions.slice(idx + 1),
        ],
      }));

      // Await the question TTS — listeners only start AFTER question is spoken
      const intro = `Question ${idx + 1}. ${q.text}`;
      await speak(intro);

      // Brief pause before listening
      await new Promise<void>((r) => setTimeout(r, 400));

      // Check still mounted (legitimate guard — after real async operations)
      if (!isMountedRef.current) {
        console.warn("[INTERVIEW] askQuestion: unmounted after TTS, bailing");
        return;
      }

      console.log(`[INTERVIEW] Q${idx + 1} spoken — starting listening`);
      setAira("listening", "Listening…");
      speech.resetTranscript();
      lastCaptionRef.current = "";
      capturedTxRef.current  = "";
      safeSet((p) => ({ ...p, phase: "listening", liveCaption: "", elaborateCount: 0 }));
      speech.startListening();
      void vision.startCapture();

      // No-answer nudge after 9s
      noAnswerTimerRef.current = setTimeout(() => {
        if (sessionRef.current.phase !== "listening" || processingRef.current) return;
        if (lastCaptionRef.current.trim().length > 0) return;
        setAira("listening", NO_ANSWER);
        void speak(NO_ANSWER);
      }, NO_SPEECH_TIMEOUT_MS);
    },
    [setAira, speak, speech, vision, safeSet]
  );

  // Sync refs synchronously so they're never undefined on first call
  useLayoutEffect(() => { askQuestionRef.current = askQuestion; }, [askQuestion]);

  // ------------ SUBMIT ANSWER (LLM-2 evaluate + chain to next Q) -------
  const submitCurrentAnswer = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    clearTimers();

    const transcript    = speech.stopListening();
    capturedTxRef.current = transcript;
    const visionMetrics = vision.stopCapture();

    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    const s         = sessionRef.current;
    const currentQ  = s.currentQuestion ?? s.questions[s.currentIndex];

    if (!currentQ) { processingRef.current = false; return; }

    // No word-count minimum: accept any answer after 2.5s silence.
    // (wordCount kept for logging only)
    console.log(`[INTERVIEW] Q${s.currentIndex + 1} answer: ${wordCount} words`);

    // LLM-2: Evaluate answer
    setAira("thinking", THINKING);
    void speak(THINKING);
    safeSet((p) => ({
      ...p,
      phase:             "processing",
      isProcessing:      true,
      processingMessage: "Analysing your answer…",
      liveCaption:       "",
    }));

    let analysisResult: QuestionAnalysisResponse | null = null;
    try {
      analysisResult = await analyzeQuestion({
        question_index: s.currentIndex,
        question_text:  currentQ.text,
        transcript:     capturedTxRef.current,
        vision_metrics: visionMetrics,
      });

      safeSet((p) => ({
        ...p,
        results:        [...p.results, analysisResult!],
        isProcessing:   false,
        elaborateCount: 0,
      }));

      if ((analysisResult?.result?.overall_score ?? 0) >= 65) {
        setAira("encouraging", ENCOURAGE);
        void speak(ENCOURAGE);
        await new Promise<void>((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error("[LLM-2] analyzeQuestion failed:", err);
      safeSet((p) => ({ ...p, isProcessing: false, elaborateCount: 0 }));
    }

    // No question count limit: questions continue until timer expires or user ends.
    // The done/finished phase is triggered only by timeout or endInterviewEarly().
    const nextIdx = s.currentIndex + 1;

    // LLM-1: Generate next question
    setAira("thinking", GENERATING);
    void speak(GENERATING);
    safeSet((p) => ({
      ...p,
      currentIndex:      nextIdx,
      phase:             "generating_question",
      isProcessing:      true,
      processingMessage: "Preparing next question…",
    }));
    processingRef.current = false;

    try {
      const nextQ = await fetchNextQuestion(nextIdx + 1);
      safeSet((p) => ({ ...p, isProcessing: false, currentQuestion: nextQ }));
      await askQuestionRef.current?.(nextIdx, nextQ);
    } catch (err) {
      console.error("[LLM-1] fetchNextQuestion failed:", err);
      safeSet((p) => ({ ...p, isProcessing: false, error: "Question generation failed.", phase: "done", isFinished: true }));
    }
  }, [speech, vision, setAira, speak, safeSet, clearTimers, fetchNextQuestion]);

  useLayoutEffect(() => { submitAnswerRef.current = submitCurrentAnswer; }, [submitCurrentAnswer]);

  // ------------ Silence detection -------------------------------------
  useEffect(() => {
    if (session.phase !== "listening") return;
    const caption = speech.liveCaption;
    if (caption === lastCaptionRef.current) return;
    const prev = lastCaptionRef.current;
    lastCaptionRef.current = caption;
    if (!caption && !prev) return;

    const lower = caption.toLowerCase();
    if (REPEAT_TRIGGERS.some((t) => lower.includes(t))) {
      speech.resetTranscript();
      const q = sessionRef.current.currentQuestion ?? sessionRef.current.questions[sessionRef.current.currentIndex];
      if (q) void speak(q.text).then(() => setAira("listening", "Listening…"));
      return;
    }

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (sessionRef.current.phase === "listening" && !processingRef.current) {
        void submitAnswerRef.current?.();
      }
    }, SILENCE_AFTER_SPEECH_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.liveCaption, session.phase]);

  // ------------ Finalize interview -----------------------------------
  const doFinalize = useCallback(
    async (reason: "finished" | "timeout" | "early"): Promise<InterviewFinalizeResponse | null> => {
      cancelVoice();
      vision.stopCapture();
      speech.stopListening();
      clearTimers();
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

      const msg = reason === "timeout" ? TIMEOUT_MSG : DONE_MSG;
      setAira("greeting", msg);
      void speak(msg);

      safeSet((p) => ({
        ...p,
        isProcessing:      true,
        processingMessage: "Generating your report…",
        isFinished:        true,
        phase:             "finished",
      }));

      await new Promise<void>((r) => setTimeout(r, 1500));

      const results = sessionRef.current.results;
      if (results.length === 0) {
        safeSet((p) => ({ ...p, isProcessing: false }));
        onFinishedRef.current?.(null);
        return null;
      }

      try {
        const response = await finalizeInterview({
          candidate_name:   candidateNameRef.current,
          job_title:        jobTitleRef.current,
          question_results: results,
        });
        // Persist to sessionStorage so /reports can read it even after navigation
        try {
          sessionStorage.setItem("last_interview_report", JSON.stringify(response));
        } catch { /* quota exceeded */ }
        safeSet((p) => ({ ...p, isProcessing: false }));
        onFinishedRef.current?.(response);
        return response;
      } catch (err) {
        console.error("Finalize error:", err);
        safeSet((p) => ({ ...p, isProcessing: false, error: "Failed to generate report." }));
        onFinishedRef.current?.(null);
        return null;
      }
    },
    [cancelVoice, vision, speech, setAira, speak, safeSet, clearTimers]
  );

  // Auto-finalize on timeout
  useEffect(() => {
    if (session.timeRemainingSec <= 0 && !session.isFinished && session.phase !== "idle" && session.phase !== "finished") {
      void doFinalize("timeout");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.timeRemainingSec]);

  // Note: interview only finalizes via timeout (timeRemainingSec=0) or user ending early.
  // There is no question-count-based done condition anymore.

  // ------------ Public: startInterview --------------------------------
  const startInterview = useCallback(
    async (
      name       = "Candidate",
      jobTitle   = "",
      resumeText = "",
      jobDesc    = "",
      onFinished?: (report: InterviewFinalizeResponse | null) => void,
    ) => {
      console.log("[INTERVIEW] startInterview called. isMounted:", isMountedRef.current);

      candidateNameRef.current = name;
      jobTitleRef.current      = jobTitle;
      resumeTextRef.current    = resumeText;
      jobDescRef.current       = jobDesc;
      onFinishedRef.current    = onFinished;
      askedTextsRef.current    = [];
      processingRef.current    = false;

      // ① Start timer immediately — runs independently in its own interval
      startTimer();

      // ② Fire greeting TTS concurrently with Q1 generation (don't await)
      setAira("greeting", "Welcome!");
      safeSet((p) => ({ ...p, phase: "greeting", airaState: "greeting" }));
      void speak(GREET(name));

      // ③ Start generating Q1 immediately in the background
      safeSet((p) => ({
        ...p,
        phase:             "generating_question",
        processingMessage: "Preparing your first question…",
        isProcessing:      true,
      }));
      setAira("thinking", "Preparing first question…");

      // ④ Fetch Q1 — race against 5s timeout, use fallback if backend slow
      let firstQ: GeneratedQuestion;
      try {
        const fallback = seedQ1 ?? FALLBACK_QUESTIONS[0];
        firstQ = await withTimeout(fetchNextQuestion(1), Q_GEN_TIMEOUT_MS, fallback);
      } catch {
        firstQ = seedQ1 ?? FALLBACK_QUESTIONS[0];
      }

      console.log("[INTERVIEW] Q1 ready, askQuestionRef set:", !!askQuestionRef.current, "isMounted:", isMountedRef.current);

      // ⑤ Wait for greeting to have played (min 2.5s from start)
      // (we already started generating Q1, so this overlap is free)
      await new Promise<void>((r) => setTimeout(r, 2000));

      // NOTE: We do NOT check isMountedRef here — the Strict Mode double-mount
      // fix above means it will be true. We only check after real async I/O.
      console.log("[INTERVIEW] Asking Q1 now. isMounted:", isMountedRef.current);

      // ⑥ Ask Q1
      const askFn = askQuestionRef.current;
      if (askFn) {
        await askFn(0, firstQ);
      } else {
        console.error("[INTERVIEW] askQuestionRef.current is undefined — this should not happen!");
      }
    },
    [setAira, speak, startTimer, safeSet, fetchNextQuestion, seedQ1]
  );

  const endInterviewEarly = useCallback(
    () => doFinalize("early"),
    [doFinalize]
  );

  return {
    session:       { ...session, liveCaption: speech.liveCaption },
    isVisionReady: vision.isInitialized,
    isListening:   speech.isListening,
    liveMetrics:   vision.liveMetrics,
    isSpeaking,
    startInterview,
    endInterviewEarly,
  };
}
