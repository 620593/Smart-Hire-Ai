/**
 * TypeScript types for the ATS (Applicant Tracking System) scoring feature.
 * Mirrors the backend Pydantic schemas in app/schemas/ats.py exactly.
 */

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface ATSScoreRequest {
  /** Full job description text (50–20,000 characters). */
  jd_text: string;
}

// ---------------------------------------------------------------------------
// Result — mirrors ATSScoreResult Pydantic model
// ---------------------------------------------------------------------------

export interface ATSScoreResult {
  /** Holistic ATS compatibility score (0-100). */
  overall_score: number;
  /** How well candidate skills match the JD (0-100). */
  skill_score: number;
  /** How well experience level / years match the JD (0-100). */
  experience_score: number;
  /** Alignment between candidate education and JD requirements (0-100). */
  education_score: number;
  /** Skills mentioned in the JD that are absent from the resume. */
  missing_skills: string[];
  /** Key areas where the resume strongly matches the JD. */
  strengths: string[];
  /** Key gaps or weaknesses relative to the JD. */
  weaknesses: string[];
  /** Actionable recommendations to improve ATS compatibility. */
  suggestions: string[];
  /** Specific skills or keywords to add to the resume. */
  "improvements to add": string[];
}

// ---------------------------------------------------------------------------
// Section breakdown — transparency data from the parser
// ---------------------------------------------------------------------------

export interface ATSSectionBreakdown {
  contact: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
  certifications: string;
}

// ---------------------------------------------------------------------------
// Full response envelope — mirrors ATSScoreResponse Pydantic model
// ---------------------------------------------------------------------------

export interface ATSScoreResponse {
  /** UUID of the resume that was scored. */
  resume_id: string;
  /** Original filename of the scored resume. */
  resume_filename: string;
  /** Number of pages in the scored resume. */
  resume_pages: number;
  /** Character count of the extracted resume text. */
  resume_length: number;
  /** Character count of the supplied job description. */
  jd_length: number;
  /** The ATS evaluation result from the LLM. */
  result: ATSScoreResult;
  /** Detected resume sections for transparency. */
  sections: ATSSectionBreakdown;
}
