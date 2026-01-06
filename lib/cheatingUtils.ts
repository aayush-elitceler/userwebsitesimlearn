"use client";

import axios from "@/lib/axiosInstance";

export type CheatingType = "quiz" | "exam";

export interface MarkCheatedParams {
  type: CheatingType;
  quizId?: string;
  examId?: string;
  is_studentCheated: boolean;
}

export async function markStudentAsCheated(
  params: MarkCheatedParams
): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {
      type: params.type,
      is_studentCheated: params.is_studentCheated,
    };

    // Add the appropriate ID based on type
    if (params.type === "quiz" && params.quizId) {
      body.quizId = params.quizId;
    } else if (params.type === "exam" && params.examId) {
      body.examId = params.examId;
    } else {
      console.error(
        "markStudentAsCheated: Missing required ID for type",
        params.type
      );
      return false;
    }

    const response = await axios.post("/users/mark-cheated", body);

    if (response.data?.success) {
      console.log("Cheating report submitted successfully");
      return true;
    }

    console.error("Cheating report failed:", response.data);
    return false;
  } catch (error) {
    console.error("Error reporting cheating:", error);
    return false;
  }
}

/**
 * Checks if a quiz/exam should trigger cheating reports.
 * User-generated quizzes/exams (createdBy: "USER") should NOT trigger cheating reports.
 * All other types (TEACHER, INSTITUTION_ADMIN, etc.) SHOULD trigger cheating reports.
 *
 * @param createdBy - The creator type (e.g., "TEACHER", "USER", "INSTITUTION_ADMIN")
 * @param teacherId - Optional teacher ID for exams (if set, it's not user-created)
 * @returns boolean - True if cheating should be reported (NOT user-created)
 */
export function shouldReportCheating(
  createdBy?: string,
  teacherId?: string | null
): boolean {
  // If teacherId is set, it's definitely not user-created
  if (teacherId) {
    return true;
  }

  // Skip cheating report ONLY for USER-created content
  if (createdBy && createdBy.toUpperCase() === "USER") {
    return false;
  }

  // For all other cases (TEACHER, INSTITUTION_ADMIN, etc.), report cheating
  // Also report if createdBy is not set (assume it's institution-created)
  return true;
}

// Keep the old function name for backwards compatibility
export const isTeacherCreated = shouldReportCheating;
