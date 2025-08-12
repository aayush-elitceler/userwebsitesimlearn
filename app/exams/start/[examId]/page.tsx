"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function ExamStartPopup() {
  const router = useRouter();
  const { examId } = useParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/exams/take/${examId}`);
    }, 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, [examId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white bg-opacity-60">
      <div className='rounded-2xl shadow-lg p-8 min-w-[420px] max-w-[90vw] flex flex-col items-center' style={{
        background: 'linear-gradient(180deg, rgba(255, 159, 39, 0.12) 0%, rgba(255, 81, 70, 0.12) 100%)'
      }}>
        <div className='mb-6'>
          <img 
            src="/images/loadingSpinner.svg" 
            alt="Loading" 
            className='w-24 h-24 animate-spin'
          />
        </div>
        <h2 className="text-2xl font-bold text-black mb-4">Starting your Exam....</h2>
      </div>
    </div>
  );
} 