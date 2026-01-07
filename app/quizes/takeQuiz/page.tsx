"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import QuizCard from "@/components/QuizCard";
import axios, { redirectToLogin } from '@/lib/axiosInstance';

// Update the Quiz type to match API
interface Teacher {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Option {
  id: string;
  optionText: string;
  isCorrect: boolean;
  questionId: string;
}

interface Question {
  id: string;
  questionText: string;
  bloomTaxonomy?: string | null;
  quizId: string;
  options?: Option[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  instructions: string;
  timeLimitMinutes: number;
  topic: string;
  difficulty: string;
  createdAt: string;
  userId?: string | null;
  completed: boolean;
  createdBy: string;
  score?: number;
  date?: string;
  questions?: Question[];
  time?: string;
  teacher?: string | Teacher;
  subject?: string;
  assignedAt?: string;
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
        <div className="text-amber-600 font-semibold mb-1">
          Subject: {exam.subject || "N/A"}
        </div>
        <div className="text-2xl font-bold text-black mb-2">{exam.title}</div>
        <div className="text-gray-200 mb-3">
          {exam.description || exam.instructions}
        </div>
        <div className="text-gray-300 mb-4 flex items-center gap-2">
          <span role="img" aria-label="clock">
            🕒
          </span>
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
          className="bg-gradient-primary text-primary-foreground rounded-lg px-6 py-2 font-semibold shadow hover:opacity-90 transition"
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



// Helper to guess subject from topic
function guessSubjectFromTopic(topic?: string): string {
  if (!topic) return "Default";
  const t = topic.toLowerCase();
  if (t.includes("math")) return "Maths";
  if (t.includes("science")) return "Science";
  if (t.includes("english") || t.includes("grammar")) return "English";
  if (t.includes("evs")) return "EVS";
  if (t.includes("bio") || t.includes("plant") || t.includes("food"))
    return "Science";
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
        const response = await axios.get('/users/quiz');
        const data = response.data;
        if (data.success && data.data) {
          const userQuizzes = data.data.userGeneratedQuizzes || {};
          const institutionQuizzes = data.data.institutionGeneratedQuizzes || {};

          const allQuizzes = [
            ...(Array.isArray(userQuizzes.upcoming) ? userQuizzes.upcoming : []),
            ...(Array.isArray(userQuizzes.previous) ? userQuizzes.previous : []),
            ...(Array.isArray(institutionQuizzes.upcoming) ? institutionQuizzes.upcoming : []),
            ...(Array.isArray(institutionQuizzes.previous) ? institutionQuizzes.previous : []),
          ];

          // Sort by createdAt date, newest first
          const sortByDate = (a: Quiz, b: Quiz) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

          setUserQuizzes(allQuizzes.sort(sortByDate));
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          redirectToLogin();
        } else {
          console.error('Error fetching quizzes:', error);
        }
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
        const response = await axios.get('/users/quiz/submissions');
        const data = response.data;
        if (data.success && data.data && data.data.submissions) {
          setSubmissions(data.data.submissions);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          redirectToLogin();
        } else {
          console.error('Error fetching submissions:', error);
        }
      } finally {
        setSubmissionsLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  // Filter quizzes based on completion status
  const startQuizzes = userQuizzes.filter((quiz) => !quiz.completed);
  const completedQuizzes = userQuizzes.filter((quiz) => quiz.completed);

  return (
    <div className="min-h-screen w-full px-4 md:px-8 lg:px-12 py-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div
          className="flex items-center justify-between mb-2"
        >
          <h2 className="text-2xl md:text-2xl font-bold text-black">
            My Quizzes
          </h2>
        </div>
        <div
          className="text-base md:text-lg text-black mb-8"
        >
          AI-powered quizzes to help you perform your best.{" "}
          <span className="align-middle">🏅✨</span>
        </div>

        {/* Start Quizzes Section */}
        <div
          className="flex items-center justify-between mt-8 gap-4"
        >
          <h3 className="text-xl font-bold text-black">Upcoming quizzes</h3>
          <a
            href="#"
            className="font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity text-sm sm:text-base text-gradient-primary flex-shrink-0"
            onClick={(e) => {
              e.preventDefault();
              router.push("/quizes/takeQuiz/all?type=start");
            }}
          >
            View all
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.627 8.75H0.5V7.25H12.627L6.93075 1.55375L8 0.5L15.5 8L8 15.5L6.93075 14.4462L12.627 8.75Z"
                fill="url(#paint0_linear_1309_2561)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_1309_2561"
                  x1="0.5"
                  y1="8"
                  x2="15.5"
                  y2="8"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="var(--primary)" />
                  <stop offset="1" stopColor="var(--primary)" />
                </linearGradient>
              </defs>
            </svg>
          </a>
        </div>
        <div
          className="mb-10 py-4"
        >
          <div className="flex flex-row gap-6 overflow-x-auto pb-4">
            {loading ? (
              <div className="flex items-center justify-center min-h-[260px] w-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                  <p className="text-gray-600 animate-pulse">
                    Loading quizzes...
                  </p>
                </div>
              </div>
            ) : startQuizzes.length === 0 ? (
              <div className="text-black">No upcoming quizzes.</div>
            ) : (
              startQuizzes.slice(0, 2).map((quiz, index) => (
                <div
                  key={quiz.id}
                  className="flex-shrink-0"
                >
                  <QuizCard quiz={quiz} previous={false} height="240px" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Quizzes Section */}
        <div
          className="flex items-center justify-between mb-4 mt-8 gap-4"
        >
          <h3 className="text-xl font-bold text-black">Previous quizzes</h3>
          <a
            href="#"
            className="font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity text-sm sm:text-base text-gradient-primary flex-shrink-0"
            onClick={(e) => {
              e.preventDefault();
              router.push("/quizes/takeQuiz/all?type=completed");
            }}
          >
            View all
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.627 8.75H0.5V7.25H12.627L6.93075 1.55375L8 0.5L15.5 8L8 15.5L6.93075 14.4462L12.627 8.75Z"
                fill="url(#paint0_linear_1309_2563)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_1309_2563"
                  x1="0.5"
                  y1="8"
                  x2="15.5"
                  y2="8"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="var(--primary)" />
                  <stop offset="1" stopColor="var(--primary)" />
                </linearGradient>
              </defs>
            </svg>
          </a>
        </div>
        <div
          className="mb-10 py-4"
        >
          <div className="flex flex-row gap-6 overflow-x-auto pb-4">
            {completedQuizzes.length === 0 ? (
              <div className="text-black">No previous quizzes.</div>
            ) : (
              completedQuizzes.slice(0, 2).map((quiz, index) => {
                const submission = submissions.find(
                  (s) => s.quizId === quiz.id
                );
                return (
                  <div
                    key={quiz.id}
                    className="flex-shrink-0"
                  >
                    <QuizCard
                      quiz={quiz}
                      previous={true}
                      score={submission?.score}
                      date={submission?.submittedAt}
                      submissionId={submission?.id}
                      height="240px"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
