"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import axios, { redirectToLogin } from '@/lib/axiosInstance';
import { useQuizViolationDetection } from '@/hooks/useQuizViolationDetection';
import { useScreenRecording } from '@/hooks/useScreenRecording';
import { uploadRecordingVideo } from '@/lib/cheatingUtils';
import { RecordingIndicator, ScreenPermissionRequiredModal } from '@/components/RecordingIndicator';

interface Option {
  id: string;
  optionText: string;
  isCorrect?: boolean;
  questionId?: string;
}

interface Question {
  id: string;
  questionText: string;
  quizId: string;
  options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  instructions: string;
  timeLimitMinutes: number;
  topic: string;
  difficulty: string;
  createdAt: string;
  userId: string;
  completed: boolean;
  createdBy?: string;
  questions: Question[];
}

export default function QuizStartPage() {
  const params = useParams();
  const quizId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{ [questionId: string]: string }>({});
  const [quizStartedAt, setQuizStartedAt] = useState(new Date().toISOString());
  const [submitting, setSubmitting] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [quizReady, setQuizReady] = useState(false);
  const router = useRouter();

  // Screen recording hook with chunked uploads every 3 minutes (180 seconds)
  const {
    isRecording,
    isSupported,
    recordingDuration,
    chunksUploaded,
    startRecording,
    stopRecording,
  } = useScreenRecording({
    enabled: true,
    onPermissionDenied: () => setShowPermissionModal(true),
    chunkIntervalMs: 300000, // Upload every 5 minutes (300 seconds)
    quizId: quiz?.id,
  });

  // Submit quiz function
  const handleSubmitQuiz = useCallback(async (isAutoSubmit = false) => {
    if (!quiz || submitting) return;

    setSubmitting(true);

    // Stop screen recording (remaining chunks uploaded automatically)
    if (isRecording) {
      try {
        await stopRecording();
      } catch (err) {
        console.error("Error stopping recording:", err);
      }
    }

    try {
      const started = new Date(quizStartedAt);
      const completed = new Date();
      const timeTaken = Math.max(1, Math.round((completed.getTime() - started.getTime()) / 60000));
      const answers = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: selected[q.id] || "",
      }));

      const body = {
        quizId: quiz.id,
        answers,
        timeTaken,
      };

      const response = await axios.post('/users/quiz/submit', body);

      if (response.data.success) {
        const data = response.data;
        const submissionId = data.data?.submission?.id;
        if (submissionId && !isAutoSubmit) {
          router.push(`/quizes/reports/${submissionId}`);
        }
      } else if (!isAutoSubmit) {
        alert("Failed to submit quiz.");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        redirectToLogin();
      } else {
        console.error('Error submitting quiz:', error);
        if (!isAutoSubmit) {
          alert("Failed to submit quiz.");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [quiz, selected, quizStartedAt, router, submitting, isRecording, stopRecording]);

  // Violation detection hook - only enabled after screen recording is ready
  const {
    warningCount,
    showWarning,
    showFinalViolationModal,
    dismissWarning,
  } = useQuizViolationDetection({
    maxWarnings: 3,
    onAutoSubmit: () => handleSubmitQuiz(true),
    enabled: !loading && !!quiz && !submitting && quizReady,
    // Enable cheating report for teacher-created quizzes
    enableCheatingReport: true,
    cheatingReportType: "quiz",
    quizId: quiz?.id,
    createdBy: quiz?.createdBy,
  });

  // Make screen fullscreen - hide body scrollbar
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.height = '';
    };
  }, []);

  useEffect(() => {
    async function fetchQuiz() {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`/users/quiz-by-id?id=${quizId}`);
        const data = response.data;
        if (data.success) {
          setQuiz(data.data.quiz || data.data);
          setQuizStartedAt(new Date().toISOString());
        } else {
          setError(data.message || "Failed to fetch quiz.");
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          redirectToLogin();
        } else {
          console.error('Error fetching quiz:', error);
          setError("An error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
    if (quizId) fetchQuiz();
  }, [quizId]);

  // Start screen recording when quiz is loaded
  const initiateScreenRecording = useCallback(async () => {
    if (!isSupported) {
      console.warn("Screen recording not supported in this browser");
      setQuizReady(true);
      return;
    }

    const success = await startRecording();
    if (success) {
      setQuizReady(true);
      setShowPermissionModal(false);
    } else {
      setShowPermissionModal(true);
    }
  }, [isSupported, startRecording]);

  // Trigger recording start when quiz is loaded
  useEffect(() => {
    if (quiz && !loading && !quizReady && !isRecording) {
      initiateScreenRecording();
    }
  }, [quiz, loading, quizReady, isRecording, initiateScreenRecording]);

  // Timer logic
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (quiz?.timeLimitMinutes) {
      setSecondsLeft(quiz.timeLimitMinutes * 60);
      const interval = setInterval(() => {
        setSecondsLeft((s) => (s && s > 0 ? s - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quiz?.timeLimitMinutes]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (secondsLeft === 0 && quiz && !submitting) {
      handleSubmitQuiz(true);
    }
  }, [secondsLeft, quiz, submitting, handleSubmitQuiz]);

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `00:${m}:${s}`;
  }

  const total = quiz?.questions?.length || 0;
  const answered = Object.keys(selected).length;
  const progress = total ? Math.min(answered / total, 1) : 0;

  return (
    <div className="fixed inset-0 min-h-screen w-full bg-white z-50 overflow-y-auto">
      {/* Screen Recording Indicator */}
      <RecordingIndicator isRecording={isRecording} duration={recordingDuration} />

      {/* Screen Permission Required Modal */}
      {showPermissionModal && (
        <ScreenPermissionRequiredModal
          onRetry={initiateScreenRecording}
          type="quiz"
        />
      )}

      {/* Warning Modal */}
      {showWarning && warningCount > 0 && warningCount < 3 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div
            className="bg-white flex flex-col items-center justify-center border border-gray-200"
            style={{
              width: '700px',
              maxWidth: '90vw',
              borderRadius: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '40px 60px',
            }}
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-red-500"
              >
                <path
                  d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              className="text-gray-900 mb-3"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '32px',
                textAlign: 'center',
                maxWidth: '350px',
              }}
            >
              🚨 You&apos;ve Left the Quiz Screen
            </h2>
            <p
              className="text-gray-600 mb-3"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: '24px',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              To maintain quiz integrity, please stay on this page.
            </p>
            <p
              className="text-red-600 mb-1"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '17px',
                lineHeight: '26px',
                textAlign: 'center',
                maxWidth: '300px',
              }}
            >
              This is Warning {warningCount} of 3.
            </p>
            <p
              className="text-gray-500 mb-6"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: '24px',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              If you switch again, the quiz may be auto-submitted.
            </p>
            <button
              className="text-white font-semibold transition-all duration-200 flex items-center justify-center bg-gradient-primary hover:opacity-90"
              style={{
                width: '336px',
                maxWidth: '100%',
                height: '48px',
                borderRadius: '10px',
                padding: '12px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={dismissWarning}
            >
              Back to quiz
            </button>
          </div>
        </div>
      )}

      {/* Final Violation Modal */}
      {showFinalViolationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div
            className="bg-white flex flex-col items-center justify-center border border-gray-200"
            style={{
              width: '700px',
              maxWidth: '90vw',
              borderRadius: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '50px 60px',
            }}
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-red-500"
              >
                <path
                  d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              className="text-gray-900 mb-4"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '32px',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              🚨 You&apos;ve exceeded the allowed number of screen violations.
            </h2>
            <p
              className="text-gray-600 mb-8"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: '24px',
                textAlign: 'center',
                maxWidth: '450px',
              }}
            >
              Your quiz has been submitted automatically due to repeated tab switches or screen exits.
            </p>
            <button
              className="text-white font-semibold transition-all duration-200 flex items-center justify-center bg-gradient-primary hover:opacity-90"
              style={{
                width: '336px',
                maxWidth: '100%',
                height: '48px',
                borderRadius: '10px',
                padding: '12px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => router.push('/')}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 md:px-12 py-8">
        {loading ? (
          <div className="text-black text-center py-20 text-lg">Loading quiz...</div>
        ) : error ? (
          <div className="text-red-400 text-center py-20 font-semibold">{error}</div>
        ) : quiz ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-amber-600 font-semibold text-sm mb-1">Difficulty: {quiz.difficulty?.charAt(0).toUpperCase() + quiz.difficulty?.slice(1)}</div>
                <div className="text-2xl md:text-3xl font-bold text-black mb-1">{quiz.title}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" /></svg>
                  Time left {secondsLeft !== null ? formatTime(secondsLeft) : `00:${quiz.timeLimitMinutes?.toString().padStart(2, "0")}:00`}
                </div>
              </div>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-amber-600 transition-all" style={{ width: `${progress * 100}%` }}></div>
            </div>
            <div className="text-right text-black text-sm mb-4">{answered}/{total}</div>
            {quiz.questions?.map((q, idx) => (
              <div key={q.id} className="mb-8 bg-white rounded-2xl p-6 border border-[#DEDEDE]">
                <div className="font-semibold text-black mb-4 text-lg">
                  {idx + 1}. {q.questionText}
                </div>
                <div className="flex flex-col gap-3">
                  {q.options.map((opt, i) => (
                    <label key={opt.id} className={`block rounded-lg px-4 py-3 cursor-pointer transition-all border ${selected[q.id] === opt.id ? "bg-primary/80 text-primary-foreground border-amber-400" : "bg-white text-black hover:bg-amber-50 border-[#E8E8E8]"}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={selected[q.id] === opt.id}
                        onChange={() => setSelected((s) => ({ ...s, [q.id]: opt.id }))}
                        className="mr-3 accent-amber-600"
                      />
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + i)})</span> {opt.optionText}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="bg-gradient-primary text-primary-foreground p-4 rounded-lg disabled:opacity-50"
              onClick={() => handleSubmitQuiz(false)}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}