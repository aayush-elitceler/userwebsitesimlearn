"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  userSelectedOptionId: string;
  isCorrect: boolean;
}

interface Result {
  submissionId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  questions: Question[];
}

export default function QuizAnswersPage() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/quiz/result?submissionId=${submissionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (data.success && data.data && data.data.result) {
          setResult(data.data.result);
        }
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    if (submissionId) fetchResult();
  }, [submissionId]);

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (!result) return <div className="text-white p-8">Result not found.</div>;

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">{result.quizTitle}</h2>
        <div className="text-lg text-white mb-4">
          Score: {result.score} / {result.totalQuestions * 20} | Correct: {result.correctAnswers} / {result.totalQuestions}
        </div>
        <div className="text-white mb-8">
          Submitted at: {new Date(result.submittedAt).toLocaleString()}
        </div>
        {result.questions.map((q, idx) => (
          <div key={q.id} className="mb-8 p-6 rounded-xl bg-[#222c2a] shadow">
            <div className="text-white font-semibold mb-2">
              Q{idx + 1}. {q.questionText}
            </div>
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => {
                const isUserSelected = opt.id === q.userSelectedOptionId;
                return (
                  <div
                    key={opt.id}
                    className={`px-4 py-2 rounded flex items-center gap-2
                      ${opt.isCorrect ? "bg-green-600 text-white font-bold" : ""}
                      ${isUserSelected && !opt.isCorrect ? "bg-red-600 text-white font-bold" : ""}
                      ${!opt.isCorrect && !isUserSelected ? "bg-[#333] text-gray-200" : ""}
                    `}
                  >
                    {opt.optionText}
                    {opt.isCorrect && <span className="ml-2">✔️</span>}
                    {isUserSelected && <span className="ml-2">🟢 Your answer</span>}
                  </div>
                );
              })}
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