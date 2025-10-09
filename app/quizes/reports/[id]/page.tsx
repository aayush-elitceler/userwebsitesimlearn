"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

type QuizResult = {
  quizTitle: string;
  difficulty?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  // ...add other fields as needed
};

type SuggestedQuiz = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  timeLimitMinutes: number;
  totalQuestions: number;
  instructions: string;
  isImprovement: boolean;
  isNewTopic: boolean;
};

// Function to calculate pointer position based on score percentage
function calculatePointerPosition(scorePercentage: number): number {
  // Map score percentage to pointer position (0-100)
  // 0-25% = Poor (0-25)
  // 26-50% = Fair (26-50) 
  // 51-75% = Good (51-75)
  // 76-100% = Excellent (76-100)
  return Math.min(Math.max(scorePercentage, 0), 100);
}

// Function to get performance level based on score percentage
function getPerformanceLevel(scorePercentage: number): string {
  if (scorePercentage >= 76) return "EXCELLENT";
  if (scorePercentage >= 51) return "GOOD";
  if (scorePercentage >= 26) return "FAIR";
  return "POOR";
}

export default function QuizReportPage() {
  const { id } = useParams();
  const submissionId = Array.isArray(id) ? id[0] : id;
  const [result, setResult] = useState<QuizResult | null>(null);
  const [suggestedQuizzes, setSuggestedQuizzes] = useState<SuggestedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const router = useRouter();

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

  useEffect(() => {
    async function fetchSuggestedQuizzes() {
      setSuggestedLoading(true);
      try {
        const token = getTokenFromCookie();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/quiz/suggested`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (data.success && data.data && data.data.quizzes) {
          setSuggestedQuizzes(data.data.quizzes);
        }
      } catch (e) {
        // handle error
      } finally {
        setSuggestedLoading(false);
      }
    }
    fetchSuggestedQuizzes();
  }, []);

  if (loading) {
    const reportLoadingStates = [
      { text: "Fetching your quiz data" },
      { text: "Analyzing your answers" },
      { text: "Calculating your score" },
      { text: "Summarizing insights" },
      { text: "Preparing your report" },
    ];
    const perStepMs = Math.floor(45000 / reportLoadingStates.length);
    return (
      <MultiStepLoader loading loadingStates={reportLoadingStates} duration={perStepMs} loop={false} />
    );
  }
  if (!result) return <div className="text-black p-8">Result not found.</div>;

  // Calculate score percentage based on correct answers instead of fixed per-question marks
  const scorePercentage = result.totalQuestions > 0
    ? (result.correctAnswers / result.totalQuestions) * 100
    : 0;
  const performanceLevel = getPerformanceLevel(scorePercentage);
  const pointerPosition = calculatePointerPosition(scorePercentage);
  const difficultyLabel = result.difficulty
    ? `${result.difficulty.charAt(0).toUpperCase()}${result.difficulty.slice(1)}`
    : "Medium";

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

  // Helper to guess subject from topic
  const guessSubjectFromTopic = (topic?: string): string => {
    if (!topic) return "Subject";
    const t = topic.toLowerCase();
    if (t.includes("math")) return "Maths";
    if (t.includes("science")) return "Science";
    if (t.includes("english") || t.includes("grammar")) return "English";
    if (t.includes("evs")) return "EVS";
    if (t.includes("bio") || t.includes("plant") || t.includes("food")) return "Science";
    if (t.includes("motion") || t.includes("law")) return "Science";
    return "Subject";
  };

  // Map performance to a friendly message and percentile estimate
  const getMessageForPerformance = (level: string) => {
    switch (level) {
      case "EXCELLENT":
        return { headline: "Great Job!!", betterThan: 90 };
      case "GOOD":
        return { headline: "Great Job!!", betterThan: 70 };
      case "FAIR":
        return { headline: "Nice Try!", betterThan: 40 };
      default:
        return { headline: "Keep Going!", betterThan: 10 };
    }
  };

  const { headline, betterThan } = getMessageForPerformance(performanceLevel);

  return (
    <div className="min-h-screen w-full px-4 md:px-10 lg:px-12 py-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-black mb-2">Assessment report</h2>
        <div className="text-black mb-6">
          {result.quizTitle} • Difficulty - {difficultyLabel}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Result Card */}
          <div className="rounded-2xl p-8 shadow-lg bg-gradient-to-b from-orange-50 to-orange-100 relative">
            <div className="flex flex-col items-center mt-8">
              <div className="relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 text-xl font-semibold text-black z-10">Your Result</div>
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-b from-orange-300 via-orange-400 to-rose-500 flex items-center justify-center shadow-inner mt-6">
                  <div className="text-white text-4xl sm:text-5xl font-bold">{Math.round(scorePercentage)}%</div>
                </div>
              </div>
              <div className="mt-6 text-2xl font-semibold text-[#ff4d4f]">{headline}</div>
              <p className="mt-4 text-center text-gray-700 max-w-md">
                You received a score of <span className="font-semibold text-black">{result.correctAnswers}</span>
                /{result.totalQuestions}. You performed better than {betterThan}% of all others that have taken this quiz.
              </p>
              <button
                className="mt-6 bg-red-500 text-white cursor-pointer px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
                onClick={() => {
                  const quizId = Array.isArray(id) ? id[0] : id;
                  if (quizId && submissionId) {
                    router.push(`/quizes/${quizId}/answers?submissionId=${submissionId}`);
                  }
                }}
              >
                Review answers <span role="img" aria-label="eye">👁️</span>
              </button>
            </div>
          </div>

          {/* Right: Recommended Quizzes */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-2xl font-bold text-black mb-6">Recommended quizzes</div>
            {suggestedLoading ? (
              <div className="text-black">Loading recommended quizzes...</div>
            ) : suggestedQuizzes.length === 0 ? (
              <div className="text-black">No recommended quizzes available.</div>
            ) : (
              <div className="space-y-4 max-h-[29rem] overflow-auto pr-2" style={{ scrollbarWidth: "thin" } as React.CSSProperties}>
                {suggestedQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-start justify-between gap-4 border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
                      <div className="min-w-0">
                        <div className="text-black font-semibold truncate">{quiz.title}</div>
                        <div className="text-sm text-gray-600 truncate">
                          {quiz.topic} • {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)} • {quiz.totalQuestions} questions
                        </div>
                      </div>
                    </div>
                    <button
                      className="flex-shrink-0 bg-gradient-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer"
                      onClick={() => router.push(`/quizes/${quiz.id}/start`)}
                    >
                      Start Quiz
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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