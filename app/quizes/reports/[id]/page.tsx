"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import axios, { redirectToLogin } from '@/lib/axiosInstance';

type UploadedFile = {
  id: string;
  fileName: string;
  fileUrl: string;
  summary?: string;
};

type QuizResult = {
  quizTitle: string;
  difficulty?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  uploadedFiles?: UploadedFile[];
  quizId?: string;
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
        const response = await axios.get(`/users/quiz/result?submissionId=${submissionId}`);
        const data = response.data;
        if (data.success && data.data && data.data.result) {
          let resultData = data.data.result;

          // Check for uploadedFiles from sessionStorage if not in API response
          if (!resultData.uploadedFiles && submissionId) {
            const storedFiles = sessionStorage.getItem(`quiz_uploaded_files_${submissionId}`);
            if (storedFiles) {
              try {
                resultData = { ...resultData, uploadedFiles: JSON.parse(storedFiles) };
              } catch (e) {
                console.error('Error parsing stored uploaded files:', e);
              }
            }
          }

          setResult(resultData);
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

  useEffect(() => {
    async function fetchSuggestedQuizzes() {
      setSuggestedLoading(true);
      try {
        const response = await axios.get('/users/quiz/suggested');
        const data = response.data;
        if (data.success && data.data && data.data.quizzes) {
          setSuggestedQuizzes(data.data.quizzes);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          redirectToLogin();
        } else {
          console.error('Error fetching suggested quizzes:', error);
        }
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

        {/* Uploaded Answer Files Section */}
        {result.uploadedFiles && result.uploadedFiles.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-black mb-4">Uploaded Answer Files</h3>
            <div className="space-y-6">
              {result.uploadedFiles.map((file, idx) => (
                <div key={file.id || idx} className="bg-white border border-gray-200 rounded-xl p-6">
                  {/* File Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                        {file.fileName.toLowerCase().endsWith('.pdf') ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                            <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{file.fileName}</div>
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-amber-600 hover:underline"
                        >
                          View Original File
                        </a>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Analyzed
                    </span>
                  </div>

                  {/* AI Summary */}
                  {file.summary && (
                    <div className="prose prose-sm max-w-none">
                      <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        AI Analysis Summary
                      </div>
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        {/* Parse and render the markdown-like summary */}
                        <div className="text-gray-700 leading-relaxed space-y-4">
                          {file.summary.split('\n').map((line, lineIdx) => {
                            // Handle headers
                            if (line.startsWith('# ')) {
                              return <h2 key={lineIdx} className="text-xl font-bold text-gray-900 mt-4 first:mt-0">{line.replace('# ', '')}</h2>;
                            }
                            if (line.startsWith('## ')) {
                              return <h3 key={lineIdx} className="text-lg font-semibold text-gray-800 mt-4">{line.replace('## ', '')}</h3>;
                            }
                            if (line.startsWith('### ')) {
                              return <h4 key={lineIdx} className="text-base font-semibold text-gray-700 mt-3">{line.replace('### ', '')}</h4>;
                            }
                            // Handle bold text with **
                            if (line.includes('**')) {
                              const parts = line.split(/\*\*(.*?)\*\*/);
                              return (
                                <p key={lineIdx} className="text-sm">
                                  {parts.map((part, partIdx) =>
                                    partIdx % 2 === 1
                                      ? <strong key={partIdx} className="font-semibold text-gray-900">{part}</strong>
                                      : part
                                  )}
                                </p>
                              );
                            }
                            // Handle list items
                            if (line.trim().startsWith('- ')) {
                              return (
                                <div key={lineIdx} className="flex items-start gap-2 text-sm ml-2">
                                  <span className="text-amber-600 mt-1.5">•</span>
                                  <span>{line.replace(/^\s*-\s*/, '')}</span>
                                </div>
                              );
                            }
                            // Regular paragraph (skip empty lines)
                            if (line.trim()) {
                              return <p key={lineIdx} className="text-sm">{line}</p>;
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
