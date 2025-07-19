'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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

interface Quiz {
  id: string;
  title: string;
  instructions: string;
  timeLimitMinutes: number;
  topic: string;
  difficulty: string;
  createdAt: string;
  userId: string;
  completed: boolean;
  questions: Question[];
}

function getTokenFromCookie() {
  if (typeof document === 'undefined') return null;
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

async function submitQuiz(
  quiz: Quiz,
  selected: { [questionId: string]: string },
  quizStartedAt: string
) {
  const token = getTokenFromCookie();
  if (!token) {
    alert('No auth token found. Please login.');
    return;
  }
  // Calculate time taken in minutes
  const started = new Date(quizStartedAt);
  const completed = new Date();
  const timeTaken = Math.max(
    1,
    Math.round((completed.getTime() - started.getTime()) / 60000)
  );
  const answers = quiz.questions.map((q) => ({
    questionId: q.id,
    selectedOptionId: selected[q.id] || '',
  }));

  const body = {
    quizId: quiz.id,
    answers,
    timeTaken,
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/users/quiz/submit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (res.ok) {
    alert('Quiz submitted!');
  } else {
    alert('Failed to submit quiz.');
  }
}

export default function QuizStartPage() {
  console.log('QuizStartPage component is rendering');

  const params = useParams();
  const quizId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<{ [questionId: string]: string }>(
    {}
  );
  const [quizStartedAt, setQuizStartedAt] = useState(new Date().toISOString());
  const [hasError, setHasError] = useState(false);

  // Add error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Quiz page error:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  useEffect(() => {
    async function fetchQuiz() {
      setLoading(true);
      setError('');
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setError('No auth token found. Please login.');
          setLoading(false);
          return;
        }

        // Check if environment variable is set
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) {
          console.error('NEXT_PUBLIC_BASE_URL is not set');
          setError(
            'Configuration error: API URL not set. Please contact support.'
          );
          setLoading(false);
          return;
        }

        console.log('Fetching quiz with ID:', quizId);
        console.log('Using base URL:', baseUrl);

        const res = await fetch(`${baseUrl}/users/quiz-by-id?id=${quizId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Quiz fetch response status:', res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Quiz fetch error:', errorText);
          setError(`Failed to fetch quiz: ${res.status} ${res.statusText}`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log('Quiz data received:', data);

        if (!data.success) {
          setError(data.message || 'Failed to fetch quiz.');
        } else {
          setQuiz(data.data.quiz || data.data);
          setQuizStartedAt(new Date().toISOString());
        }
      } catch (err) {
        console.error('Quiz fetch error:', err);
        setError('An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    if (quizId) fetchQuiz();
  }, [quizId]);

  // Timer logic (optional, for demo)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (quiz?.timeLimitMinutes) {
      setSecondsLeft(quiz.timeLimitMinutes * 60);
      const interval = setInterval(() => {
        setSecondsLeft((s) => (s && s > 0 ? s - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quiz?.timeLimitMinutes]);
  function formatTime(secs: number) {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  }

  // Progress
  const total = quiz?.questions?.length || 0;
  const answered = Object.keys(selected).length;
  const progress = total ? Math.min(answered / total, 1) : 0;

  // If there's a critical error, show a simple fallback
  if (hasError) {
    return (
      <div className='min-h-screen w-full px-4 md:px-12 py-8 bg-gradient-to-br from-[#181c24] to-[#1a2a22]'>
        <div className='max-w-3xl mx-auto'>
          <div className='text-white text-center py-20'>
            <h1 className='text-2xl font-bold mb-4'>Quiz Page Error</h1>
            <p className='text-gray-300'>
              There was an error loading this quiz. Please try refreshing the
              page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className='mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700'
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen w-full px-4 md:px-12 py-8 bg-gradient-to-br from-[#181c24] to-[#1a2a22]'>
      <div className='max-w-3xl mx-auto'>
        {/* Debug info - remove this after testing */}
        <div className='text-white text-xs mb-4 p-2 bg-gray-800 rounded'>
          Debug: Page loaded, Quiz ID: {quizId}, Base URL:{' '}
          {process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET'}
        </div>

        {/* Simple test message - remove after debugging */}
        <div className='text-white text-center py-4 bg-blue-600 rounded mb-4'>
          Component is rendering! Quiz ID: {quizId}
        </div>

        {loading ? (
          <div className='text-white text-center py-20 text-lg'>
            Loading quiz...
          </div>
        ) : error ? (
          <div className='text-red-400 text-center py-20 font-semibold'>
            {error}
          </div>
        ) : quiz ? (
          <>
            <div className='flex items-center justify-between mb-2'>
              <div>
                <div className='text-green-400 font-semibold text-sm mb-1'>
                  Difficulty:{' '}
                  {quiz.difficulty?.charAt(0).toUpperCase() +
                    quiz.difficulty?.slice(1)}
                </div>
                <div className='text-2xl md:text-3xl font-bold text-white mb-1'>
                  {quiz.title}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <div className='bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2'>
                  <svg
                    width='20'
                    height='20'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='2'
                      fill='none'
                    />
                    <path
                      d='M12 6v6l4 2'
                      stroke='currentColor'
                      strokeWidth='2'
                    />
                  </svg>
                  Time left{' '}
                  {secondsLeft !== null
                    ? formatTime(secondsLeft)
                    : `00:${quiz.timeLimitMinutes
                        ?.toString()
                        .padStart(2, '0')}:00`}
                </div>
              </div>
            </div>
            <div className='w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-4'>
              <div
                className='h-full bg-green-500 transition-all'
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>
            <div className='text-right text-white text-sm mb-4'>
              {answered}/{total}
            </div>
            {quiz.questions?.map((q, idx) => (
              <div key={q.id} className='mb-8 bg-[#23282f] rounded-2xl p-6'>
                <div className='font-semibold text-white mb-4 text-lg'>
                  {idx + 1}. {q.questionText}
                </div>
                <div className='flex flex-col gap-3'>
                  {q.options.map((opt, i) => (
                    <label
                      key={opt.id}
                      className={`block rounded-lg px-4 py-3 cursor-pointer transition-all border border-transparent ${
                        selected[q.id] === opt.id
                          ? 'bg-green-700/80 text-white border-green-400'
                          : 'bg-[#353a42] text-gray-200 hover:bg-green-900/40'
                      }`}
                    >
                      <input
                        type='radio'
                        name={q.id}
                        value={opt.id}
                        checked={selected[q.id] === opt.id}
                        onChange={() =>
                          setSelected((s) => ({ ...s, [q.id]: opt.id }))
                        }
                        className='mr-3 accent-green-500'
                      />
                      <span className='font-semibold mr-2'>
                        {String.fromCharCode(65 + i)})
                      </span>{' '}
                      {opt.optionText}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              className='bg-green-700/80 text-white p-4'
              onClick={() => submitQuiz(quiz, selected, quizStartedAt)}
            >
              Submit Quiz
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
