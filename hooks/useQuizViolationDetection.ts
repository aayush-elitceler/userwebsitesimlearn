"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  markStudentAsCheated,
  isTeacherCreated,
  CheatingType,
} from "@/lib/cheatingUtils";

interface UseQuizViolationDetectionOptions {
  maxWarnings?: number;
  onAutoSubmit?: () => void;
  enabled?: boolean;
  // Cheating report options
  enableCheatingReport?: boolean;
  cheatingReportType?: CheatingType;
  quizId?: string;
  examId?: string;
  createdBy?: string;
  teacherId?: string | null;
}

interface ViolationRecord {
  timestamp: string;
  violation: string;
}

interface UseQuizViolationDetectionReturn {
  warningCount: number;
  showWarning: boolean;
  showFinalViolationModal: boolean;
  violations: ViolationRecord[];
  autoSubmitted: boolean;
  dismissWarning: () => void;
  resetViolations: () => void;
}

export function useQuizViolationDetection({
  maxWarnings = 3,
  onAutoSubmit,
  enabled = true,
  enableCheatingReport = false,
  cheatingReportType = "quiz",
  quizId,
  examId,
  createdBy,
  teacherId,
}: UseQuizViolationDetectionOptions = {}): UseQuizViolationDetectionReturn {
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showFinalViolationModal, setShowFinalViolationModal] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [lastViolationTime, setLastViolationTime] = useState<number>(0);
  const [violationArmed, setViolationArmed] = useState(true);

  // Track if cheating report has been sent to avoid duplicate reports
  const cheatingReportedRef = useRef(false);
  // Use ref to track enabled state for event handlers (avoids stale closure issues)
  const enabledRef = useRef(enabled);

  const warningCount = violations.length;

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  const resetViolations = useCallback(() => {
    setViolations([]);
    setShowWarning(false);
    setShowFinalViolationModal(false);
    setAutoSubmitted(false);
    cheatingReportedRef.current = false;
  }, []);

  // Report cheating to the API (skip only for USER-created quizzes/exams)
  const reportCheating = useCallback(async () => {
    // Only report if enabled and not already reported
    if (!enableCheatingReport || cheatingReportedRef.current) {
      return;
    }

    // Skip cheating report only for USER-created quizzes/exams
    if (!isTeacherCreated(createdBy, teacherId)) {
      console.log("Skipping cheating report - user-created quiz/exam");
      return;
    }

    // Mark as reported to prevent duplicate reports
    cheatingReportedRef.current = true;

    // Call the API
    await markStudentAsCheated({
      type: cheatingReportType,
      quizId: cheatingReportType === "quiz" ? quizId : undefined,
      examId: cheatingReportType === "exam" ? examId : undefined,
      is_studentCheated: true,
    });
  }, [
    enableCheatingReport,
    cheatingReportType,
    quizId,
    examId,
    createdBy,
    teacherId,
  ]);

  // Keep enabledRef in sync with enabled prop
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Handle violation detection
  useEffect(() => {
    function handleViolation(reason: string) {
      // Check ref for current enabled value (avoids stale closure)
      if (!enabledRef.current) return;
      if (!violationArmed) return;
      setViolationArmed(false);

      const now = Date.now();
      if (now - lastViolationTime < 1000) return; // Ignore if last violation was <1s ago
      setLastViolationTime(now);

      setViolations((prev) => {
        const newViolations = [
          ...prev,
          { timestamp: new Date().toISOString(), violation: reason },
        ];

        // Check if we've exceeded max warnings
        if (newViolations.length >= maxWarnings) {
          setShowFinalViolationModal(true);
          if (!autoSubmitted && onAutoSubmit) {
            setAutoSubmitted(true);
            onAutoSubmit();
          }
          // Report cheating to the API (async, fire-and-forget)
          reportCheating();
        } else {
          setShowWarning(true);
        }

        return newViolations;
      });
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        handleViolation("User switched to another application or tab.");
      }
    }

    function onBlur() {
      handleViolation("User left the quiz window.");
    }

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // Using enabledRef instead of enabled, so we can keep event listeners stable
  }, [
    violationArmed,
    lastViolationTime,
    maxWarnings,
    autoSubmitted,
    onAutoSubmit,
    reportCheating,
  ]);

  // Re-arm violation detection when window gains focus
  useEffect(() => {
    function onFocusOrVisible() {
      if (!enabledRef.current) return;
      setViolationArmed(true);
    }

    window.addEventListener("focus", onFocusOrVisible);

    const handleVisibility = () => {
      if (!enabledRef.current) return;
      if (document.visibilityState === "visible") {
        setViolationArmed(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return {
    warningCount,
    showWarning,
    showFinalViolationModal,
    violations,
    autoSubmitted,
    dismissWarning,
    resetViolations,
  };
}
