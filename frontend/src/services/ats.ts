/**
 * ATS scoring service — thin wrapper around the apiClient for the
 * POST /api/v1/ats/score/{resumeId} endpoint.
 */

import { apiClient } from "@/lib/axios";
import type { ATSScoreRequest, ATSScoreResponse } from "@/types/ats";

export const ATSService = {
  /**
   * Score a stored resume against a job description.
   *
   * @param resumeId - UUID of the resume to evaluate.
   * @param jdText   - Full job description text (50–20,000 characters).
   * @returns        The structured ATS scoring result from the LLM.
   */
  async scoreResume(resumeId: string, jdText: string): Promise<ATSScoreResponse> {
    const payload: ATSScoreRequest = { jd_text: jdText };
    const response = await apiClient.post<ATSScoreResponse>(
      `/ats/score/${resumeId}`,
      payload
    );
    return response.data;
  },
};
