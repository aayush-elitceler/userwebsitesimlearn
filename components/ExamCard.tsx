"use client";
import React from "react";
import { useRouter } from "next/navigation";

// Get CSS class for subject background
const getSubjectClass = (subject: string | undefined) => {
  if (!subject) return "quiz-subject-default";
  const normalized = subject.toLowerCase().replace(/\s+/g, "");
  switch (normalized) {
    case "maths":
    case "math":
      return "quiz-subject-maths";
    case "science":
      return "quiz-subject-science";
    case "english":
      return "quiz-subject-english";
    case "evs":
      return "quiz-subject-evs";
    default:
      return "quiz-subject-default";
  }
};

interface Exam {
  id: string;
  title: string;
  subject?: string;
  createdAt: string;
  previous?: boolean;
  date?: string;
  description?: string;
  difficulty?: string;
  instructions?: string;
  topic?: string;
  [key: string]: any; // For additional properties
}

interface ExamCardProps {
  exam: Exam;
  previous?: boolean;
  date?: string;
  description?: string;
  onStartExam?: (examId: string) => void;
  onViewReport?: (examId: string) => void;
  height?: string;
  maxWidth?: string;
  showScoreAndDate?: boolean;
  difficulty?: string;
}

export default function ExamCard({
  exam,
  previous = false,
  date,
  description,
  onStartExam,
  onViewReport,
  height = "240px",
  maxWidth = "520px",
  showScoreAndDate = true,
  difficulty,
}: ExamCardProps) {
  const router = useRouter();
  const examDescription =
    description ||
    exam.description ||
    "Comprehensive exam covering all topics with detailed analysis and scoring.";

  const handleStartExam = () => {
    if (onStartExam) {
      onStartExam(exam.id);
    } else {
      router.push(`/exams/take/${exam.id}`);
    }
  };

  const handleViewReport = () => {
    if (onViewReport) {
      onViewReport(exam.id);
    } else {
      router.push(`/exams/reports/${exam.id}`);
    }
  };

  return (
    <div
      className="flex flex-row bg-white border border-[#DEDEDE] items-center
                w-full hover:shadow-lg
                flex-shrink-0 p-5 hover:scale-[1.02] transition-all duration-300 transform"
      style={{
        maxWidth,
        minWidth: "380px",
        height,
        borderRadius: "15.51px",
        boxShadow: "0px 2.15px 16px 0px #0000002E",
      }}
    >
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden pr-4">
        <div className="flex-1 min-h-0 pb-3">
          <div className="text-[#626262] text-xs sm:text-sm font-medium mb-1.5">
            Difficulty:{" "}
            {difficulty || exam.difficulty || "Medium"}
          </div>
          <div className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-semibold bg-gradient-to-r from-primary to-primary text-transparent bg-clip-text mb-2 break-words leading-tight">
            {exam.title}
          </div>
          <div className="text-black text-xs sm:text-sm mb-3 leading-relaxed">
            <div className={"break-words line-clamp-2"}>
              {examDescription}
            </div>
          </div>
        </div>
        <div className="mt-auto pt-3">
          {previous ? (
            <button
              className="bg-gradient-to-r from-primary to-primary text-primary-foreground rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
              onClick={handleViewReport}
            >
              View Report
            </button>
          ) : (
            <button
              className="bg-gradient-to-r from-primary to-primary cursor-pointer text-primary-foreground rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
              onClick={handleStartExam}
            >
              Start Exam
            </button>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-3 sm:ml-4 lg:ml-5">
        <div
          className={`flex items-center justify-center text-white font-bold relative overflow-hidden rounded-[9px] shadow-[0px_0.89px_6.68px_0px_#00000075]
                     h-[10rem] w-[14rem]
            ${getSubjectClass(exam.subject)}`}
        >
          <span className="z-10 font-bold tracking-wide text-center px-1.5 break-words">
            {exam.subject || "Subject"}
          </span>
          {/* SVG Pattern from Figma */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <svg
              width="134"
              height="133"
              viewBox="0 0 134 133"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="61.3397"
                cy="72.3504"
                r="5.11912"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3395"
                cy="72.3512"
                r="10.6834"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3393"
                cy="72.351"
                r="16.2477"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3391"
                cy="72.3508"
                r="21.8119"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3389"
                cy="72.3506"
                r="27.3762"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3387"
                cy="72.3514"
                r="32.9404"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3385"
                cy="72.3512"
                r="38.5047"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3403"
                cy="72.351"
                r="44.069"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3401"
                cy="72.3508"
                r="49.6332"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3399"
                cy="72.3506"
                r="55.1975"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3397"
                cy="72.3514"
                r="60.7618"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3395"
                cy="72.3512"
                r="66.326"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <circle
                cx="61.3393"
                cy="72.351"
                r="71.8903"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
              <line
                x1="61.1936"
                y1="72.784"
                x2="0.000449386"
                y2="72.8107"
                stroke="white"
                strokeOpacity="0.3"
                strokeWidth="0.890282"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}