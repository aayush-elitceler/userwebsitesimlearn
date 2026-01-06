"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios, { redirectToLogin } from '@/lib/axiosInstance';
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { markStudentAsCheated, isTeacherCreated } from "@/lib/cheatingUtils";

interface Option {
  id: string;
  optionText: string;
  isCorrect: boolean;
  questionId: string;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  marks?: number;
  examId: string;
  options: Option[];
  bloomTaxonomy?: string | null;
  correctAnswer?: string | null;
}

interface Exam {
  id: string;
  title: string;
  description?: string | null;
  instructions: string;
  timeLimitMinutes: number;
  topic: string;
  difficulty: string;
  createdAt: string;
  teacherId?: string | null;
  userId: string;
  type: string;
  isActive: boolean;
  createdBy: string;
  questions: Question[];
}

export default function TakeExamPage() {
  const { examId } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState<{ timestamp: string; violation: string }[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showFinalViolationModal, setShowFinalViolationModal] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [lastViolationTime, setLastViolationTime] = useState<number>(0);
  const [violationArmed, setViolationArmed] = useState(true);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const cheatingReportedRef = useRef(false);
  console.log(warningCount, 'warningCount');


  useEffect(() => {
    async function fetchExam() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        if (!token) {
          redirectToLogin();
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/exams/get-by-id?examId=${examId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success && response.data.data && response.data.data.exam) {
          setExam(response.data.data.exam);
          setAnswers(Array(response.data.data.exam.questions.length).fill(""));
          setStartedAt(new Date().toISOString());
          setRemainingTime(response.data.data.exam.timeLimitMinutes * 60);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          redirectToLogin();
          return;
        }

        console.error('Error fetching exam:', error);
      } finally {
        setLoading(false);
      }
    }
    if (examId) fetchExam();
  }, [examId]);

  // Timer countdown effect
  useEffect(() => {
    if (remainingTime === null || loading || submitting || showFinalViolationModal) return;
    if (remainingTime <= 0) {
      if (!autoSubmitted) {
        setAutoSubmitted(true);
        handleSubmit(true, true); // auto-submit
        setShowFinalViolationModal(true);
      }
      return;
    }
    const interval = setInterval(() => {
      setRemainingTime((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [remainingTime, loading, submitting, showFinalViolationModal]);

  // Format timer as MM:SS
  function formatTime(secs: number | null) {
    if (secs === null) return "--:--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  useEffect(() => {
    function handleViolation(reason: string) {
      if (!violationArmed) return;
      setViolationArmed(false);
      const now = Date.now();
      if (now - lastViolationTime < 1000) return; // Ignore if last violation was <1s ago
      setLastViolationTime(now);
      setViolations((prev) => [
        ...prev,
        { timestamp: new Date().toISOString(), violation: reason },
      ]);
      setWarningCount((prev) => {
        setShowWarning(true);
        return prev + 1;
      });
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        handleViolation("User switched to another application or tab.");
      }
    }
    function onBlur() {
      handleViolation("User left the exam window.");
    }

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    function onFocusOrVisible() {
      setViolationArmed(true);
    }
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") setViolationArmed(true);
    });
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") setViolationArmed(true);
      });
    };
  }, []);

  useEffect(() => {
    if (warningCount > 5 && !autoSubmitted) {
      // Auto-submit exam, but do not route yet
      handleSubmit(true, true); // pass a flag to indicate auto-submit
      setAutoSubmitted(true);
      setShowFinalViolationModal(true);

      // Report cheating for teacher-created exams
      if (!cheatingReportedRef.current && exam && isTeacherCreated(exam.createdBy, exam.teacherId)) {
        cheatingReportedRef.current = true;
        markStudentAsCheated({
          type: "exam",
          examId: exam.id,
          is_studentCheated: true,
        });
      }
    }
    // eslint-disable-next-line
  }, [warningCount]);

  const scrollToQuestion = (questionIndex: number) => {
    const questionElement = document.getElementById(`question-${questionIndex}`);
    if (questionElement) {
      questionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const handleAnswerChange = (idx: number, value: string) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const handleSubmit = async (autoSubmit = false, isFinalViolation = false) => {
    setSubmitting(true);
    const completedAt = new Date().toISOString();
    // Process answers to send optionText for MCQ questions instead of option IDs
    const processedAnswers = exam?.questions.map((q, i) => {
      const userAnswer = answers[i];

      if (q.questionType === "MCQ" && userAnswer) {
        // For MCQ questions, find the selected option and send its text
        const selectedOption = q.options.find(opt => opt.id === userAnswer);
        return {
          question: q.id,
          answer: selectedOption ? selectedOption.optionText : userAnswer,
        };
      } else {
        // For text questions (SHORT/LONG), send the answer as is
        return {
          question: q.id,
          answer: userAnswer,
        };
      }
    });

    const body = {
      examId,
      startedAt,
      completedAt,
      violations,
      answers: processedAnswers,
    };
    try {
      const token = getTokenFromCookie();
      if (!token) {
        redirectToLogin();
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/users/exams/submit`,
        body,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!isFinalViolation) {
        router.push(`/exams/reports/${examId}`);
      }
      // else: wait for user to click Back to dashboard
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        redirectToLogin();
        return;
      }

      console.error('Error submitting exam:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Make the exam screen fullscreen and prevent scrolling
  useEffect(() => {
    // Add styles to make body unscrollable and fullscreen
    document.body.style.overflow = "hidden";
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.height = "";
      document.body.style.height = "";
    };
  }, []);

  if (loading || !exam) {
    return <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground w-screen h-screen">Loading exam...</div>;
  }

  return (
    <div className="fixed inset-0 min-h-screen min-w-screen bg-background py-8 px-2 md:px-0 flex flex-col items-center z-10">
      {/* Submission overlay */}
      <MultiStepLoader
        loading={submitting}
        loadingStates={[
          { text: "Packaging your answers" },
          { text: "Securing submission" },
          { text: "Evaluating responses" },
          { text: "Generating your report" },
          { text: "Redirecting to results" },
        ]}
        duration={Math.floor(45000 / 5)}
        loop={false}
      />
      {/* Warning Modal */}
      {showWarning && warningCount > 0 && warningCount < 5 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="bg-card flex flex-col items-center justify-center border border-border"
            style={{
              width: '700px',
              height: '320px',
              borderRadius: '32px',
              boxShadow: 'var(--shadow-lg)',
              padding: '40px 60px',
            }}
          >
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-destructive"
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
              className="text-card-foreground mb-3"
              style={{
                fontFamily: 'Poppins',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '32px',
                letterSpacing: '0%',
                textAlign: 'center',
                maxWidth: '350px',
              }}
            >
              🚨 You've Left the Exam Screen
            </h2>
            <p
              className="text-muted-foreground mb-3"
              style={{
                fontFamily: 'Poppins',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: '24px',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              To maintain exam integrity, please stay on this page.
            </p>
            <p
              className="text-destructive mb-1"
              style={{
                fontFamily: 'Poppins',
                fontWeight: 700,
                fontSize: '17px',
                lineHeight: '26px',
                textAlign: 'center',
                maxWidth: '300px',
              }}
            >
              This is Warning {Math.ceil(warningCount / 2)} of 3.
            </p>
            <p
              className="text-muted-foreground mb-6"
              style={{
                fontFamily: 'Poppins',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: '24px',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              If you switch again, the exam may be auto-submitted.
            </p>
            <button
              className="text-primary-foreground font-semibold transition-all duration-200 flex items-center justify-center bg-primary hover:bg-primary/90"
              style={{
                width: '336px',
                height: '48px',
                borderRadius: '10px',
                padding: '12px',
                fontFamily: 'Poppins',
                fontWeight: 600,
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => setShowWarning(false)}
            >
              Back to exam
            </button>
          </div>
        </div>
      )}
      {showFinalViolationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="bg-card flex flex-col items-center justify-center border border-border"
            style={{
              width: '700px',
              height: '320px',
              borderRadius: '32px',
              boxShadow: 'var(--shadow-lg)',
              padding: '50px 60px',
            }}
          >
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-destructive"
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
              className="text-card-foreground mb-4"
              style={{
                fontFamily: 'Poppins',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '32px',
                letterSpacing: '0%',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              🚨 You've exceeded the allowed number of screen violations.
            </h2>
            <p
              className="text-muted-foreground mb-8"
              style={{
                fontFamily: 'Poppins',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: '24px',
                textAlign: 'center',
                maxWidth: '450px',
              }}
            >
              Your exam has been submitted automatically due to repeated tab switches or screen exits.
            </p>
            <button
              className="text-primary-foreground font-semibold transition-all duration-200 flex items-center justify-center bg-primary hover:bg-primary/90"
              style={{
                width: '336px',
                height: '48px',
                borderRadius: '10px',
                padding: '12px',
                fontFamily: 'Poppins',
                fontWeight: 600,
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => router.push("/exams")}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}
      {/* Timer Bar and Progress */}
      <div className="w-full max-w-3xl mb-4 sticky top-0 z-20 bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="flex justify-between items-center mb-3">
          <div className="text-card-foreground font-semibold text-lg">Time Left: {formatTime(remainingTime)}</div>
          <div className="text-muted-foreground text-sm">(Exam will auto-submit when time runs out)</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-muted-foreground">Progress</span>
            <span className="text-sm font-medium text-muted-foreground">
              {answers.filter(answer => answer !== undefined && answer !== "").length} of {exam.questions.length} answered
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-500 ease-out relative"
              style={{
                width: `${(answers.filter(answer => answer !== undefined && answer !== "").length / exam.questions.length) * 100}%`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>

      </div>

      <div
        className="w-full max-w-3xl overflow-y-auto max-h-[calc(100vh-32px)]"
        style={{
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--primary) var(--muted)',
        }}
      >
        <div className="mb-4">
          <div className="text-muted-foreground font-semibold">Difficulty: {exam.difficulty?.charAt(0).toUpperCase() + exam.difficulty?.slice(1)}</div>
          <div className="text-2xl font-bold text-foreground mb-2">{exam.title}</div>
          {exam.description && (
            <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-border/30">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Note: </span>
                <span className="text-card-foreground">{exam.description}</span>
              </div>
            </div>
          )}
        </div>

        {exam.questions.map((q, idx) => (
          <div
            key={q.id}
            id={`question-${idx}`}
            className="mb-8 bg-card rounded-2xl p-6 transition-all duration-300 ease-in-out hover:shadow-lg border border-border"
            style={{
              scrollMarginTop: '80px',
            }}
          >
            <div className="font-semibold text-card-foreground mb-4 text-lg">
              Q{idx + 1}. {q.questionText} {q.marks ? `(${q.marks} marks)` : ""}
            </div>

            {/* Bloom Taxonomy */}
            {q.bloomTaxonomy && (
              <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Bloom Taxonomy: </span>
                  <span className="text-sm font-semibold text-primary">{q.bloomTaxonomy}</span>
                </div>
              </div>
            )}

            {q.questionType === "MCQ" ? (
              // Multiple Choice Questions
              <div className="space-y-3">
                {q.options?.map((option, optionIndex) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${answers[idx] === option.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted/50"
                      }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option.id}
                      checked={answers[idx] === option.id}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      className="mr-3 w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="flex-1 text-card-foreground">
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + optionIndex)}.
                      </span>
                      {option.optionText}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              // Short and Long Answer Questions
              <textarea
                className="w-full p-4 rounded bg-primary/10 text-card-foreground min-h-[60px] transition-all duration-200 focus:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                placeholder={
                  q.questionType === "LONG"
                    ? "Type your detailed answer here..."
                    : "Type your answer here..."
                }
                value={answers[idx]}
                onChange={(e) => handleAnswerChange(idx, e.target.value)}
                rows={q.questionType === "LONG" ? 6 : 3}
              />
            )}
          </div>
        ))}
        <button
          className="bg-gradient-primary text-primary-foreground hover:opacity-90 p-4 rounded-lg w-full max-w-xs mx-auto block disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "End exam"}
        </button>
      </div>
    </div>
  );
}
// Utility to get token from 'auth' cookie
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )auth=([^;]*)/);
  if (!match) return null;
  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);
    return parsed.token;
  } catch {
    return null;
  }
} 
