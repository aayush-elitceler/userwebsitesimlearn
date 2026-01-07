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

// ============================================================
// Screen Recording Video Upload
// ============================================================

export interface UploadRecordingParams {
  video: Blob;
  videoType: "SCREEN";
  duration: number; // in seconds
  examId?: string;
  quizId?: string;
}

/**
 * Uploads a screen recording video to the server.
 *
 * @param params - The upload parameters including video blob and metadata
 * @returns Promise<boolean> - Returns true if upload was successful
 */
export async function uploadRecordingVideo(
  params: UploadRecordingParams
): Promise<boolean> {
  try {
    // Validate we have either examId or quizId
    if (!params.examId && !params.quizId) {
      console.error("uploadRecordingVideo: Missing examId or quizId");
      return false;
    }

    // Create FormData for multipart upload
    const formData = new FormData();

    // Add video file with proper filename
    const filename = params.examId
      ? `exam_${params.examId}_recording.webm`
      : `quiz_${params.quizId}_recording.webm`;
    formData.append("video", params.video, filename);

    // Add metadata
    formData.append("videoType", params.videoType);
    formData.append("duration", params.duration.toString());

    if (params.examId) {
      formData.append("examId", params.examId);
    }
    if (params.quizId) {
      formData.append("quizId", params.quizId);
    }

    console.log(
      `Uploading recording video (${(params.video.size / 1024 / 1024).toFixed(
        2
      )} MB)...`
    );

    const response = await axios.post("/users/videos/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // Increase timeout for large files
      timeout: 300000, // 5 minutes
    });

    if (response.data?.success) {
      console.log("Recording video uploaded successfully");
      return true;
    }

    console.error("Recording video upload failed:", response.data);
    return false;
  } catch (error) {
    console.error("Error uploading recording video:", error);
    return false;
  }
}
