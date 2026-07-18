/**
 * Frontend API service for the interview analysis pipeline.
 *
 * LLM-1 (Question Generator): generateNextQuestion()  → /interview/generate-next-question
 * LLM-2 (Answer Evaluator):   analyzeQuestion()       → /interview/analyze-question
 * Report:                      finalizeInterview()     → /interview/finalize
 *
 * Uses the existing `apiClient` (axios) which automatically attaches the
 * in-memory Bearer token via the request interceptor in src/lib/axios.ts.
 */

import { apiClient } from "@/lib/axios";
import type {
  InterviewFinalizeRequest,
  InterviewFinalizeResponse,
  QuestionAnalysisRequest,
  QuestionAnalysisResponse,
} from "@/types/interview";

// ---------------------------------------------------------------------------
// LLM-2: Per-question answer evaluation
// ---------------------------------------------------------------------------

/**
 * Submit a single question-answer pair for per-question Gemini/Groq analysis.
 */
export async function analyzeQuestion(
  payload: QuestionAnalysisRequest
): Promise<QuestionAnalysisResponse> {
  const { data } = await apiClient.post<QuestionAnalysisResponse>(
    "/interview/analyze-question",
    payload
  );
  return data;
}

/**
 * Submit all question results to finalise the interview and get a full report.
 */
export async function finalizeInterview(
  payload: InterviewFinalizeRequest
): Promise<InterviewFinalizeResponse> {
  const { data } = await apiClient.post<InterviewFinalizeResponse>(
    "/interview/finalize",
    payload
  );
  return data;
}

// ---------------------------------------------------------------------------
// Question generation (initial batch — used at setup)
// ---------------------------------------------------------------------------

export interface GenerateQuestionsRequest {
  resume_text?: string;
  job_description?: string;
  job_title?: string;
  num_questions?: number;
}

export interface GeneratedQuestion {
  text: string;
  category: string;
  tip: string;
}

export interface GeneratedQuestionsResponse {
  job_title: string;
  questions: GeneratedQuestion[];
}

/**
 * Generate the initial set of interview questions via Gemini/Groq.
 */
export async function generateQuestions(
  payload: GenerateQuestionsRequest
): Promise<GeneratedQuestionsResponse> {
  const { data } = await apiClient.post<GeneratedQuestionsResponse>(
    "/interview/generate-questions",
    payload
  );
  return data;
}

// ---------------------------------------------------------------------------
// LLM-1: Dynamic follow-up question generator (called live during interview)
// ---------------------------------------------------------------------------

export interface PriorQAPair {
  question_text: string;
  answer_transcript: string;
  answer_score: number;
  category: string;
}

export interface GenerateNextQuestionRequest {
  job_title?: string;
  resume_text?: string;
  job_description?: string;
  prior_qa_pairs: PriorQAPair[];
  question_number: number;
  total_questions: number;
  covered_categories: string[];
}

export interface GenerateNextQuestionResponse {
  question_text: string;
  category: string;
  tip: string;
}

/**
 * LLM-1: Generate the next contextual question dynamically based on the
 * full conversation history and scores. This is a SEPARATE LLM persona from
 * the answer analysis LLM-2, enabling two independent AI actors.
 */
export async function generateNextQuestion(
  payload: GenerateNextQuestionRequest
): Promise<GenerateNextQuestionResponse> {
  const { data } = await apiClient.post<GenerateNextQuestionResponse>(
    "/interview/generate-next-question",
    payload
  );
  return data;
}
