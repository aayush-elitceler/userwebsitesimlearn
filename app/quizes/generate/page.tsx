'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const difficulties = ['easy', 'medium', 'hard'];
const numQuestionsOptions = Array.from({length: 26}, (_, i) => i); // 0 to 25
const timeLimits = [5, 10, 15, 20, 30, 60];
const subjectOptions = ['Math', 'Science', 'Social studies', 'English', 'UG', 'PG'];

interface Option {
  id: string;
  optionText: string;
  isCorrect?: boolean;
  questionId?: string;
}

interface Question {
  id: string;
  questionText: string;
  quizId: string;
  options: Option[];
}

interface QuizGenerationResult {
  quiz: {
    id: string;
    title: string;
    instructions: string;
    timeLimitMinutes: number;
    topic: string;
    difficulty: string;
    createdAt: string;
    userId: string;
    completed: boolean;
    questions?: Question[];
  };
}

export default function GenerateQuizPage() {
  const [grade, setGrade] = useState(8);
  const [persona, setPersona] = useState('teacher');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [timer, setTimer] = useState(20);
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuizGenerationResult | null>(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setShowModal(true);
    try {
      const token =
        typeof document !== 'undefined'
          ? (() => {
              const match = document.cookie.match(/(?:^|; )auth=([^;]*)/);
              if (!match) return null;
              try {
                const decoded = decodeURIComponent(match[1]);
                const parsed = JSON.parse(decoded);
                return parsed.token;
              } catch {
                return null;
              }
            })()
          : null;
      if (!token) {
        setError('No auth token found. Please login.');
        setLoading(false);
        setShowModal(false);
        return;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/ai/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          grade: String(grade),
          persona,
          topic: topic,
          difficulty,
          timer,
          numQuestions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to generate quiz.');
        setShowModal(false);
      } else {
        setResult(data.data || data);
        setCreatedQuizId(data.data.quiz?.id || null);
      }
    } catch (err) {
      console.log(err);

      setError('An error occurred. Please try again.');
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen w-full px-4 md:px-12 py-8 bg-white flex flex-col items-center'>
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
                  Generating your quiz....
                </div>

                {/* Quiz Details */}
                <div className='flex flex-col gap-3 mb-8'>
                  <div className='flex items-center gap-3 bg-orange-100 rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <circle cx='12' cy='12' r='10'/>
                      <polyline points='12,6 12,12 16,14'/>
                    </svg>
                    <span className='text-black font-medium'>Takes {timer} mins</span>
                  </div>
                  
                  <div className='flex items-center gap-3 bg-orange-100 rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/>
                      <polyline points='14,2 14,8 20,8'/>
                      <line x1='16' y1='13' x2='8' y2='13'/>
                      <line x1='16' y1='17' x2='8' y2='17'/>
                      <polyline points='10,9 9,9 8,9'/>
                    </svg>
                    <span className='text-black font-medium'>{numQuestions} Questions</span>
                  </div>
                  
                  <div className='flex items-center gap-3 bg-orange-100 rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path d='M9 12l2 2 4-4'/>
                      <path d='M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z'/>
                      <path d='M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z'/>
                      <path d='M12 3c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 1 2 2z'/>
                      <path d='M12 21c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z'/>
                    </svg>
                    <span className='text-black font-medium'>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level</span>
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
            ) : (
              <>
                <div className='text-black text-2xl font-bold mb-2'>
                  Quiz created!
                </div>
                <div className='text-black mb-6'>
                  Your quiz has been generated successfully.
                </div>
                <button
                  className='text-white cursor-pointer rounded-lg px-8 py-3 font-semibold shadow hover:opacity-90 transition'
                  style={{
                    background: 'linear-gradient(90deg, #FF9F27 0%, #FF5146 100%)'
                  }}
                  onClick={() => {
                    setShowModal(false);
                    if (createdQuizId)
                      router.push(`/quizes/${createdQuizId}/start`);
                  }}
                  disabled={!createdQuizId}
                >
                  Start Test
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <div className='max-w-4xl w-full bg-transparent bg-gray-100 rounded-2xl shadow-lg p-8'>
        <h2 className='text-2xl font-bold text-black mb-2'>Create Quiz</h2>
        <hr className='border-gray-600 mb-6' />
        <form
          onSubmit={handleSubmit}
          className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'
        >
          {/* Grade */}
          <div className='flex flex-col'>
            <label htmlFor="grade" className='text-black mb-1 font-semibold'>Grade</label>
            <div className='relative'>
              <select
                id="grade"
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className='w-full rounded-lg px-4 py-3 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                {Array.from({length: 12}, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    {g}
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
          {/* Persona */}
          <div className='flex flex-col'>
            <label htmlFor="persona" className='text-black mb-1 font-semibold'>Persona</label>
            <div className='relative'>
              <select
                id="persona"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className='w-full rounded-lg px-4 py-3 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                <option value='teacher'>Teacher</option>
                <option value='student'>Student</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
          </div>
          {/* Topic */}
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Subject</label>
            <div className='relative'>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className='w-full rounded px-3 py-2 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none appearance-none cursor-pointer pr-8'
                required
              >
                <option value="">Select Subject</option>
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
          {/* Difficulty */}
          <div className='flex flex-col'>
            <label htmlFor="difficulty" className='text-black mb-1 font-semibold'>Difficulty</label>
            <div className='relative'>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className='w-full rounded-lg px-4 py-3 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
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
          {/* Number of Questions */}
          <div className='flex flex-col'>
            <label htmlFor="numQuestions" className='text-black mb-1 font-semibold'>
              No. of Questions
            </label>
            <div className='relative'>
              <select
                id="numQuestions"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className='w-full rounded-lg px-4 py-3 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                {numQuestionsOptions.map((n) => (
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
          {/* Time Limit */}
          <div className='flex flex-col'>
            <label htmlFor="timer" className='text-black mb-1 font-semibold'>Time Limit</label>
            <div className='relative'>
              <select
                id="timer"
                value={timer}
                onChange={(e) => setTimer(Number(e.target.value))}
                className='w-full rounded-lg px-4 py-3 bg-gradient-to-r from-orange-100 to-red-200 text-black focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                {timeLimits.map((t) => (
                  <option key={t} value={t}>
                    {t} minutes
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
        </form>
        {/* Buttons */}
        <div className='flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-4 border-t border-gray-300'>
          <button
            type='button'
            className='border border-red-400 text-red-400 rounded-lg px-6 py-3 font-semibold bg-transparent hover:bg-red-50 transition-all duration-200 min-w-[120px] order-2 sm:order-1'
            onClick={() => {
              setTopic('');
              setDifficulty('medium');
              setNumQuestions(5);
              setTimer(20);
              setResult(null);
              setError('');
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type='submit'
            form='quiz-gen-form'
            className='point-ask-gradient text-white cursor-pointer rounded-lg px-6 py-3 font-semibold shadow hover:opacity-90 hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed min-w-[140px] order-1 sm:order-2'
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Generating...' : 'Create quiz'}
          </button>
        </div>
        {error && (
          <div className='text-red-400 font-semibold mt-4'>{error}</div>
        )}
      </div>
    </div>
  );
}
