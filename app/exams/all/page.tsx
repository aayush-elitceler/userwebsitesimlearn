"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import axios, { redirectToLogin } from '@/lib/axiosInstance';
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
  quizId: string;
  options: any[];
  bloomTaxonomy?: string | null;
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

// (Removed a large inline QuizCard; use components/QuizCard instead)


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
  return "Default";
}

export default function AllExamsPage() {
  const [upcomingExams, setUpcomingExams] = useState<Quiz[]>([]);
  const [previousExams, setPreviousExams] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'upcoming';

  const pageTitle = type === 'upcoming' ? 'Upcoming Exams' : 'Previous Exams';
  const displayExams = type === 'upcoming' ? upcomingExams : previousExams;

  useEffect(() => {
    async function fetchExams() {
      setLoading(true);
      try {
        const response = await axios.get('/users/exams');
        const data = response.data;
        if (
          data.success &&
          data.data &&
          data.data.userGeneratedExams
        ) {
          const userObj = data.data.userGeneratedExams;
          // Reverse the arrays to show newest first
          setUpcomingExams(
            Array.isArray(userObj.upcoming) ? userObj.upcoming.reverse() : []
          );
          setPreviousExams(
            Array.isArray(userObj.previous) ? userObj.previous.reverse() : []
          );
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          redirectToLogin();
        } else {
          console.error('Error fetching exams:', error);
        }
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
          <h1 className="text-2xl md:text-3xl font-bold text-black">{pageTitle}</h1>
        </div>

        <div className="text-base md:text-lg text-black mb-8">
          AI-powered preparation to help you perform your best.{' '}
          <span className="align-middle">🏅✨</span>
        </div>

        {/* Grid layout for all cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-black">Loading...</div>
          </div>
        ) : displayExams.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-black">No {type} exams available.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayExams.map((exam) => {
              return (
                <ExamCard
                  key={exam.id}
                  exam={{
                    ...exam,
                    subject: exam.subject || guessSubjectFromTopic(exam.topic),
                  }}
                  previous={type === 'previous'}
                  date={exam.assignmentDetails?.endTime || exam.createdAt}
                  description={exam.description || exam.instructions}
                  difficulty={exam.difficulty}
                  onViewReport={type === 'previous' ? () => router.push(`/exams/reports/${exam.id}`) : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
