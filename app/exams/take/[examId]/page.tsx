"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  marks?: number;
  examId: string;
  options: any[];
}

interface Exam {
  id: string;
  title: string;
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
  console.log(warningCount , 'warningCount');
  

  useEffect(() => {
    async function fetchExam() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/exams/get-by-id?examId=${examId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (data.success && data.data && data.data.exam) {
          setExam(data.data.exam);
          setAnswers(Array(data.data.exam.questions.length).fill(""));
          setStartedAt(new Date().toISOString());
          setRemainingTime(data.data.exam.timeLimitMinutes * 60);
        }
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
    }
    // eslint-disable-next-line
  }, [warningCount]);

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
    const body = {
      examId,
      startedAt,
      completedAt,
      violations,
      answers: exam?.questions.map((q, i) => ({
        question: q.questionText,
        answer: answers[i],
      })),
    };
    try {
      const token = getTokenFromCookie();
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/exams/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!isFinalViolation) {
        router.push(`/exams/reports/${examId}`);
      }
      // else: wait for user to click Back to dashboard
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
    return <div className="fixed inset-0 flex items-center justify-center bg-[#181c24] text-white w-screen h-screen">Loading exam...</div>;
  }

  return (
    <div className="fixed inset-0 min-h-screen min-w-screen bg-gray-100 py-8 px-2 md:px-0 flex flex-col items-center z-10">
      {/* Warning Modal */}
      {showWarning && warningCount > 0 && warningCount < 5 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full flex flex-col items-center shadow-[0px_4px_16px_0px_#F9771754] border-4 border-orange-500">
            <div className="text-xl font-bold text-black mb-4 flex items-center gap-3 text-center">
              
              <span className="font-['Poppins'] font-bold text-lg"> 🚨 You've Left the Exam Screen</span>
            </div>
            <div className="text-black mb-4 text-center font-['Poppins']">
              To maintain exam integrity, please stay on this page.
            </div>
            <div className="text-lg font-bold text-red-500 mb-2 font-['Poppins']">
              This is Warning {Math.ceil(warningCount/2)} of 3.
            </div>
            <div className="text-black mb-6 text-center font-['Poppins']">
              If you switch again, the exam may be auto-submitted.
            </div>
            <button
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-bold text-lg font-['Poppins'] hover:opacity-90 transition-opacity"
              onClick={() => setShowWarning(false)}
            >
              Back to exam
            </button>
          </div>
        </div>
      )}
      {showFinalViolationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full flex flex-col items-center shadow-[0px_4px_16px_0px_#F9771754] border-4 border-orange-500">
            <div className="text-xl font-bold text-black mb-4 flex items-center gap-3 text-center">
            
              <span className="font-['Poppins'] font-bold text-lg"> 🚨 You've exceeded the allowed number of screen violations.</span>
            </div>
            <div className="text-black mb-6 text-center font-['Poppins']">
              Your exam has been submitted automatically<br />
              due to repeated tab switches or screen exits.
            </div>
            <button
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-bold text-lg font-['Poppins'] hover:opacity-90 transition-opacity"
              onClick={() => router.push("/exams")}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}
      {/* Timer Bar */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-4 sticky top-0 z-20">
        <div className="text-black font-semibold text-lg">Time Left: {formatTime(remainingTime)}</div>
        <div className="text-gray-400 text-sm">(Exam will auto-submit when time runs out)</div>
      </div>
      <div className="w-full max-w-3xl overflow-y-auto max-h-[calc(100vh-32px)]">
        <div className="mb-4">
          <div className="text-black font-semibold">Difficulty: {exam.difficulty?.charAt(0).toUpperCase() + exam.difficulty?.slice(1)}</div>
          <div className="text-2xl font-bold text-black mb-2">{exam.title}</div>
        </div>
       
        {exam.questions.map((q, idx) => (
          <div key={q.id} className="mb-8 bg-white rounded-2xl p-6">
            <div className="font-semibold text-black mb-4 text-lg">
              Q{idx + 1}. {q.questionText} {q.marks ? `(${q.marks} marks)` : ""}
            </div>
            <textarea
              className="w-full p-4 rounded bg-[#FFB12133] text-gray-700 min-h-[60px]"
              placeholder="Type your short answer here"
              value={answers[idx]}
              onChange={(e) => handleAnswerChange(idx, e.target.value)}
            />
          </div>
        ))}
        <button
          className="point-ask-gradient text-white p-4 rounded-lg w-full max-w-xs mx-auto block"
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