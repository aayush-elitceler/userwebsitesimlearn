"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Option {
  id: string;
  optionText: string;
  isCorrect: boolean;
  questionId: string;
}

interface Question {
  id: string;
  questionText: string;
  quizId: string;
  options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  instructions: string;
  questions: Question[];
}

export default function QuizAnswersPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuiz() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/quiz-by-id?id=${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (data.success && data.data && data.data.quiz) {
          setQuiz(data.data.quiz);
        }
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchQuiz();
  }, [id]);

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (!quiz) return <div className="text-white p-8">Quiz not found.</div>;

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-gradient-to-br from-[#181c24] to-[#1a2a22]">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">{quiz.title}</h2>
        <div className="text-lg text-white mb-8">{quiz.instructions}</div>
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="mb-8 p-6 rounded-xl bg-[#222c2a] shadow">
            <div className="text-white font-semibold mb-2">
              Q{idx + 1}. {q.questionText}
            </div>
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`px-4 py-2 rounded ${
                    opt.isCorrect
                      ? "bg-green-600 text-white font-bold"
                      : "bg-[#333] text-gray-200"
                  }`}
                >
                  {opt.optionText}
                  {opt.isCorrect && <span className="ml-2">✔️</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
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