"use client";

import React from "react";

interface RecordingIndicatorProps {
    isRecording: boolean;
    duration: number;
}


export function RecordingIndicator({ isRecording, duration }: RecordingIndicatorProps) {
    if (!isRecording) return null;

    // Format duration as MM:SS
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const formattedDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return (
        <div
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-full shadow-lg"
            style={{
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
        >
            {/* Pulsing red dot */}
            <div className="relative">
                <div className="w-3 h-3 bg-white rounded-full" />
                <div
                    className="absolute inset-0 w-3 h-3 bg-white rounded-full"
                    style={{
                        animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
                    }}
                />
            </div>

            {/* Recording text and timer */}
            <span className="text-sm font-semibold">REC</span>
            <span className="text-sm font-mono">{formattedDuration}</span>

            {/* Inline keyframes for animation */}
            <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
        </div>
    );
}

/**
 * A modal that shows when screen recording permission is denied.
 * Blocks the user from proceeding with the exam/quiz.
 */
export function ScreenPermissionRequiredModal({
    onRetry,
    type = "exam",
}: {
    onRetry: () => void;
    type?: "exam" | "quiz";
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
            <div
                className="bg-white dark:bg-gray-800 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700"
                style={{
                    width: "700px",
                    maxWidth: "90vw",
                    borderRadius: "32px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    padding: "50px 60px",
                }}
            >
                {/* Warning icon */}
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-6">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-amber-600 dark:text-amber-400"
                    >
                        <path
                            d="M12 9V13M12 17H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                {/* Title */}
                <h2
                    className="text-gray-900 dark:text-white mb-4 text-center"
                    style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 700,
                        fontSize: "24px",
                        lineHeight: "32px",
                    }}
                >
                    Screen Recording Required
                </h2>

                {/* Description */}
                <p
                    className="text-gray-600 dark:text-gray-300 mb-6 text-center"
                    style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 400,
                        fontSize: "16px",
                        lineHeight: "24px",
                        maxWidth: "450px",
                    }}
                >
                    To maintain {type} integrity, you must allow screen recording.
                    Please click the button below and select your entire screen when prompted.
                </p>

                {/* Instructions */}
                <ul className="text-gray-500 dark:text-gray-400 mb-8 text-sm space-y-2">
                    <li className="flex items-center gap-2">
                        <span className="text-amber-600">1.</span>
                        Click "Enable Screen Recording" below
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-amber-600">2.</span>
                        Select "Entire Screen" in the browser dialog
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-amber-600">3.</span>
                        Click "Share" to start the {type}
                    </li>
                </ul>

                {/* Retry button */}
                <button
                    className="text-white font-semibold transition-all duration-200 flex items-center justify-center bg-gradient-primary hover:opacity-90"
                    style={{
                        width: "336px",
                        maxWidth: "100%",
                        height: "56px",
                        borderRadius: "12px",
                        padding: "16px",
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                        fontSize: "18px",
                        border: "none",
                        cursor: "pointer",
                    }}
                    onClick={onRetry}
                >
                    🎥 Enable Screen Recording
                </button>
            </div>
        </div>
    );
}
