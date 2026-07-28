/**
 * React Query mutation hook for ATS resume scoring.
 * Wraps ATSService.scoreResume in a useMutation for easy integration.
 */

import { useMutation } from "@tanstack/react-query";
import { ATSService } from "@/services/ats";
import type { ATSScoreResponse } from "@/types/ats";

interface ATSScoreArgs {
  resumeId: string;
  jdText: string;
}

/**
 * Hook that fires a POST /ats/score/{resumeId} request.
 *
 * Usage:
 * ```tsx
 * const { mutate, isPending, data, error } = useATSScore();
 * mutate({ resumeId, jdText });
 * ```
 */
export function useATSScore() {
  return useMutation<ATSScoreResponse, Error, ATSScoreArgs>({
    mutationFn: ({ resumeId, jdText }) =>
      ATSService.scoreResume(resumeId, jdText),
  });
}
