"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { pageAnimationStyles, getAnimationDelay } from '@/lib/animations';

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
          <div className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-semibold bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-transparent bg-clip-text mb-3 break-words leading-tight">
            {quiz.title}
          </div>
          <div className="text-black text-xs sm:text-sm mb-4 leading-relaxed break-words line-clamp-3">
            {quiz.instructions || "Learn with AI Tutor the core of grammar with help of new age solutions in your test"}
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
              className="bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white rounded-lg px-4 py-2 font-semibold shadow hover:opacity-90 hover:scale-105 transition-all duration-200 text-sm whitespace-nowrap min-w-[120px]"
              onClick={() =>
                router.push(
                  `/quizes/reports/${submissionId}`
                )
              }
            >
              View answers
            </button>
          ) : (
            <button
              className="bg-gradient-to-r from-[#FFB31F] to-[#FF4949] cursor-pointer text-white rounded-lg px-4 py-2 font-semibold shadow hover:opacity-90 hover:scale-105 transition-all duration-200 text-sm whitespace-nowrap min-w-[120px]"
              onClick={() => router.push(`/quizes/${quiz.id}/start`)}
            >
              Start Quiz
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
        if (data.success && data.data) {
          const userObj = data.data.userGeneratedQuizzes || {};
          const userCombined = [
            ...(Array.isArray(userObj.upcoming) ? userObj.upcoming : []),
            ...(Array.isArray(userObj.previous) ? userObj.previous : []),
          ];
          setUpcomingQuizzes(userCombined);
          setPreviousQuizzes(userCombined);
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

  // Filter quizzes based on completion status
  const startQuizzes = upcomingQuizzes.filter(quiz => !quiz.completed);
  const completedQuizzes = upcomingQuizzes.filter(quiz => quiz.completed);

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
      <div className="max-w-6xl mx-auto">
        <h2 
          className="text-2xl md:text-3xl font-bold text-black mb-2 animate-slide-in-down"
          style={{ animationDelay: '0ms' }}
        >My Quizzes</h2>

        <div 
          className="text-base md:text-lg text-black mb-8 animate-fade-in-up"
          style={{ animationDelay: '150ms' }}
        >
          🎯 Take quizzes, earn badges, and become a quiz champ!{" "}
          <span className="align-middle">🏅✨</span>
        </div>
        
        {/* Start Quizzes Section */}
        <div 
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <div className="flex items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-bold text-black">Upcoming quizzes</h3>
            <a
              href="#"
              className="font-semibold flex items-center gap-2 hover:opacity-80 hover:scale-105 transition-all duration-200 text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-[#FF8015] to-[#FF9D07] flex-shrink-0"
              onClick={(e) => {
                e.preventDefault();
                router.push('/quizes/takeQuiz/all?type=start');
              }}
            >
              View all 
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-200 group-hover:translate-x-1">
                <path d="M12.627 8.75H0.5V7.25H12.627L6.93075 1.55375L8 0.5L15.5 8L8 15.5L6.93075 14.4462L12.627 8.75Z" fill="url(#paint0_linear_1309_2561)"/>
                <defs>
                  <linearGradient id="paint0_linear_1309_2561" x1="0.5" y1="8" x2="15.5" y2="8" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF8015"/>
                    <stop offset="1" stopColor="#FF9D07"/>
                  </linearGradient>
                </defs>
              </svg>
            </a>
          </div>
          <div className="py-4">
            <div className="flex flex-row gap-6 overflow-x-auto pb-4">
              {loading ? (
                <div className="flex items-center justify-center min-h-[220px] w-full">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-gray-600 animate-pulse">Loading quizzes...</p>
                  </div>
                </div>
              ) : startQuizzes.length === 0 ? (
                <div className="text-black text-center py-8 w-full">No upcoming quizzes.</div>
              ) : (
                startQuizzes.slice(0, 2).map((quiz, idx) => (
                  <div
                    key={quiz.id}
                    className="animate-scale-in flex-shrink-0"
                    style={{ animationDelay: `${450 + idx * 100}ms` }}
                  >
                    <QuizCard quiz={quiz} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Completed Quizzes Section */}
        <div 
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: '600ms' }}
        >
          <div className="flex items-center justify-between mb-6 mt-8 gap-4">
            <h3 className="text-xl font-bold text-black">Previous quizzes</h3>
            <a
              href="#"
              className="font-semibold flex items-center gap-2 hover:opacity-80 hover:scale-105 transition-all duration-200 text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-[#FF8015] to-[#FF9D07] flex-shrink-0"
              onClick={(e) => {
                e.preventDefault();
                router.push('/quizes/takeQuiz/all?type=completed');
              }}
            >
              View all 
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-200 group-hover:translate-x-1">
                <path d="M12.627 8.75H0.5V7.25H12.627L6.93075 1.55375L8 0.5L15.5 8L8 15.5L6.93075 14.4462L12.627 8.75Z" fill="url(#paint0_linear_1309_2563)"/>
                <defs>
                  <linearGradient id="paint0_linear_1309_2563" x1="0.5" y1="8" x2="15.5" y2="8" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF8015"/>
                    <stop offset="1" stopColor="#FF9D07"/>
                  </linearGradient>
                </defs>
              </svg>
            </a>
          </div>
          <div className="py-4">
            <div className="flex flex-row gap-6 overflow-x-auto pb-4">
              {completedQuizzes.length === 0 ? (
                <div className="text-black text-center py-8 w-full">No previous quizzes.</div>
              ) : (
                completedQuizzes.slice(0, 2).map((quiz, idx) => {
                  const submission = submissions.find(
                    (s) => s.quizId === quiz.id
                  );
                  return (
                    <div
                      key={quiz.id}
                      className="animate-scale-in flex-shrink-0"
                      style={{ animationDelay: `${750 + idx * 100}ms` }}
                    >
                      <QuizCard
                        quiz={quiz}
                        previous={true}
                        score={submission?.score}
                        date={submission?.submittedAt}
                        submissionId={submission?.id}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
