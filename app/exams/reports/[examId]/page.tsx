"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactSpeedometer, { Transition, CustomSegmentLabelPosition } from "react-d3-speedometer";

type ExamReport = {
  exam: {
    title: string;
    difficulty?: string;
    questions: { questionText: string; studentAnswer?: string }[];
    // ...other fields
  };
  score: number;
  startTime: string;
  endTime: string;
};

export default function ExamReportPage() {
  const { examId } = useParams();
  const [result, setResult] = useState<ExamReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchResult() {
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
          setResult(data.data);
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

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-black mb-2">Assessment report</h2>
        <div className="text-black mb-2">
          {result.exam.title} &nbsp; • &nbsp; Difficulty - {result.exam.difficulty || "N/A"}
        </div>
        <div className="text-black mb-4">
          You received a score of <span className="text-yellow-400 font-bold">{result.score}</span> / {result.exam.questions.length}.
        </div>
        <div className="flex items-center gap-4 mb-8">
          {/* <button
            className="point-ask-gradient text-white cursor-pointer px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
            onClick={() => {}}
          >
            Review answers <span role="img" aria-label="eye">👁️</span>
          </button> */}
        </div>
        {/* Gauge/Performance meter here */}
        <div className="flex justify-center mb-8">
          <ReactSpeedometer
            minValue={0}
            maxValue={100}
            value={result.exam.questions.length > 0 ? (result.score / result.exam.questions.length) * 100 : 0}
            segments={4}
            segmentColors={["#a94442", "#f39c12", "#f1c40f", "#27ae60"]}
            customSegmentLabels={[
              { text: "POOR", position: CustomSegmentLabelPosition.Inside, color: "#fff" },
              { text: "FAIR", position: CustomSegmentLabelPosition.Inside, color: "#fff" },
              { text: "GOOD", position: CustomSegmentLabelPosition.Inside, color: "#fff" },
              { text: "EXCELLENT", position: CustomSegmentLabelPosition.Inside, color: "#fff" },
            ]}
            needleColor="#1abc9c"
            ringWidth={47}
            width={350}
            height={180}
            needleTransitionDuration={2000}
            needleTransition={Transition.easeElastic}
            valueTextFontSize="0px"
            currentValueText=""
          />
        </div>
        {/* Show questions and student answers */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-black mb-4">Your Answers</h3>
          {result.exam.questions.map((q, idx) => (
            <div key={idx} className="mb-6">
              <div className="text-black font-semibold mb-1">Q{idx + 1}. {q.questionText}</div>
              <div className="bg-[#FFB12133] text-gray-200 rounded p-4">{q.studentAnswer || <span className="italic text-gray-400">No answer</span>}</div>
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