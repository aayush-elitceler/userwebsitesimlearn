"use client";

import { useEffect, useState, useCallback } from "react";

interface UseQuizViolationDetectionOptions {
  maxWarnings?: number;
  onAutoSubmit?: () => void;
  enabled?: boolean;
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
}: UseQuizViolationDetectionOptions = {}): UseQuizViolationDetectionReturn {
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showFinalViolationModal, setShowFinalViolationModal] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [lastViolationTime, setLastViolationTime] = useState<number>(0);
  const [violationArmed, setViolationArmed] = useState(true);

  const warningCount = violations.length;

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  const resetViolations = useCallback(() => {
    setViolations([]);
    setShowWarning(false);
    setShowFinalViolationModal(false);
    setAutoSubmitted(false);
  }, []);

  // Handle violation detection
  useEffect(() => {
    if (!enabled) return;

    function handleViolation(reason: string) {
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
  }, [
    enabled,
    violationArmed,
    lastViolationTime,
    maxWarnings,
    autoSubmitted,
    onAutoSubmit,
  ]);

  // Re-arm violation detection when window gains focus
  useEffect(() => {
    if (!enabled) return;

    function onFocusOrVisible() {
      setViolationArmed(true);
    }

    window.addEventListener("focus", onFocusOrVisible);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setViolationArmed(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled]);

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
