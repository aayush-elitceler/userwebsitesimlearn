'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const difficulties = ['easy', 'medium', 'hard'];
const numQuestionsOptions = [3, 4, 5, 6, 7, 8, 9, 10];
const timeLimits = [5, 10, 15, 20, 30, 60];

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
          topic,
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
          <div className='point-ask-gradient rounded-2xl shadow-lg p-8 min-w-[320px] max-w-[90vw] flex flex-col items-center'>
            {loading ? (
              <>
                <div className='w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4'></div>

                <div className='text-black font-semibold text-lg'>
                  Generating quiz...
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
                  className='bg-black cursor-pointer text-white rounded-full px-8 py-2 font-semibold shadow hover:bg-black/50 transition'
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
            <label className='text-black mb-1 font-semibold'>Grade</label>
            <input
              type='number'
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className='rounded px-3 py-2 bg-[#FFB12133] text-black  focus:outline-none '
              min={1}
              max={12}
              required
            />
          </div>
          {/* Persona */}
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Persona</label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className='rounded px-3 py-2 bg-[#FFB12133] text-black  focus:outline-none '
              required
            >
              <option value='teacher'>Teacher</option>
              <option value='student'>Student</option>
            </select>
          </div>
          {/* Topic */}
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Topic</label>
            <input
              type='text'
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className='rounded px-3 py-2 bg-[#FFB12133] text-black  focus:outline-none '
              placeholder='make a quiz on force and motion for physics.'
              required
            />
          </div>
          {/* Difficulty */}
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className='rounded px-3 py-2 bg-[#FFB12133] text-black  focus:outline-none '
              required
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {/* Number of Questions */}
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>
              No. of Questions
            </label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className='rounded px-3 py-2 bg-[#FFB12133] text-black  focus:outline-none '
              required
            >
              <option value=''>3-10</option>
              {numQuestionsOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          {/* Time Limit */}
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Time Limit</label>
            <select
              value={timer}
              onChange={(e) => setTimer(Number(e.target.value))}
              className='rounded px-3 py-2 bg-[#FFB12133] text-black  focus:outline-none '
              required
            >
              <option value=''>5, 10, 15 minutes</option>
              {timeLimits.map((t) => (
                <option key={t} value={t}>
                  {t} minutes
                </option>
              ))}
            </select>
          </div>
        </form>
        {/* Buttons */}
        <div className='flex justify-end gap-4 mt-8'>
          <button
            type='button'
            className='border border-white text-black rounded-lg px-8 py-2 font-semibold bg-transparent hover:bg-white/10 transition'
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
            className='point-ask-gradient text-white cursor-pointer rounded-lg px-8 py-2 font-semibold shadow hover:bg-[#16a34a] transition disabled:opacity-60'
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
