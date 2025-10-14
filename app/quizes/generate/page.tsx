'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';
import axios, { redirectToLogin } from '@/lib/axiosInstance';

const difficulties = ['easy', 'medium', 'hard'];
const subjects = [
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
const numQuestionsOptions = Array.from({length: 26}, (_, i) => i); // 0 to 25
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
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [timer, setTimer] = useState(20);
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuizGenerationResult | null>(null);
  const [error, setError] = useState('');
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);
  const router = useRouter();

  const loadingStates = [
    { text: 'Analyzing your requirements...' },
    { text: 'Generating quiz questions...' },
    { text: 'Creating answer options...' },
    { text: 'Finalizing your quiz...' },
    { text: 'Quiz ready!' }
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await axios.post('/ai/quiz', {
        grade: String(grade),
        persona,
        subject,
        description,
        topic: topic,
        difficulty,
        timer,
        numQuestions,
      });

      const data = response.data;
      if (data.success) {
        setResult(data.data || data);
        setCreatedQuizId(data.data.quiz?.id || null);
      } else {
        setError(data.message || 'Failed to generate quiz.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        redirectToLogin();
      } else {
        console.error('Error generating quiz:', error);
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen w-full px-4 md:px-12 py-8 bg-background flex flex-col items-center'>
      {/* Multi-step Loader */}
      <MultiStepLoader 
        loadingStates={loadingStates} 
        loading={loading} 
        duration={5500}
      />
      
      {/* Success Modal */}
      {result && !loading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
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
                  <div className='flex items-center gap-3 bg-amber-100 rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-amber-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <circle cx='12' cy='12' r='10'/>
                      <polyline points='12,6 12,12 16,14'/>
                    </svg>
                    <span className='text-black font-medium'>Takes {timer} mins</span>
                  </div>
                  
                  <div className='flex items-center gap-3 bg-amber-100 rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-amber-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/>
                      <polyline points='14,2 14,8 20,8'/>
                      <line x1='16' y1='13' x2='8' y2='13'/>
                      <line x1='16' y1='17' x2='8' y2='17'/>
                      <polyline points='10,9 9,9 8,9'/>
                    </svg>
                    <span className='text-black font-medium'>{numQuestions} Questions</span>
                  </div>
                  
                  <div className='flex items-center gap-3 bg-amber-100 rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-amber-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                  onClick={() => router.push('/quizes')}
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
                    background: 'linear-gradient(90deg, #FF9F27 0%, var(--primary) 100%)'
                  }}
                  onClick={() => {
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
      
      <div className='max-w-4xl w-full bg-muted/50 rounded-2xl shadow-lg p-8'>
        <h2 className='text-2xl font-bold text-black mb-2'>Create Quiz</h2>
        <hr className='border-border mb-6' />
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
                className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                {Array.from({length: 12}, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-5 h-5 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                <option value='teacher'>Teacher</option>
                <option value='student'>Student</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-5 h-5 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
          </div>
          {/* Subject and Description in same row */}
          <div className='flex flex-col'>
            <label htmlFor="subject" className='text-black mb-1 font-semibold'>Subject</label>
            <div className='relative'>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                <option value="">Select a subject</option>
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-5 h-5 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
          </div>
          {/* Description */}
          <div className='flex flex-col'>
            <label htmlFor="description" className='text-black mb-1 font-semibold'>Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for your quiz (optional)"
              className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200 resize-none'
              rows={3}
            />
          </div>
          {/* Topic */}
          <div className='flex flex-col'>
            <label htmlFor="topic" className='text-black mb-1 font-semibold'>Topic</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your quiz topic (e.g., 'force and motion for physics')"
              className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent shadow-sm hover:shadow-md transition-all duration-200'
              required
            />
          </div>
          {/* Difficulty */}
          <div className='flex flex-col'>
            <label htmlFor="difficulty" className='text-black mb-1 font-semibold'>Difficulty</label>
            <div className='relative'>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-5 h-5 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                {numQuestionsOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-5 h-5 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
                required
              >
                {timeLimits.map((t) => (
                  <option key={t} value={t}>
                    {t} minutes
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-5 h-5 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
          </div>
        </form>
        {/* Buttons */}
        <div className='flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-4 border-t border-border'>
          <button
            type='button'
            className='border border-destructive text-destructive rounded-lg px-6 py-3 font-semibold bg-transparent hover:bg-muted transition-all duration-200 min-w-[120px] order-2 sm:order-1'
            onClick={() => {
              setDescription('');
              setTopic('');
              setSubject('');
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
            className='bg-gradient-primary text-primary-foreground cursor-pointer rounded-lg px-6 py-3 font-semibold shadow hover:opacity-90 hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed min-w-[140px] order-1 sm:order-2'
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
        {error && (
          <div className='text-destructive font-semibold mt-4'>{error}</div>
        )}
      </div>
    </div>
  );
}
