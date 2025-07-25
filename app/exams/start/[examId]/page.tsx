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
    <div className="min-h-screen flex items-center justify-center bg-[#181c24]">
      <div className="bg-[#232c24] rounded-3xl p-10 w-full max-w-lg shadow-lg flex flex-col items-center">
        <div className="mb-6">
          {/* Loader spinner */}
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-400 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Starting your Exam....</h2>
        <ul className="text-gray-200 text-center mb-6 space-y-2">
          <li>• Leaving or switching tabs will trigger a warning</li>
          <li>• 3 violations will auto-submit your exam</li>
          <li>• Navigation and back buttons are disabled</li>
        </ul>
      </div>
    </div>
  );
} 