"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    id?: string;
  };
  onStart?: () => void;
  buttonText?: string;
}) {
  return (
    <div className="flex flex-row bg-white rounded-2xl p-8 shadow-lg w-full items-center">
      <div className="flex-1">
        <div className="text-black font-semibold mb-1">
          Subject: {exam.subject || "N/A"}
        </div>
        <div className="text-2xl font-bold text-black mb-2">{exam.title}</div>
        <div className="text-black mb-3">
          {exam.description || exam.instructions}
        </div>
        <div className="text-black mb-4 flex items-center gap-2">
          <span role="img" aria-label="clock">🕒</span>
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
          className="point-ask-gradient text-white cursor-pointer rounded-lg px-6 py-2 font-semibold shadow hover:bg-green-700 transition"
          onClick={onStart}
        >
          {buttonText}
        </button>
      </div>
      <div className="ml-8 flex-shrink-0">
        <div
          className="rounded-xl flex items-center justify-center w-56 h-36 text-white text-2xl font-bold shadow-lg"
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
          setTeacherExams([...(teacherGen.upcoming || []), ...(teacherGen.previous || [])]);
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
              <ExamCard
                key={quiz.id}
                exam={{
                  ...quiz,
                  subject: quiz.subject || guessSubjectFromTopic(quiz.topic),
                  dueDate: quiz.assignmentDetails?.endTime || quiz.createdAt,
                }}
                onStart={() => router.push(`/exams/take/${quiz.id}`)}
                buttonText={quiz.assignmentDetails && 'completed' in quiz.assignmentDetails && quiz.assignmentDetails.completed ? 'Retake exam' : 'Take exam'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
