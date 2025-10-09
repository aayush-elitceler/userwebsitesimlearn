"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios, { redirectToLogin } from '@/lib/axiosInstance';

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
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    examType: "Questions & Answers",
    level: "medium",
    questionType: "both",
    quizCount: 5,
    quizMarks: 1,
    quizTimer: 20, // Timer in minutes for quiz
    longCount: 3,
    longMarks: 5,
    shortCount: 2,
    shortMarks: 2,
  });
  const [loading, setLoading] = useState(false);

  // Auto-populate form from URL params (but don't auto-generate)
  useEffect(() => {
    const subject = searchParams.get('subject');
    const concept = searchParams.get('concept');

    if (subject && concept) {
      const formattedTopic = concept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setForm(prev => ({
        ...prev,
        subject: subject,
        topic: formattedTopic
      }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Build the questionConfig object
    let questionConfig: QuestionConfig;
    if (form.questionType === "quiz") {
      // Map quiz to short for API compatibility
      questionConfig = {
        questionType: "short",
        config: {
          count: Number(form.quizCount),
          marksPerQuestion: Number(form.quizMarks),
        },
      };
    } else if (form.questionType === "long" || form.questionType === "short") {
      questionConfig = {
        questionType: form.questionType,
        config: {
          count:
            form.questionType === "long"
              ? Number(form.longCount)
              : Number(form.shortCount),
          marksPerQuestion:
            form.questionType === "long"
              ? Number(form.longMarks)
              : Number(form.shortMarks),
        },
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
          },
        },
      };
    }

    const body = {
      subject: form.subject,
      topic: form.topic,
      examType: form.examType,
      level: form.level,
      questionType: form.questionType === "quiz" ? "short" : form.questionType, // Map quiz to short for API
      questionConfig,
    };

    console.log('🚀 Sending to API:', JSON.stringify(body, null, 2));

    try {
      const { token, user } = getAuthFromCookie();
      
      if (form.questionType === "quiz") {
        // Use quiz API for quiz questions
        const quizBody = {
          grade: user?.class || "8", // Get grade from user cookie or default to "8"
          persona: "teacher",
          topic: `make a quiz on ${form.topic} for ${form.subject}`,
          difficulty: form.level,
          timer: Number(form.quizTimer), // Use timer from form
          numQuestions: Number(form.quizCount)
        };

        console.log('🎯 Sending Quiz API request:', JSON.stringify(quizBody, null, 2));

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/ai/quiz`,
          quizBody,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (response.data.success) {
          console.log('🎯 Quiz Generated:', response.data);

          const quizId = response.data.data?.quiz?.id;
          if (quizId) {
            // Navigate to quiz start page using the correct pattern
            router.push(`/quizes/${quizId}/start`);
          } else {
            router.push("/quizes");
          }
        } else {
          throw new Error(response.data.message || 'Failed to create quiz');
        }
      } else {
        // Use existing exam API for long/short questions
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/exams/generate`,
          body,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (response.data.success) {
          console.log('📝 Exam Generated:', response.data);

          const examId = response.data.data?.exam?.id || response.data.data?.id;
          if (examId) {
            router.push(`/exams/start/${examId}`);
          } else {
            router.push("/exams");
          }
        } else {
          throw new Error(response.data.message || "Failed to create exam");
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        redirectToLogin();
        return;
      }

      console.error('Error creating exam:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        alert(`Failed to create exam: ${errorMessage}`);
      } else {
        alert("Failed to create exam");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {loading ? (
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Generating your practice questions...</p>
          <p className='text-sm text-muted-foreground mt-2'>This may take a few moments</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-3xl p-10 w-full max-w-3xl shadow-lg"
        >
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Create Practice Sets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-foreground mb-2">Topic</label>
            <input
              name="topic"
              value={form.topic}
              onChange={handleChange}
              className="w-full p-3 rounded bg-muted text-foreground"
              placeholder="e.g. Fractions, Photosynthesis"
              required
            />
          </div>
          <div>
            <label className="block text-foreground mb-2">Difficulty</label>
            <select
              name="level"
              value={form.level}
              onChange={handleChange}
              className="w-full p-3 rounded bg-muted text-foreground"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-foreground mb-2">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full p-3 rounded bg-muted text-foreground"
              placeholder="e.g. Math, Science, EVS, English"
              required
            />
          </div>
          <div>
            <label className="block text-foreground mb-2">Question Type</label>
            <div className="flex gap-2">
              {[
                { value: "quiz", label: "Quiz" },
                { value: "short", label: "Short Answers" },
                { value: "long", label: "Long Answers" },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, questionType: type.value })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    form.questionType === type.value
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          {form.questionType === "quiz" && (
            <>
              <div>
                <label className="block text-foreground mb-2">
                  No. of Quiz Questions
                </label>
                <input
                  name="quizCount"
                  type="number"
                  min={1}
                  max={20}
                  value={form.quizCount}
                  onChange={handleChange}
                  className="w-full p-3 rounded bg-muted text-foreground"
                />
              </div>
              <div>
                <label className="block text-foreground mb-2">
                  Timer (Minutes)
                </label>
                <input
                  name="quizTimer"
                  type="number"
                  min={5}
                  max={60}
                  value={form.quizTimer}
                  onChange={handleChange}
                  className="w-full p-3 rounded bg-muted text-foreground"
                />
              </div>
            </>
          )}
          {(form.questionType === "long" || form.questionType === "both") && (
            <>
              <div>
                <label className="block text-foreground mb-2">
                  No. of Long Questions
                </label>
                <input
                  name="longCount"
                  type="number"
                  min={0}
                  value={form.longCount}
                  onChange={handleChange}
                  className="w-full p-3 rounded bg-muted text-foreground"
                />
              </div>
              <div>
                <label className="block text-foreground mb-2">
                  Marks per Long Question
                </label>
                <input
                  name="longMarks"
                  type="number"
                  min={1}
                  value={form.longMarks}
                  onChange={handleChange}
                  className="w-full p-3 rounded bg-muted text-foreground"
                />
              </div>
            </>
          )}
          {(form.questionType === "short" || form.questionType === "both") && (
            <>
              <div>
                <label className="block text-foreground mb-2">
                  No. of Short Questions
                </label>
                <input
                  name="shortCount"
                  type="number"
                  min={0}
                  value={form.shortCount}
                  onChange={handleChange}
                  className="w-full p-3 rounded bg-muted text-foreground"
                />
              </div>
              <div>
                <label className="block text-foreground mb-2">
                  Marks per Short Question
                </label>
                <input
                  name="shortMarks"
                  type="number"
                  min={1}
                  value={form.shortMarks}
                  onChange={handleChange}
                  className="w-full p-3 rounded bg-muted text-foreground"
                />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            className="px-6 py-3 rounded-lg border border-border text-foreground"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-gradient-primary cursor-pointer text-primary-foreground font-semibold"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Practice Sets"}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}

// Utility to get token and user data from 'auth' cookie
function getAuthFromCookie() {
  if (typeof document === "undefined") return { token: null, user: null };
  const match = document.cookie.match(/(?:^|; )auth=([^;]*)/);
  if (!match) return { token: null, user: null };
  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);
    return { token: parsed.token, user: parsed.user };
  } catch {
    return { token: null, user: null };
  }
}
