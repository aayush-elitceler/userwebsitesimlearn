'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from "next/navigation";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface Option {
  id: string;
  optionText: string;
  isCorrect?: boolean;
  questionId?: string;
}

interface Question {
  id: string;
  questionText: string;
  bloomTaxonomy?: string | null;
  quizId: string;
  options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  instructions: string;
  timeLimitMinutes: number;
  topic: string;
  difficulty: string;
  createdAt: string;
  userId?: string | null;
  completed: boolean;
  createdBy: string;
  questions: Question[];
}

function getTokenFromCookie() {
  // Ensure we're on the client side
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  try {
    const match = document.cookie.match(/(?:^|; )auth=([^;]*)/);
    if (!match) return null;

    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);
    return parsed.token;
  } catch (error) {
    console.error('Error parsing auth cookie:', error);
    return null;
  }
}

async function submitQuiz(
  quiz: Quiz,
  selected: { [questionId: string]: string },
  quizStartedAt: string,
  router: ReturnType<typeof useRouter>
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
    `https://apisimplylearn.selflearnai.in/api/v1/users/quiz/submit`,
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
    const data = await res.json();
    const submissionId = data.data?.submission?.id; // Adjust based on your API response
    if (submissionId) {
      router.push(`/quizes/reports/${submissionId}`);
    } else {
      alert('Quiz submitted, but no submissionId returned.');
    }
  } else {
    alert('Failed to submit quiz.');
  }
}

export default function QuizStartPage() {
  
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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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

        const res = await fetch(
          `https://apisimplylearn.selflearnai.in/api/v1/users/quiz-by-id?id=${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Quiz fetch error:', errorText);
          setError(`Failed to fetch quiz: ${res.status} ${res.statusText}`);
          setLoading(false);
          return;
        }

        const data = await res.json();

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
      <div className='min-h-screen w-full px-4 md:px-12 py-8 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <div className='text-white text-center py-20'>
            <h1 className='text-2xl font-bold mb-4'>Quiz Page Error</h1>
            <p className='text-gray-300'>
              There was an error loading this quiz. Please try refreshing the
              page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className='mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90'
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className='min-h-screen w-full px-4 md:px-12 py-8 bg-white'>
        <div className='max-w-3xl mx-auto'>
          <div className='text-white text-center py-20 text-lg'>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen w-full px-4 md:px-12 py-8 bg-gray-100'>
      <div className='max-w-3xl mx-auto'>
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
                <div className='text-black font-semibold text-sm mb-1'>
                  Difficulty:{' '}
                  {quiz.difficulty?.charAt(0).toUpperCase() +
                    quiz.difficulty?.slice(1)}
                </div>
                <div className='text-2xl md:text-3xl font-bold text-black mb-1'>
                  {quiz.title}
                </div>
                {quiz.description && (
                  <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-border/30">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Note: </span>
                      <span className="text-card-foreground">{quiz.description}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <div className='bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold flex items-center gap-2'>
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
            <div className='w-full h-3 bg-white rounded-full overflow-hidden mb-4'>
              <div
                className='h-full bg-amber-600 transition-all'
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>
            <div className='text-right text-white text-sm mb-4'>
              {answered}/{total}
            </div>
            {quiz.questions?.map((q, idx) => (
              <div key={q.id} className='mb-8 bg-white rounded-2xl p-6'>
                <div className='font-semibold text-black mb-4 text-lg'>
                  {idx + 1}. {q.questionText}
                </div>
                {q.bloomTaxonomy && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Bloom Taxonomy: </span>
                      <span className="text-sm font-semibold text-primary">{q.bloomTaxonomy}</span>
                    </div>
                  </div>
                )}
                <div className='flex flex-col gap-3'>
                  {q.options.map((opt, i) => (
                    <label
                      key={opt.id}
                      className={`block rounded-md px-4 py-3 cursor-pointer transition-all border border-transparent ${
                        selected[q.id] === opt.id
                          ? 'bg-primary text-primary-foreground border-amber-400'
                          : 'bg-gradient-to-r from-orange-100 to-red-200 text-[#646464] hover:bg-primary/40'
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
                        className='mr-3 accent-amber-600'
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
              className='bg-primary text-primary-foreground p-3 cursor-pointer rounded-xl'
              onClick={() => submitQuiz(quiz, selected, quizStartedAt, router)}
            >
              Submit Quiz
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
