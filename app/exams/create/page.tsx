"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios, { redirectToLogin } from '@/lib/axiosInstance';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';

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
    description: "",
    questionType: "both",
    longCount: 0,
    longMarks: 5,
    shortCount: 0,
    shortMarks: 2,
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const loadingStates = [
    { text: 'Analyzing exam requirements...' },
    { text: 'Generating exam questions...' },
    { text: 'Creating answer options...' },
    { text: 'Finalizing your exam...' },
    { text: 'Exam ready!' }
  ];

  const subjectOptions = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Zoology',
    'History',
    'Economics',
    'Civics',
    'Geography',
    'English'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowModal(true);

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

    // Use custom subject if "Custom" is selected, otherwise use selected subject
    const finalSubject = form.subject;

    const body = {
      subject: finalSubject,
      topic: form.topic,
      examType: form.examType,
      level: form.level,
      description: form.description,
      questionType: form.questionType,
      questionConfig,
    };

    try {
      const token = getTokenFromCookie();
      if (!token) {
        redirectToLogin();
        return;
      }
      
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
        // Success: redirect or show message
        console.log(response.data);
        
        const examId = response.data.data?.exam?.id || response.data.data?.id;
        if (examId) {
          router.push(`/exams/take/${examId}`);
        } else {
          router.push("/exams");
        }
      } else {
        setError(response.data.message || 'Failed to create exam');
        setShowModal(false);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        redirectToLogin();
        return;
      }

      console.log(err);
      setError('An error occurred. Please try again.');
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-white flex flex-col items-center">
      {/* Multi-step Loader */}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={loading}
        duration={9500}
      />

      {/* Success Modal */}
      {!loading && !error && showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-60'>
          <div className='rounded-2xl shadow-lg p-8 min-w-[420px] max-w-[90vw] flex flex-col items-center' style={{
            background: 'linear-gradient(180deg, rgba(255, 159, 39, 0.12) 0%, rgba(255, 81, 70, 0.12) 100%)'
          }}>
            <div className='text-black text-2xl font-bold mb-2'>
              Exam created!
            </div>
            <div className='text-black mb-6'>
              Your exam has been generated successfully.
            </div>
            <button
              className='bg-gradient-primary text-primary-foreground cursor-pointer rounded-lg px-8 py-3 font-semibold shadow hover:opacity-90 hover:scale-105 transition-all duration-200'
              onClick={() => {
                setShowModal(false);
                router.push("/exams");
              }}
            >
              Start Exam
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && !loading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-60'>
          <div className='rounded-2xl shadow-lg p-8 min-w-[420px] max-w-[90vw] flex flex-col items-center' style={{
            background: 'linear-gradient(180deg, rgba(255, 159, 39, 0.12) 0%, rgba(255, 81, 70, 0.12) 100%)'
          }}>
            <div className='text-red-400 font-semibold mb-4'>{error}</div>
            <button
              className='mt-2 px-6 py-2 rounded bg-gray-700 text-black'
              onClick={() => setError('')}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
  <div className='max-w-4xl w-full bg-gray-100 rounded-2xl shadow-lg p-8 relative z-10'>
        <h2 className='text-2xl font-bold text-black mb-2'>Create Exam</h2>
        <hr className='border-gray-600 mb-6' />
        <form
          onSubmit={handleSubmit}
          className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'
        >
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Topic</label>
            <input
              name="topic"
              value={form.topic}
              onChange={handleChange}
              className='rounded px-3 py-2 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200'
              placeholder="e.g. Fractions, Photosynthesis"
              required
            />
          </div>

          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className='rounded px-3 py-2 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200 resize-none'
              placeholder="Enter a description for your exam (optional)"
              rows={3}
            />
          </div>

          <div className='flex flex-col'>
            <label htmlFor="level" className='text-black mb-1 font-semibold'>Difficulty</label>
            <div className='relative'>
              <select
                id="level"
                name="level"
                value={form.level}
                onChange={handleChange}
                className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-red-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
          </div>
          
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Subject</label>
            <div className='relative'>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className='w-full rounded px-3 py-2 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200 appearance-none cursor-pointer pr-8'
                required
              >
                <option value="">Select a subject</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-4 h-4 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
          </div>
          
          <div className='flex flex-col'>
            <label htmlFor="questionType" className='text-black mb-1 font-semibold'>Question Type</label>
            <div className='relative'>
              <select
                id="questionType"
                name="questionType"
                value={form.questionType}
                onChange={handleChange}
                className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-red-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
                <option value="both">Both</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
          </div>
          
          {(form.questionType === "long" || form.questionType === "both") && (
            <>
              <div className='flex flex-col'>
                <label htmlFor="longCount" className='text-black mb-1 font-semibold'>No. of Long Questions</label>
                <div className='relative'>
                  <select
                    id="longCount"
                    name="longCount"
                    value={form.longCount}
                    onChange={handleChange}
                    className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-red-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                  >
                    {Array.from({length: 15}, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                    <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                    </svg>
                  </div>
                </div>
              </div>
              <div className='flex flex-col'>
                <label className='text-black mb-1 font-semibold'>Marks per Long Question</label>
                <input
                  name="longMarks"
                  type="number"
                  min={1}
                  value={form.longMarks}
                  onChange={handleChange}
                  className='rounded px-3 py-2 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200'
                />
              </div>
            </>
          )}
          
          {(form.questionType === "short" || form.questionType === "both") && (
            <>
              <div className='flex flex-col'>
                <label htmlFor="shortCount" className='text-black mb-1 font-semibold'>No. of Short Questions</label>
                <div className='relative'>
                  <select
                    id="shortCount"
                    name="shortCount"
                    value={form.shortCount}
                    onChange={handleChange}
                    className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-red-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                  >
                    {Array.from({length: 15}, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                    <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                    </svg>
                  </div>
                </div>
              </div>
              <div className='flex flex-col'>
                <label className='text-black mb-1 font-semibold'>Marks per Short Question</label>
                <input
                  name="shortMarks"
                  type="number"
                  min={1}
                  value={form.shortMarks}
                  onChange={handleChange}
                  className='rounded px-3 py-2 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200'
                />
              </div>
            </>
          )}
        </form>
        
        {/* Buttons */}
        <div className='flex justify-end gap-4 mt-8'>
          <button
            type='button'
            className='border border-red-400 text-red-400 rounded-lg px-8 py-2 font-semibold bg-transparent hover:bg-white/10 transition'
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type='button'
            className='bg-gradient-primary text-primary-foreground cursor-pointer rounded-lg px-8 py-2 font-semibold shadow hover:opacity-90 hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Creating...' : 'Create exam'}
          </button>
        </div>
        
        {error && (
          <div className='text-red-400 font-semibold mt-4'>{error}</div>
        )}
      </div>
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
