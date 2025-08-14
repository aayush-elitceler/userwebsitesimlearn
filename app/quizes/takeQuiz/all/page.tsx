"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
  const description = quiz.instructions || "Learn with AI Tutor the core of grammar with help of new age solutions in your test";
  
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
                    w-full h-[240px] rounded-[15.51px] shadow-[0px_2.15px_16px_0px_#0000002E] flex-shrink-0 p-5
                    sm:h-[240px] md:h-[240px] lg:h-[260px] xl:h-[280px] 2xl:h-[300px]">
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full overflow-hidden">
        <div className="flex-1 min-h-0">
          <div className="text-[#626262] text-xs sm:text-sm font-medium mb-1.5">
            Difficulty: {quiz.difficulty?.charAt(0).toUpperCase() + quiz.difficulty?.slice(1)}
          </div>
          <div className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-semibold bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-transparent bg-clip-text mb-2 break-words leading-tight">
            {quiz.title}
          </div>
          <div className="text-black text-xs sm:text-sm mb-3 leading-relaxed">
            <div 
              ref={descriptionRef}
              className={`break-words cursor-pointer ${!isExpanded ? 'line-clamp-2' : ''}`}
              onClick={() => shouldTruncate && setIsExpanded(!isExpanded)}
            >
              {description}
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
                <span className="text-green-400">✔️</span>
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
                  {quiz.teacher
                    ? typeof quiz.teacher === "string"
                      ? quiz.teacher
                      : quiz.teacher.firstName || quiz.teacher.lastName || "-"
                    : "-"}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-auto pt-1">
          {previous ? (
            <button
              className="bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
              onClick={() => router.push(`/quizes/${quiz.id}/answers?submissionId=${submissionId}`)}
            >
              View answers
            </button>
          ) : (
            <button
              className="bg-gradient-to-r from-[#FFB31F] to-[#FF4949] cursor-pointer text-white rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
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

export default function AllQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'your';

  const pageTitle = type === 'your' ? 'Your Quizzes' : 'All Quizzes';

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
          setQuizzes(userCombined);
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
      try {
        const token = getTokenFromCookie();
        if (!token) return;
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
      }
    }
    fetchSubmissions();
  }, []);

  return (
    <div className="min-h-screen w-full px-4 md:px-8 lg:px-12 py-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-black">{pageTitle}</h1>
        </div>

        <div className="text-base md:text-lg text-black mb-8">
          AI-powered quizzes to help you perform your best. <span className="align-middle">🏅✨</span>
        </div>

        {/* Grid layout for all cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-black">Loading...</div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-black">No quizzes available.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quizzes.map((quiz) => {
              const submission = submissions.find(
                (s) => s.quizId === quiz.id
              );
              return (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  previous={quiz.completed}
                  score={submission?.score}
                  date={submission?.submittedAt}
                  submissionId={submission?.id}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
