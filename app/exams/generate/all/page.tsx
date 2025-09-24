"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

export default function AllGenerateExamsPage() {
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
          const teacherGen = data.data.teacherAssignedExams || {};
          // Reverse the array to show newest first
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
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-black">Teacher Assigned Exams</h1>
        </div>

        <div className="text-base md:text-lg text-black mb-8">
          AI-powered exams to help you perform your best.{' '}
          <span className="align-middle">🏅✨</span>
        </div>

        {/* Grid layout for all cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-black">Loading...</div>
          </div>
        ) : teacherExams.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-black">No teacher-assigned exams available.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teacherExams.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={{
                  ...quiz,
                  subject: quiz.subject || guessSubjectFromTopic(quiz.topic),
                  date: quiz.assignmentDetails?.endTime || quiz.createdAt,
                  assignmentDetails: quiz.assignmentDetails ? {
                    endTime: quiz.assignmentDetails.endTime || quiz.createdAt
                  } : undefined,
                }}
                onStartQuiz={() => router.push(`/exams/take/${quiz.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
