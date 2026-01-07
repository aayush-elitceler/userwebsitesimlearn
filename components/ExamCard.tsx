"use client";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Monitor, AlertCircle, X, Loader2 } from "lucide-react";
import { useScreenRecordingContext } from "@/lib/ScreenRecordingContext";

// Get CSS class for subject background
const getSubjectClass = (subject: string | undefined) => {
  if (!subject) return "quiz-subject-default";
  const normalized = subject.toLowerCase().replace(/\s+/g, "");
  switch (normalized) {
    case "maths":
    case "math":
      return "quiz-subject-maths";
    case "science":
      return "quiz-subject-science";
    case "english":
      return "quiz-subject-english";
    case "evs":
      return "quiz-subject-evs";
    default:
      return "quiz-subject-default";
  }
};

interface ExamCardProps {
  exam: {
    id: string;
    title: string;
    subject?: string;
    createdAt: string;
    previous?: boolean;
    date?: string;
    description?: string | null | undefined;
    difficulty?: string;
    instructions?: string;
    topic?: string;
    [key: string]: any; // For additional properties
  };
  previous?: boolean;
  date?: string;
  description?: string;
  onStartExam?: (examId: string) => void;
  onViewReport?: (examId: string) => void;
  height?: string;
  maxWidth?: string;
  showScoreAndDate?: boolean;
  difficulty?: string;
}

export default function ExamCard({
  exam,
  previous = false,
  date,
  description,
  onStartExam,
  onViewReport,
  height = "240px",
  maxWidth = "520px",
  showScoreAndDate = true,
  difficulty,
}: ExamCardProps) {
  const router = useRouter();
  const { setStream } = useScreenRecordingContext();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);


  const examDescription =
    description ||
    exam.description ||
    "Comprehensive exam covering all topics with detailed analysis and scoring.";

  const displayDescription = examDescription && examDescription !== "Comprehensive exam covering all topics with detailed analysis and scoring."
    ? examDescription
    : null;

  // Navigate to exam page (Request screen share first and persist it)
  const handleProceedToExam = useCallback(async () => {
    setIsRequestingPermission(true);
    setPermissionError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.warn("Screen storage not supported");
        router.push(`/exams/take/${exam.id}`);
        return;
      }

      // 1. Request Stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: false,
      });

      // Verify user shared the entire screen
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      if (settings.displaySurface && settings.displaySurface !== 'monitor') {
        stream.getTracks().forEach(track => track.stop());
        throw new Error("ENTIRE_SCREEN_REQUIRED");
      }

      // 2. Save stream to global context (DO NOT STOP TRACKS)
      setStream(stream);

      // 3. Navigate
      setShowPermissionModal(false);
      router.push(`/exams/take/${exam.id}`);

    } catch (error) {
      console.error("Permission denied", error);
      if (error instanceof Error && error.message === "ENTIRE_SCREEN_REQUIRED") {
        setPermissionError("You must share your ENTIRE SCREEN to proceed. Please try again.");
      } else {
        setPermissionError("Screen sharing is required to start the exam.");
      }
    } finally {
      setIsRequestingPermission(false);
    }
  }, [exam.id, router, setStream]);

  const handleStartExam = () => {
    if (onStartExam) {
      onStartExam(exam.id);
    } else {
      // Show permission modal instead of directly navigating
      setShowPermissionModal(true);

    }
  };

  const handleViewReport = () => {
    if (onViewReport) {
      onViewReport(exam.id);
    } else {
      router.push(`/exams/reports/${exam.id}`);
    }
  };



  // Screen Permission Modal Component
  const ScreenPermissionModal = () => {
    // Use portal to render outside the card's transform context
    if (typeof document === 'undefined') return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative animate-in fade-in zoom-in duration-200"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        >
          {/* Close button */}
          <button
            onClick={() => setShowPermissionModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
              <Monitor className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
            Screen Sharing Required
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            To ensure exam integrity, we need to record your screen during the exam.
            Please select your <strong>entire screen</strong> when prompted.
          </p>

          {/* Error message */}
          {permissionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{permissionError}</p>
            </div>
          )}


          {/* Instructions */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">What happens next:</h3>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">1.</span>
                <span>Click "Proceed to Exam" below</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">2.</span>
                <span>Select your entire screen in the browser prompt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">3.</span>
                <span>Exam will start in fullscreen mode</span>
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleProceedToExam}
              disabled={isRequestingPermission}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg 
                       hover:from-orange-600 hover:to-red-600 transition-all duration-200 
                       disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRequestingPermission ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Requesting Permission...
                </>
              ) : (
                <>
                  <Monitor className="w-5 h-5" />
                  Proceed to Exam
                </>
              )}
            </button>
            <button
              onClick={() => setShowPermissionModal(false)}
              className="w-full py-3 px-4 text-gray-600 font-medium rounded-lg border border-gray-300 
                       hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div
      className="flex flex-row bg-white border border-[#DEDEDE] items-center
                w-full hover:shadow-lg
                flex-shrink-0 p-5 hover:scale-[1.02] transition-all duration-300 transform"
      style={{
        maxWidth,
        minWidth: "380px",
        height,
        borderRadius: "15.51px",
        boxShadow: "0px 2.15px 16px 0px #0000002E",
      }}
    >
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden pr-4">
        <div className="flex-1 min-h-0 pb-3">
          <div className="text-[#626262] text-xs sm:text-sm font-medium mb-1.5">
            Difficulty:{" "}
            {difficulty || exam.difficulty || "Medium"}
          </div>
          <div className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-semibold text-gradient-primary mb-2 break-words leading-tight">
            {exam.title}
          </div>
          <div className="text-black text-xs sm:text-sm mb-3 leading-relaxed">
            <div className={"break-words line-clamp-2"}>
              {displayDescription || "Comprehensive exam covering all topics with detailed analysis and scoring."}
            </div>
          </div>
        </div>
        <div className="mt-auto pt-3">
          {previous ? (
            <button
              className="bg-gradient-primary text-primary-foreground rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
              onClick={handleViewReport}
            >
              View Report
            </button>
          ) : (
            <button
              className="bg-gradient-primary cursor-pointer text-primary-foreground rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
              onClick={handleStartExam}
            >
              Start Exam
            </button>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-3 sm:ml-4 lg:ml-5">
        <div
          className={`flex items-center justify-center text-white font-bold relative overflow-hidden rounded-[9px] shadow-[0px_0.89px_6.68px_0px_#00000075]
                     h-[10rem] w-[14rem]
            ${getSubjectClass(exam.subject)}`}
        >
          <span className="z-10 font-bold tracking-wide text-center px-1.5 break-words">
            {exam.subject || "Subject"}
          </span>
          {/* SVG Pattern from Figma */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <svg
              width="134"
              height="133"
              viewBox="0 0 134 133"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="61.3397"
                cy="72.3504"
                r="5.11912"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3395"
                cy="72.3512"
                r="10.6834"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3393"
                cy="72.351"
                r="16.2477"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3391"
                cy="72.3508"
                r="21.8119"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3389"
                cy="72.3506"
                r="27.3762"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3387"
                cy="72.3514"
                r="32.9404"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3385"
                cy="72.3512"
                r="38.5047"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3403"
                cy="72.351"
                r="44.069"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3401"
                cy="72.3508"
                r="49.6332"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3399"
                cy="72.3506"
                r="55.1975"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3397"
                cy="72.3514"
                r="60.7618"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3395"
                cy="72.3512"
                r="66.326"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3393"
                cy="72.351"
                r="71.8903"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <line
                x1="61.1936"
                y1="72.784"
                x2="0.000449386"
                y2="72.8107"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
            </svg>
          </div>
        </div>
      </div>
      {/* Screen Permission Modal */}
      {showPermissionModal && <ScreenPermissionModal />}
    </div>
  );
}