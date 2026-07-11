/**
 * Frontend API service for the interview analysis pipeline.
 *
 * Uses the existing `apiClient` (axios) which automatically attaches the
 * in-memory Bearer token via the request interceptor in src/lib/axios.ts.
 *
 * Calls:
 *   POST /interview/analyze-question
 *   POST /interview/finalize
 */

import { apiClient } from "@/lib/axios";
import type {
  InterviewFinalizeRequest,
  InterviewFinalizeResponse,
  QuestionAnalysisRequest,
  QuestionAnalysisResponse,
} from "@/types/interview";

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Submit a single question-answer pair for per-question Gemini/Groq analysis.
 *
 * @param payload  The question text, transcript, and vision metrics.
 * @returns        Scored QuestionAnalysisResponse.
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
 *
 * @param payload  Candidate metadata + list of all question results.
 * @returns        InterviewFinalizeResponse with overall score and weak questions.
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
