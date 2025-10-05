"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";
import { pageAnimationStyles, getAnimationDelay } from '@/lib/animations';
import QuizCard from "@/components/QuizCard";
import ExamCard from "@/components/ExamCard";

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
  assignmentDetails?: any;
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

// Removed subjectColors - not needed since ExamCard handles its own styling

// Removed inline ExamCard - now using the shared ExamCard component from @/components/ExamCard

// Legacy inline QuizCard was removed in favor of components/QuizCard.
// If needed later, import and use the shared component.

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
          <button
            onClick={() => router.push('/exams/create')}
            className="flex items-center gap-2 point-ask-gradient text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
            style={{
              ...getAnimationDelay(1, 150),
              animation: 'slideInRight 0.6s ease-out forwards'
            }}
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </button>
        </div>
        <div
          className="w-full px-4 md:px-0 mb-6"
          style={{
            ...getAnimationDelay(2, 150),
            animation: 'slideInRight 0.6s ease-out forwards'
          }}
        >
        
        </div>
        <div
          className="text-base md:text-lg text-black mb-8"
          style={{
            ...getAnimationDelay(3, 150),
            animation: 'fadeInUp 0.6s ease-out forwards'
          }}
        >
        AI-powered preparation to help you perform your best.{' '}
          <span className="align-middle">🏅✨</span>
        </div>
        <div className="flex items-center justify-between mb-4 gap-4"
          style={{
            ...getAnimationDelay(4, 150),
            animation: 'slideInLeft 0.6s ease-out forwards'
          }}>
          <h3 className="text-xl font-bold text-black">Upcoming Exams</h3>
          <a
            href="#"
            className="font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity text-sm sm:text-base text-primary flex-shrink-0"
            onClick={(e) => {
              e.preventDefault();
              router.push('/exams/all?type=upcoming');
            }}
          >
            View all 
            <ArrowRight className="w-4 h-4 text-primary" />
          </a>
        </div>
        <div 
          className="mb-10 py-4"
          style={{
            ...getAnimationDelay(4, 200),
            animation: 'slideInLeft 0.8s ease-out forwards'
          }}
        >
          <div className="flex flex-row gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 ">
            {loading ? (
              <div className="text-black">Loading...</div>
            ) : upcomingExams.length === 0 ? (
              <div className="text-black">No upcoming Exams.</div>
            ) : (
              upcomingExams.slice(0, 2).map((exam, index) => (
                <div
                  key={exam.id}
                  style={{
                    ...getAnimationDelay(index, 200),
                    animation: 'bounceInUp 0.8s ease-out forwards'
                  }}
                >
                  <ExamCard
                    exam={{
                      ...exam,
                      subject: exam.subject || guessSubjectFromTopic(exam.topic),
                    }}
                    previous={false}
                    difficulty={exam.difficulty}
                    onStartExam={() => router.push(`/exams/take/${exam.id}`)}
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
            className="font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity text-sm sm:text-base text-primary flex-shrink-0"
            onClick={(e) => {
              e.preventDefault();
              router.push('/exams/all?type=previous');
            }}
          >
            View all 
            <ArrowRight className="w-4 h-4 text-primary" />
          </a>
        </div>
        <div 
          className="mb-10 py-4"
          style={{
            ...getAnimationDelay(6, 200),
            animation: 'slideInRight 0.8s ease-out forwards'
          }}
        >
          <div className="flex flex-row gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 ">
            {loading ? (
              <div className="text-black">Loading previous exams...</div>
            ) : previousExams.length === 0 ? (
              <div className="text-black">No previous exams.</div>
            ) : (
              previousExams.slice(0, 2).map((exam, index) => (
                <div
                  key={exam.id}
                  style={{
                    ...getAnimationDelay(index, 200),
                    animation: 'bounceInUp 0.8s ease-out forwards'
                  }}
                >
                  <ExamCard
                    exam={{
                      ...exam,
                      subject: exam.subject || guessSubjectFromTopic(exam.topic),
                    }}
                    previous={true}
                    date={exam.assignmentDetails?.endTime || exam.createdAt}
                    description={exam.instructions}
                    difficulty={exam.difficulty}
                    onViewReport={() => router.push(`/exams/reports/${exam.id}`)}
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
