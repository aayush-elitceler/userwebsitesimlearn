"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

type QuestionConfig =
  | {
      questionType: "long" | "short";
      config: {
        count: number;
        marksPerQuestion: number;
      };
    }
  | {
      questionType: "both";
      config: {
        long: {
          count: number;
          marksPerQuestion: number;
        };
        short: {
          count: number;
          marksPerQuestion: number;
        };
      };
    };

export default function CreateExamPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    examType: "Questions & Answers",
    level: "medium",
    questionType: "both",
    longCount: 0,
    longMarks: 5,
    shortCount: 0,
    shortMarks: 2,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Build the questionConfig object
    let questionConfig: QuestionConfig;
    if (form.questionType === "long" || form.questionType === "short") {
      questionConfig = {
        questionType: form.questionType,
        config: {
          count: form.questionType === "long" ? Number(form.longCount) : Number(form.shortCount),
          marksPerQuestion: form.questionType === "long" ? Number(form.longMarks) : Number(form.shortMarks),
        }
      };
    } else {
      questionConfig = {
        questionType: "both",
        config: {
          long: {
            count: Number(form.longCount),
            marksPerQuestion: Number(form.longMarks),
          },
          short: {
            count: Number(form.shortCount),
            marksPerQuestion: Number(form.shortMarks),
          }
        }
      };
    }

    const body = {
      subject: form.subject,
      topic: form.topic,
      examType: form.examType,
      level: form.level,
      questionType: form.questionType,
      questionConfig,
    };

    try {
      const token = getTokenFromCookie();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/exams/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // Success: redirect or show message
        const data = await res.json();
        console.log(data);
        
        const examId = data.data?.exam?.id || data.data?.id;
        if (examId) {
          router.push(`/exams/start/${examId}`);
        } else {
          router.push("/exams");
        }
      } else {
        alert("Failed to create exam");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181c24]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#232c24] rounded-3xl p-10 w-full max-w-3xl shadow-lg"
      >
        <h2 className="text-3xl font-bold text-white mb-6">Create Exam</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white mb-2">Topic</label>
            <input
              name="topic"
              value={form.topic}
              onChange={handleChange}
              className="w-full p-3 rounded bg-[#181c24] text-white"
              placeholder="e.g. Fractions, Photosynthesis"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-2">Difficulty</label>
            <select
              name="level"
              value={form.level}
              onChange={handleChange}
              className="w-full p-3 rounded bg-[#181c24] text-white"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-white mb-2">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full p-3 rounded bg-[#181c24] text-white"
              placeholder="e.g. Math, Science, EVS, English"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-2">Question Type</label>
            <select
              name="questionType"
              value={form.questionType}
              onChange={handleChange}
              className="w-full p-3 rounded bg-[#181c24] text-white"
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
              <option value="both">Both</option>
            </select>
          </div>
          {(form.questionType === "long" || form.questionType === "both") && (
            <>
              <div>
                <label className="block text-white mb-2">No. of Long Questions</label>
                <input
                  name="longCount"
                  type="number"
                  min={0}
                  value={form.longCount}
                  onChange={handleChange}
                  className="w-full p-3 rounded bg-[#181c24] text-white"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Marks per Long Question</label>
                <input
                  name="longMarks"
                  type="number"
                  min={1}
                  value={form.longMarks}
                  onChange={handleChange}
                  className="w-full p-3 rounded bg-[#181c24] text-white"
                />
              </div>
            </>
          )}
          {(form.questionType === "short" || form.questionType === "both") && (
            <>
              <div>
                <label className="block text-white mb-2">No. of Short Questions</label>
                <input
                  name="shortCount"
                  type="number"
                  min={0}
                  value={form.shortCount}
                  onChange={handleChange}
                  className="w-full p-3 rounded bg-[#181c24] text-white"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Marks per Short Question</label>
                <input
                  name="shortMarks"
                  type="number"
                  min={1}
                  value={form.shortMarks}
                  onChange={handleChange}
                  className="w-full p-3 rounded bg-[#181c24] text-white"
                />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            className="px-6 py-3 rounded-lg border border-white text-white"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-[#0E7C42] cursor-pointer text-white font-semibold"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create exam"}
          </button>
        </div>
      </form>
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