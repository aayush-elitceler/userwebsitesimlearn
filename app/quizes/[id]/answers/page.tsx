"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios, { redirectToLogin } from '@/lib/axiosInstance';

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
        const response = await axios.get(`/users/quiz/result?submissionId=${submissionId}`);
        const data = response.data;
        if (data.success && data.data && data.data.result) {
          setResult(data.data.result);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          redirectToLogin();
        } else {
          console.error('Error fetching quiz result:', error);
        }
      } finally {
        setLoading(false);
      }
    }
    if (submissionId) fetchResult();
  }, [submissionId]);

  if (loading) return <div className="text-black p-8">Loading...</div>;
  if (!result) return <div className="text-black p-8">Result not found.</div>;

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-black mb-2">{result.quizTitle}</h2>
        <div className="text-lg text-black mb-4">
          Correct: {result.correctAnswers} / {result.totalQuestions} | Percentage: {Math.round((result.correctAnswers / Math.max(1, result.totalQuestions)) * 100)}%
        </div>
        <div className="text-black mb-8">
          Submitted at: {new Date(result.submittedAt).toLocaleString()}
        </div>
        {result.questions.map((q, idx) => (
          <div key={q.id} className="mb-8 p-6 rounded-xl bg-white shadow">
            <div className="text-black font-semibold mb-2">
              Q{idx + 1}. {q.questionText}
            </div>
            {q.bloomTaxonomy && (
              <div className="mb-3 p-2 bg-gray-50 rounded border">
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Bloom Taxonomy:</span> {q.bloomTaxonomy}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => {
                const isUserSelected = opt.id === q.userSelectedOptionId;
                return (
                  <div
                    key={opt.id}
                    className={`px-4 py-2 rounded flex items-center gap-2
                      ${opt.isCorrect ? "bg-green-600 text-white font-bold" : ""}
                      ${isUserSelected && !opt.isCorrect ? "bg-red-600 text-white font-bold" : ""}
                      ${!opt.isCorrect && !isUserSelected ? "bg-gray-100 text-[#646464]" : ""}
                    `}
                  >
                    <span className="mr-2">{opt.isCorrect ? '✅' : isUserSelected ? '❌' : '⬜'}</span>
                    <span>{opt.optionText}</span>
                    {isUserSelected && <span className="ml-2">(Your answer)</span>}
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
