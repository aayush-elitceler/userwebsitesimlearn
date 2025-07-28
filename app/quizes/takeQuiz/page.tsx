"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

// Update the Quiz type to match API
interface Teacher {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Question {
  id: string;
  questionText: string;
  // Add other fields as needed
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
  score?: number;
  date?: string;
  questions?: Question[];
  time?: string;
  teacher?: string | Teacher;
  subject?: string;
  assignmentDetails?: {
    endTime: string;
  };
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

function ExamCard({
  exam,
  onStart,
  buttonText = "Take exam",
}: {
  exam: {
    title: string;
    subject?: string;
    instructions?: string;
    dueDate?: string; // ISO string
    description?: string;
  };
  onStart?: () => void;
  buttonText?: string;
}) {
  return (
    <div className="flex flex-row bg-[#393e3a] rounded-2xl p-8 mb-6 shadow-lg max-w-3xl w-full items-center">
      <div className="flex-1">
        <div className="text-green-400 font-semibold mb-1">
          Subject: {exam.subject || "N/A"}
        </div>
        <div className="text-2xl font-bold text-black mb-2">{exam.title}</div>
        <div className="text-gray-200 mb-3">
          {exam.description || exam.instructions}
        </div>
        <div className="text-gray-300 mb-4 flex items-center gap-2">
          <span role="img" aria-label="clock">🕒</span>
          Due date:{" "}
          {exam.dueDate
            ? new Date(exam.dueDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-"}
        </div>
        <button
          className="bg-[#007437] text-black rounded-lg px-6 py-2 font-semibold shadow hover:bg-green-700 transition"
          onClick={onStart}
        >
          {buttonText}
        </button>
      </div>
      <div className="ml-8 flex-shrink-0">
        <div
          className="rounded-xl flex items-center justify-center w-56 h-36 text-black text-2xl font-bold shadow-lg"
          style={{
            background: subjectColors[exam.subject || "Default"],
            minWidth: 180,
          }}
        >
          {exam.subject || "Subject"}
        </div>
      </div>
    </div>
  );
}

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
      className={`min-w-[380px] max-w-[500px] w-full flex flex-row items-center rounded-2xl p-6 mb-4 shadow-lg transition bg-white`}
     
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
                <span>📝</span>Questions: {quiz.questions?.length ?? "-"}
              </span>
              <span className="flex items-center gap-1">
                <span>⏰</span>{quiz.time || `${quiz.timeLimitMinutes} mins`}
              </span>
              <span className="flex items-center gap-1">
                <span>👨‍🏫</span>
                {quiz.teacher
                  ? typeof quiz.teacher === "string"
                    ? quiz.teacher
                    : quiz.teacher.firstName || quiz.teacher.lastName || "-"
                  : "-"}
              </span>
            </>
          )}
          
        </div>
        {previous ? (
          <button
          className="point-ask-gradient cursor-pointer text-white rounded-full px-6 py-2 font-semibold mt-2 shadow hover:bg-[#333] transition"
          onClick={() => router.push(`/quizes/${quiz.id}/answers?submissionId=${submissionId}`)}
          >
            View answers
          </button>
        ) : (
          <button
          className="point-ask-gradient cursor-pointer text-white rounded-full px-6 py-2 font-semibold mt-2 shadow hover:bg-[#333] transition"
          onClick={() => router.push(`/quizes/${quiz.id}/start`)}
          >
            Start Exam
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

// Helper to guess subject from topic
function guessSubjectFromTopic(topic?: string): string {
  if (!topic) return "Default";
  const t = topic.toLowerCase();
  if (t.includes("math")) return "Maths";
  if (t.includes("science")) return "Science";
  if (t.includes("english") || t.includes("grammar")) return "English";
  if (t.includes("evs")) return "EVS";
  if (t.includes("bio") || t.includes("plant") || t.includes("food")) return "Science";
  if (t.includes("motion") || t.includes("law")) return "Science";
  // Add more rules as needed
  return "Default";
}

export default function QuizesPage() {
  const [userQuizzes, setUserQuizzes] = useState<Quiz[]>([]);
  // const [institutionQuizzes, setInstitutionQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Add state for submissions and loading
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

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
        if (data.success && data.data) {
          // Combine upcoming and previous for user quizzes
          const userObj = data.data.userGeneratedQuizzes || {};
          const userCombined = [
            ...(Array.isArray(userObj.upcoming) ? userObj.upcoming : []),
            ...(Array.isArray(userObj.previous) ? userObj.previous : []),
          ];
          setUserQuizzes(userCombined);
          // Combine upcoming and previous for institution quizzes
        
        }
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchQuizzes();
  }, []);

  // Fetch submissions on mount
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-black">Quiz Preparation</h2>
          <button
          className="fixed top-6 right-6 cursor-pointer z-50 flex items-center gap-2 point-ask-gradient hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-lg shadow transition"
          onClick={() => router.push("/quizes/generate")}
        >
          <Plus size={20} />
          Create Quiz        
        </button>
        </div>
        <div className="text-lg text-black mb-8">
          AI-powered quizzes to help you perform your best. <span className="align-middle">🏅✨</span>
        </div>
       
        {/* Institution Generated Quizzes */}
        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-xl font-bold text-black">Your Quizzes</h3>
        </div>
        <div className="overflow-x-auto scrollbar-hide mb-10 pb-4 w-full">
          <div className="flex flex-row flex-nowrap gap-8 w-max ">
            {loading ? (
              <div className="text-black">Loading...</div>
            ) : userQuizzes.length === 0 ? (
              <div className="text-black">No institution-generated quizzes.</div>
            ) : (
              userQuizzes.map((quiz) => (
                <QuizCard
                  quiz={quiz}
                  key={quiz.id}
                  previous={quiz.completed}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
