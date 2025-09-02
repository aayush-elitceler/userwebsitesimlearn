"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { pageAnimationStyles, getAnimationDelay } from '@/lib/animations';

// Update the Quiz type to match API
interface Teacher {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  marks?: number;
  examId: string;
  options: any[];
}

interface Quiz {
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
  completed: boolean;
  score?: number;
  date?: string;
  questions?: Question[];
  time?: string;
  teacher?: string | Teacher;
  subject?: string;
  assignmentDetails?: {
    id: string;
    completed: boolean;
    score?: number;
    startTime?: string | null;
    endTime?: string | null;
    createdAt: string;
    updatedAt: string;
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
  buttonText = "Take practice exam",
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
    <div className="flex flex-row bg-white border border-[#DEDEDE] items-center 
                    w-full max-w-[520px] min-w-[380px] h-[280px] rounded-[15.51px] shadow-[0px_2.15px_16px_0px_#0000002E] 
                    flex-shrink-0 p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 transform
                    sm:max-w-[540px] sm:h-[290px] sm:p-5
                    md:max-w-[500px] md:h-[270px] md:p-5
                    lg:max-w-[520px] lg:h-[280px] lg:p-5
                    xl:max-w-[560px] xl:h-[300px] xl:p-6">
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden pr-4">
        <div className="flex-1 min-h-0 pb-3">
          <div className="text-[#626262] text-xs sm:text-sm font-medium mb-2">
            Subject: {exam.subject || "N/A"}
          </div>
          <div className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-semibold bg-gradient-to-r from-[#006a3d] to-[#006a3d] text-transparent bg-clip-text mb-3 break-words leading-tight">
            {exam.title}
          </div>
          <div className="text-black text-xs sm:text-sm mb-4 leading-relaxed break-words line-clamp-3">
            {exam.description || exam.instructions || "Practice exam to test your knowledge"}
          </div>
          <div className="flex items-center gap-2 text-black text-xs sm:text-sm mb-3">
            <span role="img" aria-label="clock">🕒</span>
            <span className="break-words">
              Due date:{" "}
              {exam.dueDate
                ? new Date(exam.dueDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
            </span>
          </div>
        </div>
        <div className="mt-auto pt-4 flex-shrink-0 min-h-[50px] flex items-end">
          <button
            className="bg-gradient-to-r from-[#006a3d] to-[#006a3d] cursor-pointer text-white rounded-lg px-4 py-2 font-semibold shadow hover:opacity-90 hover:scale-105 transition-all duration-200 text-sm whitespace-nowrap min-w-[120px]"
            onClick={onStart}
          >
            {buttonText}
          </button>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        <div
          className="rounded-xl flex items-center justify-center w-[120px] h-[80px] text-white text-base font-bold shadow-lg relative overflow-hidden"
          style={{
            background: subjectColors[exam.subject || "Default"],
          }}
        >
          <span className="z-10 font-bold tracking-wide text-center px-2 break-words">
            {exam.subject || "Subject"}
          </span>
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
  const description = quiz.instructions || "Learn with AI Tutor the core of grammar with help of new age solutions in your test";

  // Get CSS class for subject background
  const getSubjectClass = (subject: string | undefined) => {
    if (!subject) return 'quiz-subject-default';
    const normalized = subject.toLowerCase().replace(/\s+/g, '');
    switch (normalized) {
      case 'maths':
      case 'math':
        return 'quiz-subject-maths';
      case 'science':
        return 'quiz-subject-science';
      case 'english':
        return 'quiz-subject-english';
      case 'evs':
        return 'quiz-subject-evs';
      default:
        return 'quiz-subject-default';
    }
  };

  return (
    <div className="flex flex-row bg-white border border-[#DEDEDE] items-center 
                    w-full max-w-[520px] min-w-[380px] h-[280px] rounded-[15.51px] shadow-[0px_2.15px_16px_0px_#0000002E] 
                    flex-shrink-0 p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 transform
                    sm:max-w-[540px] sm:h-[290px] sm:p-5
                    md:max-w-[500px] md:h-[270px] md:p-5
                    lg:max-w-[520px] lg:h-[280px] lg:p-5
                    xl:max-w-[560px] xl:h-[300px] xl:p-6">
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden pr-4">
        <div className="flex-1 min-h-0 pb-3">
          <div className="text-[#626262] text-xs sm:text-sm font-medium mb-2">
            Subject: {quiz.subject || "Science"}
          </div>
          <div className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-semibold bg-gradient-to-r from-[#006a3d] to-[#006a3d] text-transparent bg-clip-text mb-3 break-words leading-tight">
            {quiz.title}
          </div>
          <div className="text-black text-xs sm:text-sm mb-4 leading-relaxed break-words line-clamp-3">
            {description}
          </div>
          <div className="flex items-center gap-2 text-black text-xs sm:text-sm mb-3">
            <span role="img" aria-label="clock">🕒</span>
            <span className="break-words">
              {previous ? (
                `Taken on ${date
                  ? new Date(date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : new Date(quiz.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                }`
              ) : (
                `Deadline: ${new Date(quiz.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}`
              )}
            </span>
          </div>
        </div>
        <div className="mt-auto pt-4 flex-shrink-0 min-h-[50px] flex items-end">
          {previous ? (
            <button
              className="bg-gradient-to-r from-[#006a3d] to-[#006a3d] text-white rounded-lg px-4 py-2 font-semibold shadow hover:opacity-90 hover:scale-105 transition-all duration-200 text-sm whitespace-nowrap min-w-[120px]"
              onClick={() => router.push(`/exams/reports/${quiz.id}`)}
            >
              View Report
            </button>
          ) : (
            <button
              className="bg-gradient-to-r from-[#006a3d] to-[#006a3d] cursor-pointer text-white rounded-lg px-4 py-2 font-semibold shadow hover:opacity-90 hover:scale-105 transition-all duration-200 text-sm whitespace-nowrap min-w-[120px]"
              onClick={() => router.push(`/exams/take/${quiz.id}`)}
            >
              Start Exam
            </button>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        <div
          className={`flex items-center justify-center text-white font-bold relative overflow-hidden rounded-[9px] shadow-[0px_0.89px_6.68px_0px_#00000075]
                      w-[120px] h-[80px] text-base ${getSubjectClass(quiz.subject)}`}
        >
          <span className="z-10 font-bold tracking-wide text-center px-2 break-words">
            {quiz.subject || "Science"}
          </span>
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
  // Remove old quizzes/submissions state
  // const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  // const [submissions, setSubmissions] = useState<Submission[]>([]);
  // const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [upcomingExams, setUpcomingExams] = useState<Quiz[]>([]);
  const [previousExams, setPreviousExams] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchExams() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/exams`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (data.success && data.data && data.data.userGeneratedExams) {
          // Reverse the arrays to show newest first
          setUpcomingExams((data.data.userGeneratedExams.upcoming || []).reverse());
          setPreviousExams((data.data.userGeneratedExams.previous || []).reverse());
        }
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchExams();
  }, []);

  return (
    <div className="min-h-screen w-full px-4 md:px-8 lg:px-12 py-8 bg-gray-100">
      <style jsx>{`
        ${pageAnimationStyles}
        .quiz-subject-maths {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .quiz-subject-science {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .quiz-subject-english {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .quiz-subject-evs {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
        .quiz-subject-default {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }
      `}</style>
      <div className="max-w-6xl mx-auto animate-fade-in-up">
        <div 
          className="flex items-center justify-between mb-2"
          style={{
            ...getAnimationDelay(0, 150),
            animation: 'slideInDown 0.6s ease-out forwards'
          }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-black">Exam Preparation</h2>
        </div>
        <div 
          className="w-full px-4 md:px-0 mb-6"
          style={{
            ...getAnimationDelay(1, 150),
            animation: 'slideInRight 0.6s ease-out forwards'
          }}
        >
          <div className="flex justify-end">
            <button
              className="flex items-center gap-2 bg-gradient-to-r from-[#006a3d] to-[#006a3d] hover:opacity-90 transition-opacity text-white cursor-pointer font-semibold px-5 py-3 rounded-lg shadow"
              onClick={() => router.push("/exams/create")}
            >
              <Plus size={20} />
              Create Practice Exam
            </button>
          </div>
        </div>
        <div 
          className="text-base md:text-lg text-black mb-8"
          style={{
            ...getAnimationDelay(2, 150),
            animation: 'fadeInUp 0.6s ease-out forwards'
          }}
        >
        AI-powered preparation to help you perform your best.{' '}
          <span className="align-middle">🏅✨</span>
        </div>
        <div className="flex items-center justify-between mb-4 gap-4">
          <h3 className="text-xl font-bold text-black">Upcoming Exams</h3>
          <a
            href="#"
            className="font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-[#006a3d] to-[#006a3d] flex-shrink-0"
            onClick={(e) => {
              e.preventDefault();
              router.push('/exams/all?type=upcoming');
            }}
          >
            View all 
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.627 8.75H0.5V7.25H12.627L6.93075 1.55375L8 0.5L15.5 8L8 15.5L6.93075 14.4462L12.627 8.75Z" fill="url(#paint0_linear_1309_2561)"/>
              <defs>
                <linearGradient id="paint0_linear_1309_2561" x1="0.5" y1="8" x2="15.5" y2="8" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#006a3d"/>
                  <stop offset="1" stopColor="#006a3d"/>
                </linearGradient>
              </defs>
            </svg>
          </a>
        </div>
        <div 
          className="mb-10 py-4"
          style={{
            ...getAnimationDelay(4, 200),
            animation: 'slideInLeft 0.8s ease-out forwards'
          }}
        >
          <div className="flex flex-row gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 overflow-x-clip">
            {loading ? (
              <div className="text-black">Loading...</div>
            ) : upcomingExams.length === 0 ? (
              <div className="text-black">No upcoming Exams.</div>
            ) : (
              upcomingExams.slice(0, 2).map((quiz, index) => (
                <div
                  key={quiz.id}
                  style={{
                    ...getAnimationDelay(index, 200),
                    animation: 'bounceInUp 0.8s ease-out forwards'
                  }}
                >
                  <ExamCard
                    exam={{
                      ...quiz,
                      subject: quiz.subject || guessSubjectFromTopic(quiz.topic),
                    }}
                    onStart={() => router.push(`/exams/take/${quiz.id}`)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mb-4 mt-8 gap-4">
          <h3 className="text-xl font-bold text-black">Previous Exams</h3>
          <a
            href="#"
            className="font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-[#006a3d] to-[#006a3d] flex-shrink-0"
            onClick={(e) => {
              e.preventDefault();
              router.push('/exams/all?type=previous');
            }}
          >
            View all 
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.627 8.75H0.5V7.25H12.627L6.93075 1.55375L8 0.5L15.5 8L8 15.5L6.93075 14.4462L12.627 8.75Z" fill="url(#paint0_linear_1309_2563)"/>
              <defs>
                <linearGradient id="paint0_linear_1309_2563" x1="0.5" y1="8" x2="15.5" y2="8" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#006a3d"/>
                  <stop offset="1" stopColor="#006a3d"/>
                </linearGradient>
              </defs>
            </svg>
          </a>
        </div>
        <div 
          className="mb-10 py-4"
          style={{
            ...getAnimationDelay(6, 200),
            animation: 'slideInRight 0.8s ease-out forwards'
          }}
        >
          <div className="flex flex-row gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 overflow-x-clip">
            {loading ? (
              <div className="text-black">Loading previous exams...</div>
            ) : previousExams.length === 0 ? (
              <div className="text-black">No previous exams.</div>
            ) : (
              previousExams.slice(0, 2).map((quiz, index) => (
                <div
                  key={quiz.id}
                  style={{
                    ...getAnimationDelay(index, 200),
                    animation: 'bounceInUp 0.8s ease-out forwards'
                  }}
                >
                  <QuizCard
                    quiz={{
                      ...quiz,
                      subject: quiz.subject || guessSubjectFromTopic(quiz.topic),
                    }}
                    previous={true}
                    score={quiz.assignmentDetails?.score || undefined}
                    date={quiz.assignmentDetails?.endTime || quiz.createdAt}
                    submissionId={undefined}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
