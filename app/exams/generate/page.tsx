"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";
import QuizCard from "@/components/QuizCard";

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

// Removed inline QuizCard to use the shared components/QuizCard

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
  const [userExams, setUserExams] = useState<Quiz[]>([]);
  const [teacherExams, setTeacherExams] = useState<Quiz[]>([]);
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
        if (data.success && data.data) {
          const userGen = data.data.userGeneratedExams || {};
          const teacherGen = data.data.teacherAssignedExams || {};
          // Reverse the arrays to show newest first
          setUserExams([...(userGen.upcoming || []), ...(userGen.previous || [])].reverse());
          setTeacherExams([...(teacherGen.upcoming || []), ...(teacherGen.previous || [])].reverse());
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl md:text-3xl font-bold text-black">Exams</h2>
        </div>
        <div className="text-base md:text-lg text-black mb-8">
        AI-powered exams to help you perform your best.{' '}
          <span className="align-middle">🏅✨</span>
        </div>
       
        {/* Teacher Assigned Exams Section */}
        <div className="flex items-center justify-between mb-4 mt-8 gap-4">
          <h3 className="text-xl font-bold text-black">Teacher Assigned Exams</h3>
          <button
            onClick={(e) => {
              e.preventDefault();
              router.push('/exams/generate/all');
            }}
            className="font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity text-sm sm:text-base text-primary flex-shrink-0 bg-transparent border-none cursor-pointer"
          >
            View all
            <ArrowRight className="w-4 h-4 text-primary" />
          </button>
        </div>
        <div className="mb-10 py-4">
          <div className="flex flex-row gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 ">
            {loading ? (
              <div className="text-black">Loading...</div>
            ) : teacherExams.length === 0 ? (
              <div className="text-black">No teacher-assigned exams found.</div>
            ) : (
              teacherExams.slice(0, 2).map((quiz) => (
                <QuizCard
                  quiz={{
                    ...quiz,
                    subject: quiz.subject || guessSubjectFromTopic(quiz.topic),
                    date: quiz.assignmentDetails?.endTime || quiz.createdAt,
                    assignmentDetails: quiz.assignmentDetails ? {
                      endTime: quiz.assignmentDetails.endTime || quiz.createdAt
                    } : undefined,
                  }}
                  key={quiz.id}
                  onStartQuiz={() => router.push(`/exams/take/${quiz.id}`)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
