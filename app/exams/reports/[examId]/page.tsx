"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type GradingResult = {
  score: number;
  feedback: string;
  strengths?: string[];
  areasForImprovement?: string[];
  suggestions?: string[] | string;
  keyPoints?: string[];
};

type ExamReport = {
  exam: {
    id: string;
    title: string;
    instructions: string;
    timeLimitMinutes: number;
    topic: string;
    difficulty: string;
    createdAt: string;
    teacherId?: string | null;
    userId?: string | null;
    type: string;
    isActive: boolean;
    createdBy: string;
    questions: {
      id: string;
      questionText: string;
      questionType: string;
      marks?: number;
      examId: string;
      options: any[];
      studentAnswer?: string;
      gradingResult?: GradingResult;
    }[];
  };
  score: number;
  totalQuestions: number;
  startTime?: string | null;
  endTime?: string | null;
  overallFeedback?: string;
};

// Cache storage key
const CACHE_KEY_PREFIX = 'exam_report_';

// Cache utility functions
const getCachedReport = (examId: string): ExamReport | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${examId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Check if cache is not older than 24 hours
      const cacheTime = parsed.cacheTime;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (now - cacheTime < oneDay) {
        return parsed.data;
      } else {
        // Remove expired cache
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${examId}`);
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading cached report:', error);
    return null;
  }
};

const setCachedReport = (examId: string, data: ExamReport): void => {
  try {
    const cacheData = {
      data,
      cacheTime: Date.now()
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${examId}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching report:', error);
  }
};

const clearCachedReport = (examId: string): void => {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${examId}`);
  } catch (error) {
    console.error('Error clearing cached report:', error);
  }
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

// Function to get performance level based on score
function getPerformanceLevel(scorePercentage: number): string {
  if (scorePercentage <= 25) return "POOR";
  if (scorePercentage <= 50) return "FAIR";
  if (scorePercentage <= 75) return "GOOD";
  return "EXCELLENT";
}

export default function ExamReportPage() {
  const { examId } = useParams();
  const [result, setResult] = useState<ExamReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    async function fetchResult() {
      setLoading(true);
      setError('');
      
      // First, try to get from cache
      if (examId) {
        const cachedReport = getCachedReport(examId as string);
        if (cachedReport) {
          setResult(cachedReport);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
      }
      
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setError('No auth token found. Please login.');
          setLoading(false);
          return;
        }
        
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/exams/report?examId=${examId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const data = await res.json();
        if (data.success && data.data && data.data.exam) {
          // Cache the report data
          if (examId) {
            setCachedReport(examId as string, data.data);
          }
          setResult(data.data);
          setIsFromCache(false);
        } else {
          setError(data.message || 'Failed to load exam report');
        }
      } catch (e) {
        setError('An error occurred while loading the report');
      } finally {
        setLoading(false);
      }
    }
    
    if (examId) fetchResult();
  }, [examId]);

  const handleRefreshReport = async () => {
    if (!examId) return;
    
    // Clear cache and reload
    clearCachedReport(examId as string);
    setIsFromCache(false);
    setLoading(true);
    setError('');
    
    try {
      const token = getTokenFromCookie();
      if (!token) {
        setError('No auth token found. Please login.');
        setLoading(false);
        return;
      }
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/users/exams/report?examId=${examId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = await res.json();
      if (data.success && data.data && data.data.exam) {
        // Cache the new report data
        setCachedReport(examId as string, data.data);
        setResult(data.data);
        setIsFromCache(false);
      } else {
        setError(data.message || 'Failed to load exam report');
      }
    } catch (e) {
      setError('An error occurred while loading the report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-white flex flex-col items-center">
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-60'>
          <div className='rounded-2xl shadow-lg p-8 min-w-[420px] max-w-[90vw] flex flex-col items-center' style={{
            background: 'linear-gradient(180deg, rgba(255, 159, 39, 0.12) 0%, rgba(255, 81, 70, 0.12) 100%)'
          }}>
            <div className='mb-6'>
              <img 
                src="/images/loadingSpinner.svg" 
                alt="Loading" 
                className='w-24 h-24 animate-spin'
              />
            </div>
            <div className='text-black font-semibold text-lg mb-6'>
              Loading your exam report....
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-gray-100 flex flex-col items-center">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-red-400 font-semibold text-xl mb-4">{error}</div>
          <button
            className="px-6 py-2 rounded bg-gray-700 text-white"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!result) return <div className="text-black p-8">Result not found.</div>;

  // Calculate score percentage with sensible fallbacks
  const totalPossibleMarksRaw = result.exam.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const totalQuestionsCount = result.totalQuestions || result.exam.questions.length || 0;
  const totalPossibleMarks = totalPossibleMarksRaw > 0 ? totalPossibleMarksRaw : (totalQuestionsCount > 0 ? totalQuestionsCount : 0);
  const scorePercentage = totalPossibleMarks > 0 ? (result.score / totalPossibleMarks) * 100 : 0;
  const pointerPosition = calculatePointerPosition(scorePercentage);
  const performanceLevel = getPerformanceLevel(scorePercentage);

  const difficultyLabel = result.exam.difficulty
    ? `${result.exam.difficulty.charAt(0).toUpperCase()}${result.exam.difficulty.slice(1)}`
    : 'Medium';

  const getMessageForPerformance = (level: string) => {
    switch (level) {
      case 'EXCELLENT':
        return { headline: 'Great Job!!', betterThan: 90 };
      case 'GOOD':
        return { headline: 'Great Job!!', betterThan: 70 };
      case 'FAIR':
        return { headline: 'Nice Try!', betterThan: 40 };
      default:
        return { headline: 'Keep Going!', betterThan: 10 };
    }
  };
  const { headline, betterThan } = getMessageForPerformance(performanceLevel);

  // Aggregate feedback across questions for the right-side panel
  const strengths = Array.from(new Set(result.exam.questions.flatMap(q => q.gradingResult?.strengths || [])));
  const areasForImprovement = Array.from(new Set(result.exam.questions.flatMap(q => q.gradingResult?.areasForImprovement || [])));
  const keyPoints = Array.from(new Set(result.exam.questions.flatMap(q => q.gradingResult?.keyPoints || [])));
  const suggestions = Array.from(new Set(result.exam.questions.flatMap(q => {
    const s = q.gradingResult?.suggestions;
    return s ? (Array.isArray(s) ? s : [s]) : [];
  })));

  // Debug logging to understand the scoring
  console.log('Exam Report Debug:', {
    totalScore: result.score,
    totalPossibleMarks,
    scorePercentage,
    questions: result.exam.questions.map(q => ({
      questionText: q.questionText.substring(0, 50) + '...',
      marks: q.marks,
      studentAnswer: q.studentAnswer,
      gradingScore: q.gradingResult?.score
    }))
  });

  return (
    <div className="min-h-screen w-full px-4 md:px-10 lg:px-12 py-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Assessment report</h2>
            <div className="text-black">
              {result.exam.title} • Difficulty - {difficultyLabel}
            </div>
          </div>
          <button
            onClick={handleRefreshReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>{loading ? 'Refreshing...' : 'Refresh Report'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Result Card */}
          <div className="rounded-2xl p-8 shadow-lg bg-gradient-to-b from-orange-50 to-orange-100 relative">
            <div className="flex flex-col items-center mt-8">
              <div className="relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 text-xl font-semibold text-black z-10">Your Result</div>
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-b from-orange-300 via-orange-400 to-rose-500 flex items-center justify-center shadow-inner mt-12">
                  <div className="text-white text-4xl sm:text-5xl font-bold">{Math.round(scorePercentage)}%</div>
                </div>
              </div>
              <div className="mt-6 text-2xl font-semibold text-[#ff4d4f]">{headline}</div>
              <p className="mt-4 text-center text-gray-700 max-w-md">
                You received a score of <span className="font-semibold text-black">{result.score}</span>/{totalPossibleMarks}. You performed better than {betterThan}% of all others that have taken this exam.
              </p>
            </div>
          </div>

          {/* Right: Feedback Panel */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-2xl font-bold text-black mb-6">Feedback</div>
            <div className="space-y-4 max-h-[29rem] overflow-auto pr-2" style={{ scrollbarWidth: 'thin' } as React.CSSProperties}>
              {result.overallFeedback && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Overall</div>
                  <div className="text-gray-700 whitespace-pre-line">{result.overallFeedback}</div>
                </div>
              )}

              {strengths.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Strengths</div>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {strengths.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {areasForImprovement.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Areas for improvement</div>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {areasForImprovement.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {keyPoints.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Key points</div>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {keyPoints.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Suggestions</div>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {suggestions.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Answers & Feedback (Minimal) */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-black mb-4">Your answers & feedback</h3>
          <div className="space-y-4">
            {result.exam.questions.map((q, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="text-black font-medium">
                    Q{idx + 1}. {q.questionText} {q.marks ? `(${q.marks} marks)` : ''}
                  </div>
                  {q.gradingResult && (
                    <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Score {q.gradingResult.score}/{q.marks || 0}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">Your answer</div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3 min-h-[52px] text-gray-800">
                      {q.studentAnswer || <span className="italic text-gray-500">No answer provided</span>}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">Feedback</div>
                    {q.gradingResult ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800">
                        {q.gradingResult.feedback && (
                          <p className="text-sm leading-6">{q.gradingResult.feedback}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          {q.gradingResult.strengths && q.gradingResult.strengths.length > 0 && (
                            <div className="text-xs text-gray-600">
                              <span className="font-semibold text-gray-700">Strengths: </span>
                              <span>{q.gradingResult.strengths.join(', ')}</span>
                            </div>
                          )}
                          {q.gradingResult.areasForImprovement && q.gradingResult.areasForImprovement.length > 0 && (
                            <div className="text-xs text-gray-600">
                              <span className="font-semibold text-gray-700">Improve: </span>
                              <span>{q.gradingResult.areasForImprovement.join(', ')}</span>
                            </div>
                          )}
                          {q.gradingResult.keyPoints && q.gradingResult.keyPoints.length > 0 && (
                            <div className="text-xs text-gray-600">
                              <span className="font-semibold text-gray-700">Key points: </span>
                              <span>{q.gradingResult.keyPoints.join(', ')}</span>
                            </div>
                          )}
                          {q.gradingResult.suggestions && (
                            <div className="text-xs text-gray-600">
                              <span className="font-semibold text-gray-700">Suggestions: </span>
                              <span>{Array.isArray(q.gradingResult.suggestions) ? q.gradingResult.suggestions.join(', ') : q.gradingResult.suggestions}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-500">No feedback provided</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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