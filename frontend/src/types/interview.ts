/**
 * TypeScript interfaces for the interview analysis pipeline.
 * Mirrors the backend Pydantic schemas in app/schemas/interview.py exactly.
 */

// ---------------------------------------------------------------------------
// Vision metrics
// ---------------------------------------------------------------------------

export interface HeadPoseMetrics {
  yaw_mean: number;
  pitch_mean: number;
  roll_mean: number;
  yaw_std: number;
  pitch_std: number;
  roll_std: number;
}

export interface VisionMetrics {
  duration_seconds: number;
  face_presence_percent: number;
  eye_contact_percent: number;
  attention_percent: number;
  blink_rate_per_minute: number;
  smile_score_percent: number;
  confidence: number;
  head_pose: HeadPoseMetrics;
}

// ---------------------------------------------------------------------------
// Per-question analysis
// ---------------------------------------------------------------------------

export interface QuestionAnalysisRequest {
  question_index: number;
  question_text: string;
  transcript: string;
  vision_metrics: VisionMetrics;
}

export interface QuestionAnalysisResult {
  answer_quality_score: number;
  communication_score: number;
  body_language_score: number;
  confidence_score: number;
  relevance_score: number;
  overall_score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
  answer_summary: string;
}

export interface QuestionAnalysisResponse {
  question_index: number;
  question_text: string;
  transcript: string;
  vision_metrics: VisionMetrics;
  result: QuestionAnalysisResult;
}

// ---------------------------------------------------------------------------
// Interview finalization
// ---------------------------------------------------------------------------

export interface InterviewFinalizeRequest {
  candidate_name: string;
  job_title: string;
  question_results: QuestionAnalysisResponse[];
}

export interface WeakQuestion {
  question_index: number;
  question_text: string;
  overall_score: number;
  primary_feedback: string;
  top_improvement: string;
}

export type Recommendation =
  | "Strong Recommend"
  | "Recommend"
  | "Neutral"
  | "Do Not Recommend";

export interface InterviewFinalizeResult {
  overall_score: number;
  overall_feedback: string;
  communication_summary: string;
  body_language_summary: string;
  top_strengths: string[];
  top_improvements: string[];
  recommendation: Recommendation;
  weak_question_indices: number[];
}

export interface InterviewFinalizeResponse {
  candidate_name: string;
  job_title: string;
  total_questions: number;
  question_results: QuestionAnalysisResponse[];
  weak_questions: WeakQuestion[];
  result: InterviewFinalizeResult;
}

// ---------------------------------------------------------------------------
// Session state (internal frontend state)
// ---------------------------------------------------------------------------

export interface InterviewQuestion {
  text: string;
  category: string;
  tip: string;
}

export type AnswerPhase =
  | "idle"        // question displayed, waiting for user
  | "listening"   // recording audio + vision
  | "processing"  // 2-sec idle + backend call in progress
  | "done";       // answer submitted, result stored

export interface QuestionState {
  phase: AnswerPhase;
  transcript: string;
  liveCaption: string;
  visionMetrics: VisionMetrics | null;
  result: QuestionAnalysisResponse | null;
}
