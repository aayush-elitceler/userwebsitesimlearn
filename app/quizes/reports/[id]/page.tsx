"use client";
import React, { useEffect, useState } from "react";
import {  useParams } from "next/navigation";
import ReactSpeedometer, { Transition, CustomSegmentLabelPosition } from "react-d3-speedometer";

type QuizResult = {
  quizTitle: string;
  difficulty?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  // ...add other fields as needed
};

export default function QuizReportPage() {
  const { id } = useParams();
  const submissionId = id;
  const [result, setResult] = useState<QuizResult | null>(null);
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

  if (loading) return <div className="text-black p-8">Loading...</div>;
  if (!result) return <div className="text-black p-8">Result not found.</div>;

  // Calculate performance, etc. as needed

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-black mb-2">Assessment report</h2>
        <div className="text-black mb-2">
          {result.quizTitle} &nbsp; • &nbsp; Difficulty - {result.difficulty || "N/A"}
        </div>
        <div className="text-black mb-4">
          You received a score of <span className="text-yellow-400 font-bold">{result.score / 20}</span> / {result.totalQuestions}.
          {/* Example: */}
          <span className="ml-2">you performed better than <span className="font-bold">10%</span> of all others that have taken this quiz</span>
        </div>
        <div className="flex items-center gap-4 mb-8">
          <select className="bg-white text-black px-4 py-2 rounded font-semibold">
            <option>Attempt #1</option>
            {/* Add more attempts if available */}
          </select>
          <button
            className="point-ask-gradient text-white cursor-pointer px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
            onClick={() => {
              window.location.href = `/quizes/${id}/answers?submissionId=${submissionId}`;
            }}
          >
            Review answers <span role="img" aria-label="eye">👁️</span>
          </button>
        </div>
        {/* Gauge/Performance meter here */}
        <div className="flex justify-center mb-8">
          <ReactSpeedometer
            minValue={0}
            maxValue={100}
            value={result.totalQuestions > 0 ? (result.score / (result.totalQuestions * 20)) * 100 : 0}
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
        {/* Recommended quizzes section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-black mb-4">Recommended quizzes</h3>
          <div className="flex gap-6 flex-wrap">
            <div className="bg-white rounded-xl p-6 w-64">
              <div className="text-text-black font-semibold mb-1">Difficulty: Easy</div>
              <div className="text-xl font-bold text-black mb-2">Tables Level 5</div>
              <div className="text-black mb-2">Questions: 5 • 10 mins • Mr. Sharma</div>
              <div className="point-ask-gradient text-white rounded-lg px-4 py-2 text-center font-semibold">Maths</div>
            </div>
            <div className="bg-white rounded-xl p-6 w-64">
              <div className="text-text-black font-semibold mb-1">Difficulty: Hard</div>
              <div className="text-xl font-bold text-black mb-2">Grammer - Vowels</div>
              <div className="text-black mb-2">Questions: 5 • 10 mins • Mr. Sharma</div>
              <div className="point-ask-gradient text-white rounded-lg px-4 py-2 text-center font-semibold">English</div>
            </div>
            {/* Add more cards as needed */}
          </div>
        </div>
        {/* ...other UI, recommended quizzes, etc... */}
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