"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { pageAnimationStyles, getAnimationDelay } from '@/lib/animations';
import QuizCard from "@/components/QuizCard";

// Update the Quiz type to match API
interface Question {
  id: string;
  questionText: string;
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
  teacher?: string;
  subject?: string;
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
// (Removed stray, corrupted JSX block introduced earlier)

export default function AllQuizzesPage() {
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<Quiz[]>([]);
  const [previousQuizzes, setPreviousQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'start';

  // Filter quizzes based on type
  const getFilteredQuizzes = () => {
    if (type === 'start') {
      return upcomingQuizzes.filter(quiz => !quiz.completed);
    } else if (type === 'completed') {
      return previousQuizzes.filter(quiz => quiz.completed);
    }
    return [];
  };

  const displayQuizzes = getFilteredQuizzes();
  const pageTitle = type === 'start' ? 'Upcoming Quizzes' : 'Previous Quizzes';

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
        if (
          data.success &&
          data.data &&
          data.data.institutionGeneratedQuizzes
        ) {
          const userObj = data.data.institutionGeneratedQuizzes;
          // Reverse the arrays to show newest first
          setUpcomingQuizzes(
            Array.isArray(userObj.upcoming) ? userObj.upcoming.reverse() : []
          );
          setPreviousQuizzes(
            Array.isArray(userObj.previous) ? userObj.previous.reverse() : []
          );
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
          🎯 Take quizzes, earn badges, and become a quiz champ!{" "}
          <span className="align-middle">🏅✨</span>
        </div>

        {/* Grid layout for all cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-black">Loading...</div>
          </div>
        ) : displayQuizzes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-black">No {type} quizzes available.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayQuizzes.map((quiz) => {
              const submission = submissions.find(
                (s) => s.quizId === quiz.id
              );
              return (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  previous={type === 'completed'}
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
