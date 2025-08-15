"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from 'axios';

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
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      if (!token) {
        setError('No auth token found. Please login.');
        setLoading(false);
        setShowModal(false);
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
      console.log(err);
      setError('An error occurred. Please try again.');
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-white flex flex-col items-center">
      {/* Modal Popup */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-60'>
          <div className='rounded-2xl shadow-lg p-8 min-w-[420px] max-w-[90vw] flex flex-col items-center' style={{
            background: 'linear-gradient(180deg, rgba(255, 159, 39, 0.12) 0%, rgba(255, 81, 70, 0.12) 100%)'
          }}>
            {loading ? (
              <>
                {/* Loading Spinner */}
                <div className='mb-6'>
                  <img 
                    src="/images/loadingSpinner.svg" 
                    alt="Loading" 
                    className='w-24 h-24 animate-spin'
                  />
                </div>

                <div className='text-black font-semibold text-lg mb-6'>
                  Generating your exam....
                </div>

                {/* Exam Details */}
                <div className='flex flex-col gap-3 mb-8'>
                  <div className='flex items-center gap-3 bg-orange-100 rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/>
                      <polyline points='14,2 14,8 20,8'/>
                      <line x1='16' y1='13' x2='8' y2='13'/>
                      <line x1='16' y1='17' x2='8' y2='17'/>
                      <polyline points='10,9 9,9 8,9'/>
                    </svg>
                    <span className='text-black font-medium'>{form.subject || 'Subject'}</span>
                  </div>
                  
                  <div className='flex items-center gap-3 bg-orange-100 rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path d='M9 12l2 2 4-4'/>
                      <path d='M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z'/>
                      <path d='M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z'/>
                      <path d='M12 3c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 1 2 2z'/>
                      <path d='M12 21c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z'/>
                    </svg>
                    <span className='text-black font-medium'>{form.level.charAt(0).toUpperCase() + form.level.slice(1)} Level</span>
                  </div>
                  
                  <div className='flex items-center gap-3 bg-orange-100 rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'/>
                    </svg>
                    <span className='text-black font-medium'>{form.questionType.charAt(0).toUpperCase() + form.questionType.slice(1)} Questions</span>
                  </div>
                </div>
              </>
            ) : error ? (
              <>
                <div className='text-red-400 font-semibold mb-4'>{error}</div>
                <button
                  className='mt-2 px-6 py-2 rounded bg-gray-700 text-black'
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
      
      <div className='max-w-4xl w-full bg-transparent bg-gray-100 rounded-2xl shadow-lg p-8'>
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
              className='rounded px-3 py-2 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none'
              placeholder="e.g. Fractions, Photosynthesis"
              required
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
                className='w-full rounded-lg px-4 py-3 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
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
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className='rounded px-3 py-2 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none'
              placeholder="e.g. Math, Science, EVS, English"
              required
            />
          </div>
          
          <div className='flex flex-col'>
            <label htmlFor="questionType" className='text-black mb-1 font-semibold'>Question Type</label>
            <div className='relative'>
              <select
                id="questionType"
                name="questionType"
                value={form.questionType}
                onChange={handleChange}
                className='w-full rounded-lg px-4 py-3 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
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
                    className='w-full rounded-lg px-4 py-3 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
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
                  className='rounded px-3 py-2 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none'
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
                    className='w-full rounded-lg px-4 py-3 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
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
                  className='rounded px-3 py-2 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none'
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
            className='point-ask-gradient text-white cursor-pointer rounded-lg px-8 py-2 font-semibold shadow hover:bg-[#16a34a] transition disabled:opacity-60'
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