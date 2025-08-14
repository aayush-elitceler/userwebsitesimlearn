"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

  if (loading) return <div className="text-black p-8">Loading...</div>;
  if (!result) return <div className="text-black p-8">Result not found.</div>;

  // Calculate score percentage
  const scorePercentage = result.totalQuestions > 0 ? (result.score / (result.totalQuestions * 20)) * 100 : 0;
  const performanceLevel = getPerformanceLevel(scorePercentage);
  const pointerPosition = calculatePointerPosition(scorePercentage);

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

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Assessment Report Section */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-bold text-black mb-2">Assessment report</h2>
          <div className="text-black mb-2">
            {result.quizTitle} • Difficulty - {result.difficulty?.charAt(0).toUpperCase() + result.difficulty?.slice(1) || "Medium"}
          </div>
          <div className="text-black mb-6">
            You received a score of <span className="text-red-500 font-bold">{result.correctAnswers}</span>/{result.totalQuestions}. 
          
          </div>
          
          <div className="flex items-center gap-4 mb-8">
        
                         <button
               className="bg-red-500 text-white cursor-pointer px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
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

                     {/* Custom Gauge Indicator */}
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
                 <g transform={`rotate(${pointerPosition * 1.8 - 160}, 186.5, 186)`}>
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
        </div>

                 {/* Recommended Quizzes Section */}
         <div className="bg-white rounded-2xl p-8 shadow-lg">
           <h3 className="text-2xl font-bold text-black mb-6">Recommended quizzes</h3>
           {suggestedLoading ? (
             <div className="text-black">Loading recommended quizzes...</div>
           ) : suggestedQuizzes.length === 0 ? (
             <div className="text-black">No recommended quizzes available.</div>
           ) : (
             <div className="flex flex-row gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 overflow-x-auto pb-4">
               {suggestedQuizzes.slice(0, 3).map((quiz) => (
                 <div key={quiz.id} className="flex flex-row bg-white border border-[#DEDEDE] items-center 
                     w-[480px] h-[220px] rounded-[15.51px] shadow-[0px_2.15px_16px_0px_#0000002E] flex-shrink-0 p-5
                     sm:w-[500px] sm:h-[230px] sm:p-5
                     md:w-[420px] md:h-[200px] md:p-4
                     lg:w-[480px] lg:h-[220px] lg:p-5
                     xl:w-[520px] xl:h-[240px] xl:p-6
                     2xl:w-[588px] 2xl:h-[260px] 2xl:p-6">
                   <div className="flex-1 min-w-0 flex flex-col justify-between h-full overflow-hidden">
                     <div className="flex-1 min-h-0">
                       <div className="text-[#626262] text-xs sm:text-sm font-medium mb-1.5">
                         Subject: {guessSubjectFromTopic(quiz.topic)}
                       </div>
                       <div className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-semibold bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-transparent bg-clip-text mb-2 break-words leading-tight">
                         {quiz.title}
                       </div>
                       <div className="text-black text-xs sm:text-sm mb-3 leading-relaxed break-words">
                         {quiz.instructions}
                       </div>
                       <div className="flex items-center gap-2 text-black text-xs sm:text-sm mb-3">
                         <span role="img" aria-label="clock">🕒</span>
                         <span className="break-words">Due date: 10 July 2025</span>
                       </div>
                     </div>
                     <div className="mt-auto pt-1">
                       <button
                         className="bg-gradient-to-r from-[#FFB31F] to-[#FF4949] cursor-pointer text-white rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
                         onClick={() => router.push(`/quizes/${quiz.id}/start`)}
                       >
                         Start Quiz
                       </button>
                     </div>
                   </div>
                   <div className="flex-shrink-0 ml-3 sm:ml-4 lg:ml-5">
                     <div
                       className={`flex items-center justify-center text-white font-bold relative overflow-hidden rounded-[9px] shadow-[0px_0.89px_6.68px_0px_#00000075]
                                   w-[120px] h-[80px] text-sm
                                   sm:w-[130px] sm:h-[85px] sm:text-base
                                   md:w-[110px] md:h-[75px] md:text-sm
                                   lg:w-[140px] lg:h-[95px] lg:text-base
                                   xl:w-[160px] xl:h-[110px] xl:text-lg
                                   2xl:w-[180px] 2xl:h-[120px] 2xl:text-xl ${getSubjectClass(guessSubjectFromTopic(quiz.topic))}`}
                     >
                       <span className="z-10 font-bold tracking-wide text-center px-1.5 break-words">
                         {guessSubjectFromTopic(quiz.topic)}
                       </span>
                       {/* SVG Pattern from Figma */}
                       <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                         <svg width="134" height="133" viewBox="0 0 134 133" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <circle cx="61.3397" cy="72.3504" r="5.11912" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3395" cy="72.3512" r="10.6834" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3393" cy="72.351" r="16.2477" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3391" cy="72.3508" r="21.8119" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3389" cy="72.3506" r="27.3762" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3387" cy="72.3514" r="32.9404" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3385" cy="72.3512" r="38.5047" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3403" cy="72.351" r="44.069" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3401" cy="72.3508" r="49.6332" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3399" cy="72.3506" r="55.1975" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3397" cy="72.3514" r="60.7618" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3395" cy="72.3512" r="66.326" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <circle cx="61.3393" cy="72.351" r="71.8903" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                           <line x1="61.1936" y1="72.784" x2="0.000449386" y2="72.8107" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
                         </svg>
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
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