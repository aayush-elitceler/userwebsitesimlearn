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
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-gray-100">
      <div className="max-w-3xl mx-auto">
        {/* Header with cache status and refresh button */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-black mb-2">Assessment report</h2>
          
          </div>
          <button
            onClick={handleRefreshReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFB121] text-white rounded-lg hover:bg-[#FFB121] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>{loading ? 'Refreshing...' : 'Refresh Report'}</span>
          </button>
        </div>
        
        <div className="text-black mb-2">
          {result.exam.title} &nbsp; • &nbsp; Difficulty - {result.exam.difficulty || "N/A"}
        </div>
        <div className="text-black mb-4">
          You received a score of <span className="text-black ">{result.score}</span> / {totalPossibleMarks} ({result.totalQuestions} questions).
        </div>
        
        {/* Score Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Score Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Total Score:</span>
              <span className="ml-2 font-bold text-green-600">{result.score}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total Possible:</span>
              <span className="ml-2 font-bold text-green-600">{totalPossibleMarks}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Percentage:</span>
              <span className="ml-2 font-bold text-green-600">{Math.round(scorePercentage)}%</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Performance:</span>
              <span className="ml-2 font-bold text-green-600">{performanceLevel}</span>
            </div>
          </div>
        </div>
        
        {/* Overall Feedback */}
        {result.overallFeedback && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Overall Feedback</h3>
            <div className="text-blue-700 whitespace-pre-line">{result.overallFeedback}</div>
            
          </div>
        )}
        
        {/* Custom Assessment Indicator */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <svg width="373" height="207" viewBox="0 0 373 207" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.2">
                <path d="M318.061 54.4395L274.198 98.3021L230.336 142.164C241.578 153.379 248.501 168.859 248.501 185.999H310.501H372.501C372.501 134.577 351.705 88.0839 318.061 54.4395Z" fill="url(#paint0_linear_1306_119905)"/>
                <path d="M186.5 0V62V124C203.641 124 219.12 130.923 230.335 142.166L274.197 98.3032L318.06 54.4406C284.415 20.7959 237.922 0 186.5 0Z" fill="url(#paint1_linear_1306_119905)"/>
                <path d="M54.9414 54.4404L98.8038 98.303L142.639 142.165H142.666C153.881 130.923 169.361 124 186.501 124V62V0C135.079 0 88.5859 20.7959 54.9414 54.4404Z" fill="url(#paint2_linear_1306_119905)"/>
                <path d="M98.8027 98.3021L54.9404 54.4395C21.2959 88.0839 0.5 134.577 0.5 185.999H62.5H124.5C124.5 168.859 131.423 153.379 142.638 142.165L98.8027 98.3021Z" fill="url(#paint3_linear_1306_119905)"/>
              </g>
              <path d="M289.115 83.3867L254.903 117.599L220.691 151.81C229.46 160.558 234.86 172.631 234.86 186H283.219H331.577C331.577 145.893 315.357 109.629 289.115 83.3867Z" fill="url(#paint4_linear_1306_119905)"/>
              <path d="M186.504 40.9238V89.2826V137.641C199.874 137.641 211.947 143.041 220.694 151.81L254.906 117.598L289.117 83.3861C262.876 57.144 226.612 40.9238 186.504 40.9238Z" fill="url(#paint5_linear_1306_119905)"/>
              <path d="M83.8867 83.3861L118.098 117.598L152.289 151.81H152.31C161.058 143.041 173.131 137.641 186.5 137.641V89.2826V40.9238C146.393 40.9238 110.129 57.144 83.8867 83.3861Z" fill="url(#paint6_linear_1306_119905)"/>
              <path d="M118.1 117.599L83.888 83.3867C57.6459 109.629 41.4258 145.893 41.4258 186.001H89.7845H138.143C138.143 172.631 143.543 160.558 152.29 151.811L118.1 117.599Z" fill="url(#paint7_linear_1306_119905)"/>
              
              {/* Dynamic Pointer */}
              <g transform={`rotate(${pointerPosition * 1.8 - 150}, 186.5, 186)`}>
                <path d="M182.52 177.195L277.974 132.729C278.986 132.25 279.915 133.757 278.896 134.402L190.363 191.415C180.459 197.21 172.3 182.522 182.52 177.195Z" fill="#1D3B63"/>
                <path d="M175.202 165.678C185.492 159.48 198.863 162.782 205.069 173.072C207.307 176.787 208.306 180.891 208.186 184.929C207.977 192.072 204.25 198.97 197.678 202.924C187.394 209.14 174.021 205.832 167.814 195.542C161.607 185.258 164.919 171.894 175.202 165.678Z" fill="#1D3B63"/>
                <path d="M180.783 174.928C185.962 171.808 192.692 173.471 195.816 178.65C196.942 180.52 197.446 182.585 197.385 184.618C197.28 188.214 195.404 191.686 192.096 193.676C186.92 196.805 180.188 195.14 177.064 189.96C173.94 184.784 175.606 178.057 180.783 174.928Z" fill="white"/>
              </g>
              
              <defs>
                <linearGradient id="paint0_linear_1306_119905" x1="301.418" y1="188.432" x2="301.418" y2="153.798" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00963A"/>
                  <stop offset="0.1576" stopColor="#06A541"/>
                  <stop offset="0.4706" stopColor="#0FBD4B"/>
                  <stop offset="0.7597" stopColor="#14CC52"/>
                  <stop offset="1" stopColor="#16D154"/>
                </linearGradient>
                <linearGradient id="paint1_linear_1306_119905" x1="268.588" y1="105.189" x2="238.359" y2="75.5772" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFAC05"/>
                  <stop offset="0.1821" stopColor="#FFBE10"/>
                  <stop offset="0.494" stopColor="#FFD820"/>
                  <stop offset="0.776" stopColor="#FFE82A"/>
                  <stop offset="1" stopColor="#FFED2D"/>
                </linearGradient>
                <linearGradient id="paint2_linear_1306_119905" x1="185.822" y1="71.0827" x2="139.538" y2="71.0827" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF4D05"/>
                  <stop offset="0.2771" stopColor="#FF6E16"/>
                  <stop offset="0.5535" stopColor="#FF8822"/>
                  <stop offset="0.8024" stopColor="#FF982A"/>
                  <stop offset="1" stopColor="#FF9D2D"/>
                </linearGradient>
                <linearGradient id="paint3_linear_1306_119905" x1="104.13" y1="103.358" x2="83.1554" y2="127.417" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF0508"/>
                  <stop offset="0.0461" stopColor="#FF0C0B"/>
                  <stop offset="0.3221" stopColor="#FF2F1A"/>
                  <stop offset="0.5813" stopColor="#FF4924"/>
                  <stop offset="0.8147" stopColor="#FF592B"/>
                  <stop offset="1" stopColor="#FF5E2D"/>
                </linearGradient>
                <linearGradient id="paint4_linear_1306_119905" x1="276.134" y1="187.898" x2="276.134" y2="160.884" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00963A"/>
                  <stop offset="0.1576" stopColor="#06A541"/>
                  <stop offset="0.4706" stopColor="#0FBD4B"/>
                  <stop offset="0.7597" stopColor="#14CC52"/>
                  <stop offset="1" stopColor="#16D154"/>
                </linearGradient>
                <linearGradient id="paint5_linear_1306_119905" x1="250.531" y1="122.969" x2="226.953" y2="99.8723" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFAC05"/>
                  <stop offset="0.1821" stopColor="#FFBE10"/>
                  <stop offset="0.494" stopColor="#FFD820"/>
                  <stop offset="0.776" stopColor="#FFE82A"/>
                  <stop offset="1" stopColor="#FFED2D"/>
                </linearGradient>
                <linearGradient id="paint6_linear_1306_119905" x1="185.971" y1="96.3667" x2="149.87" y2="96.3667" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF4D05"/>
                  <stop offset="0.2771" stopColor="#FF6E16"/>
                  <stop offset="0.5535" stopColor="#FF8822"/>
                  <stop offset="0.8024" stopColor="#FF982A"/>
                  <stop offset="1" stopColor="#FF9D2D"/>
                </linearGradient>
                <linearGradient id="paint7_linear_1306_119905" x1="122.255" y1="121.542" x2="105.895" y2="140.308" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF0508"/>
                  <stop offset="0.0461" stopColor="#FF0C0B"/>
                  <stop offset="0.3221" stopColor="#FF2F1A"/>
                  <stop offset="0.5813" stopColor="#FF4924"/>
                  <stop offset="0.8147" stopColor="#FF592B"/>
                  <stop offset="1" stopColor="#FF5E2D"/>
                </linearGradient>
              </defs>
            </svg>
            
            {/* Performance Level Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-2xl font-bold text-black mb-2">{performanceLevel}</div>
              <div className="text-lg text-gray-600">{Math.round(scorePercentage)}%</div>
            </div>
          </div>
        </div>
        
        {/* Show questions and student answers with grading feedback */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-black mb-4">Your Answers & Feedback</h3>
          {result.exam.questions.map((q, idx) => (
            <div key={idx} className="mb-8 bg-white rounded-lg p-6 shadow-sm">
              <div className="text-black font-semibold mb-3 text-lg">
                Q{idx + 1}. {q.questionText} {q.marks ? `(${q.marks} marks)` : ""}
              </div>
              
              {/* Student Answer */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Answer:</h4>
                <div className="bg-[#FFB12133] text-black rounded p-4 min-h-[60px]">
                  {q.studentAnswer || <span className="italic text-gray-500">No answer provided</span>}
                </div>
              </div>
              
              {/* Grading Feedback */}
              {q.gradingResult && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Feedback:</h4>
                    <span className="text-sm font-bold text-blue-600">
                      Score: {q.gradingResult.score}/{q.marks || 0}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-4 mb-3">
                    <p className="text-gray-800 mb-3">{q.gradingResult.feedback}</p>
                    
                    {/* Strengths */}
                    {q.gradingResult.strengths && q.gradingResult.strengths.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-semibold text-green-700 mb-1">Strengths:</h5>
                        <ul className="list-disc list-inside text-sm text-green-600">
                          {q.gradingResult.strengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Areas for Improvement */}
                    {q.gradingResult.areasForImprovement && q.gradingResult.areasForImprovement.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-semibold text-orange-700 mb-1">Areas for Improvement:</h5>
                        <ul className="list-disc list-inside text-sm text-orange-600">
                          {q.gradingResult.areasForImprovement.map((area, i) => (
                            <li key={i}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Key Points */}
                    {q.gradingResult.keyPoints && q.gradingResult.keyPoints.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-semibold text-red-700 mb-1">Key Points:</h5>
                        <ul className="list-disc list-inside text-sm text-red-600">
                          {q.gradingResult.keyPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {q.gradingResult.suggestions && (
                      <div>
                        <h5 className="text-sm font-semibold text-green-500 mb-1">Suggestions:</h5>
                        {Array.isArray(q.gradingResult.suggestions) ? (
                          <ul className="list-disc list-inside text-sm text-green-400">
                            {q.gradingResult.suggestions.map((suggestion, i) => (
                              <li key={i}>{suggestion}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-green-400">{q.gradingResult.suggestions}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
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