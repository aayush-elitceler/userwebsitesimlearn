"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { pageAnimationStyles, getAnimationDelay } from '@/lib/animations';

// Update the Quiz type to match API
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
  teacher?: string;
  subject?: string;
  assignedAt?: string;
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

  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const description = quiz.description || quiz.instructions || "Learn with AI Tutor the core of grammar with help of new age solutions in your test";

  // Check if content actually overflows
  useEffect(() => {
    if (descriptionRef.current) {
      const element = descriptionRef.current;
      // Temporarily remove line-clamp to check full height
      element.classList.remove('line-clamp-2');
      const fullHeight = element.scrollHeight;
      // Add line-clamp back
      element.classList.add('line-clamp-2');
      const clampedHeight = element.scrollHeight;
      setShouldTruncate(fullHeight > clampedHeight);
    }
  }, [description]);

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
          <div className="text-[#626262] text-xs sm:text-sm font-medium mb-1.5">
            Difficulty: {quiz.difficulty?.charAt(0).toUpperCase() + quiz.difficulty?.slice(1)}
          </div>
          <div className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-semibold bg-gradient-to-r from-primary to-primary text-transparent bg-clip-text mb-3 break-words leading-tight">
            {quiz.title}
          </div>
          <div className="text-black text-xs sm:text-sm mb-3 leading-relaxed">
            <div
              ref={descriptionRef}
              className={`break-words cursor-pointer ${!isExpanded ? 'line-clamp-2' : ''}`}
              onClick={() => shouldTruncate && setIsExpanded(!isExpanded)}
            >
              {quiz.instructions || "Learn with AI Tutor the core of grammar with help of new age solutions in your test"}
            </div>
            {shouldTruncate && (
              <button
                className="text-blue-600 hover:text-blue-800 text-xs mt-1 font-medium"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
          {previous ? (
            <div className="flex flex-col gap-1 text-xs sm:text-sm mb-3">
              <div className="flex items-center gap-2 text-black">
                <span className="text-amber-600">✔️</span>
                <span className="break-words">Score: {score || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-black">
                <span role="img" aria-label="calendar">📅</span>
                <span className="break-words">
                  Taken on {date ? new Date(date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }) : new Date(quiz.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 text-xs sm:text-sm mb-3">
              <div className="flex items-center gap-2 text-black">
                <span role="img" aria-label="questions">📝</span>
                <span className="break-words">Questions: {quiz.questions?.length ?? "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-black">
                <span role="img" aria-label="time">⏰</span>
                <span className="break-words">{quiz.time || `${quiz.timeLimitMinutes} mins`}</span>
              </div>
              <div className="flex items-center gap-2 text-black">
                <span role="img" aria-label="teacher">👨‍🏫</span>
                <span className="break-words">
                  {quiz.teacher || "-"}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-auto pt-3">
          {previous ? (
            <button
              className="bg-gradient-to-r from-primary to-primary text-white rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
              onClick={() => router.push(`/quizes/reports/${submissionId}`)}
            >
              View answers
            </button>
          ) : (
            <button
              className="bg-gradient-to-r from-primary to-primary cursor-pointer text-white rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
              onClick={() => router.push(`/quizes/${quiz.id}/start`)}
            >
              Start Quiz
            </button>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-3 sm:ml-4 lg:ml-5">
        <div
          className={`flex items-center justify-center text-white font-bold relative overflow-hidden rounded-[9px] shadow-[0px_0.89px_6.68px_0px_#00000075]
                      w-[120px] h-[80px] text-sm
                      sm:w-[130px] sm:h-[85px] sm:text-base
                      md:w-[110px] md:h-[75px] md:text-sm
                      lg:w-[140px] lg:h-[95px] lg:text-base
                      xl:w-[160px] xl:h-[110px] xl:text-lg
                      2xl:w-[180px] 2xl:h-[120px] 2xl:text-xl ${getSubjectClass(quiz.subject)}`}
        >
          <span className="z-10 font-bold tracking-wide text-center px-1.5 break-words">
            {quiz.subject || "Subject"}
          </span>
          {/* SVG Pattern from Figma */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <svg width="134" height="133" viewBox="0 0 134 133" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="61.3397" cy="72.3504" r="5.11912" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3395" cy="72.3512" r="10.6834" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3393" cy="72.351" r="16.2477" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3391" cy="72.3508" r="21.8119" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3389" cy="72.3506" r="27.3762" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3387" cy="72.3514" r="32.9404" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3385" cy="72.3512" r="38.5047" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3403" cy="72.351" r="44.069" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3401" cy="72.3508" r="49.6332" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3399" cy="72.3506" r="55.1975" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3397" cy="72.3514" r="60.7618" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3395" cy="72.3512" r="66.326" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3393" cy="72.351" r="71.8903" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <line x1="61.1936" y1="72.784" x2="0.000449386" y2="72.8107" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
            </svg>
          </div>
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
          const userQuizzes = data.data.userGeneratedQuizzes || {};
          const institutionQuizzes = data.data.institutionGeneratedQuizzes || {};

          const allUpcoming = [
            ...(Array.isArray(userQuizzes.upcoming) ? userQuizzes.upcoming : []),
            ...(Array.isArray(institutionQuizzes.upcoming) ? institutionQuizzes.upcoming : []),
          ];

          const allPrevious = [
            ...(Array.isArray(userQuizzes.previous) ? userQuizzes.previous : []),
            ...(Array.isArray(institutionQuizzes.previous) ? institutionQuizzes.previous : []),
          ];

          // Sort by createdAt date, newest first
          const sortByDate = (a: Quiz, b: Quiz) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

          setUpcomingQuizzes(allUpcoming.sort(sortByDate));
          setPreviousQuizzes(allPrevious.sort(sortByDate));
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
  const completedQuizzes = [...upcomingQuizzes, ...previousQuizzes].filter(quiz => quiz.completed);

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
              className="font-semibold flex items-center gap-2 hover:opacity-80 hover:scale-105 transition-all duration-200 text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary flex-shrink-0"
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
                    <stop stopColor="hsl(var(--primary))"/>
                    <stop offset="1" stopColor="hsl(var(--primary))"/>
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
                    <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
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
                    <QuizCard quiz={quiz} previous={false} />
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
              className="font-semibold flex items-center gap-2 hover:opacity-80 hover:scale-105 transition-all duration-200 text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary flex-shrink-0"
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
                    <stop stopColor="hsl(var(--primary))"/>
                    <stop offset="1" stopColor="hsl(var(--primary))"/>
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
