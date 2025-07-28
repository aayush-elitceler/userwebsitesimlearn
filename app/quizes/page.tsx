"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

// Update the Quiz type to match API
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
  score?: number;
  date?: string;
  questions?: number;
  time?: string;
  teacher?: string;
  subject?: string;
}
type Submission = {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  submittedAt: string;
  quiz: Quiz;
};

const subjectColors: Record<string, string> = {
  Maths: "#4A90E2",
  Math: "#4A90E2",
  Science: "#8F5AFF",
  English: "#F44336",
  EVS: "#E6AF3F",
  Default: "#E6AF3F",
};

function QuizCard({
  quiz,
  previous,
  score,
  date,
  submissionId,
}: {
  quiz: Quiz;
  previous?: boolean;
  score?: number;
  date?: string;
  submissionId?: string;
}) {
  const router = useRouter();
  
  return (
    <div
      className={`min-w-[380px] max-w-[500px] w-full flex flex-row items-center rounded-2xl p-6 mb-4 shadow-lg transition ${
       "bg-white"
      }`}
      
    >
      <div className="flex-1">
        <div
          className={`text-sm font-semibold mb-1 text-black`}
        >
          Difficulty: {quiz.difficulty?.charAt(0).toUpperCase() + quiz.difficulty?.slice(1)}
        </div>
        <div className="text-2xl font-semibold bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-transparent bg-clip-text">
          {quiz.title}
        </div>
        <div className="flex items-center gap-4 text-black text-sm mb-4">
          {previous ? (
            <>
              <span className="flex items-center gap-1">
                <span className="text-green-400">✔️</span>Score: {score || "-"}
              </span>
              <span className="flex items-center gap-1">
                <span>📅</span>
                Taken on {date ? new Date(date).toLocaleDateString() : new Date(quiz.createdAt).toLocaleDateString()}
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span>📝</span>Questions: {quiz.questions || "-"}
              </span>
              <span className="flex items-center gap-1">
                <span>⏰</span>{quiz.time || `${quiz.timeLimitMinutes} mins`}
              </span>
              <span className="flex items-center gap-1">
                <span>👨‍🏫</span>{quiz.teacher || "-"}
              </span>
            </>
          )}
        </div>
        {previous ? (
          <button
            className="point-ask-gradient text-white rounded-full px-6 py-2 font-semibold mt-2 shadow hover:bg-[#333] transition"
            onClick={() => router.push(`/quizes/${quiz.id}/answers?submissionId=${submissionId}`)}
          >
            View answers
          </button>
        ) : (
          <button
            className="point-ask-gradient text-white rounded-full px-6 py-2 font-semibold mt-2 shadow hover:bg-[#16a34a] transition"
            onClick={() => router.push(`/quizes/${quiz.id}/start`)}
          >
            Start Quiz
          </button>
        )}
      </div>
      <div className="ml-6 flex-shrink-0 relative">
        <div
          className="rounded-2xl flex items-center justify-center w-40 h-28 md:w-44 md:h-32 text-black text-xl font-bold shadow-lg relative overflow-hidden"
          style={{ background: subjectColors[quiz.subject || 'Default'], minWidth: 140 }}
        >
          <span className="z-10 text-lg font-semibold tracking-wide">{quiz.subject || "-"}</span>
          <svg width="100" height="100" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 z-0" style={{pointerEvents:'none'}}><circle cx="50" cy="50" r="48" stroke="#fff" strokeWidth="2" fill="none"/><circle cx="50" cy="50" r="30" stroke="#fff" strokeWidth="1" fill="none"/></svg>
        </div>
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

export default function QuizesPage() {
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<Quiz[]>([]);
  const [previousQuizzes, setPreviousQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/quiz`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (data.success && data.data && data.data.institutionGeneratedQuizzes) {
          const userObj = data.data.institutionGeneratedQuizzes;
          setUpcomingQuizzes(Array.isArray(userObj.upcoming) ? userObj.upcoming : []);
          setPreviousQuizzes(Array.isArray(userObj.previous) ? userObj.previous : []);
        }
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchQuizzes();
  }, []);

  useEffect(() => {
    async function fetchSubmissions() {
      setSubmissionsLoading(true);
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setSubmissionsLoading(false);
          return;
        }
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/quiz/submissions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (data.success && data.data && data.data.submissions) {
          setSubmissions(data.data.submissions);
        }
      } catch (e) {
        // handle error
      } finally {
        setSubmissionsLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-black mb-2">My Quizzes</h2>
       
        <div className="text-lg text-black mb-8">
          🎯 Take quizzes, earn badges, and become a quiz champ!{" "}
          <span className="align-middle">🏅✨</span>
        </div>
        {/* Upcoming Quizzes */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-black">Upcoming quizzes</h3>
          <a
            href="#"
            className="text-black font-semibold flex items-center gap-1 hover:underline"
          >
            View all <span>→</span>
          </a>
        </div>
        <div className="overflow-x-auto scrollbar-hide mb-10 pb-4 w-full">
          <div className="flex flex-row flex-nowrap gap-8 w-max">
            {loading ? (
              <div className="text-black">Loading...</div>
            ) : upcomingQuizzes.length === 0 ? (
              <div className="text-black">No upcoming quizzes.</div>
            ) : (
              upcomingQuizzes.map((quiz) => (
                <QuizCard quiz={quiz} key={quiz.id} />
              ))
            )}
          </div>
        </div>
        {/* Previous Quizzes */}
        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-xl font-bold text-black">Previous quizzes</h3>
          <a
            href="#"
            className="text-black font-semibold flex items-center gap-1 hover:underline"
          >
            View all <span>→</span>
          </a>
        </div>
        <div className="overflow-x-auto scrollbar-hide mb-10 pb-4 w-full">
          <div className="flex flex-row flex-nowrap gap-8 w-max ">
            {loading ? (
              <div className="text-black">Loading previous quizzes...</div>
            ) : previousQuizzes.length === 0 ? (
              <div className="text-black">No previous quizzes.</div>
            ) : (
              previousQuizzes.map((quiz) => {
                const submission = submissions.find((s) => s.quizId === quiz.id);
                return (
                  <QuizCard
                    quiz={quiz}
                    key={quiz.id}
                    previous={quiz.completed}
                    score={submission?.score}
                    date={submission?.submittedAt}
                    submissionId={submission?.id}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
