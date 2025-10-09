"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ContentItem {
  id: string;
  title: string;
  subject?: string;
  description?: string;
  instructions?: string;
  difficulty?: string;
  createdAt?: string;
  date?: string;
  pdfUrl?: string;
  downloadUrl?: string;
  class?: string;
  persona?: string;
  deadline?: string | null;
  type?: 'quiz' | 'project' | 'exam';
}

interface ContentCardProps {
  content: ContentItem;
  type?: 'quiz' | 'project' | 'exam';
  previous?: boolean;
  showScoreAndDate?: boolean;
  onStart?: (id: string) => void;
  onDownload?: (url: string) => void;
  onViewAnswers?: (id: string) => void;
}

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

export default function ContentCard({
  content,
  type = 'quiz',
  previous = false,
  showScoreAndDate = true,
  onStart,
  onDownload,
  onViewAnswers,
}: ContentCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const description =
    content.description ||
    content.instructions ||
    (content.type === 'project'
      ? `Class ${content.class} - ${content.persona}`
      : "Learn with AI Tutor the core of grammar with help of new age solutions in your test"
    );

  // Check if content actually overflows
  useEffect(() => {
    if (descriptionRef.current) {
      const element = descriptionRef.current;
      // Temporarily remove line-clamp to check full height
      element.classList.remove("line-clamp-2");
      const fullHeight = element.scrollHeight;
      // Add line-clamp back
      element.classList.add("line-clamp-2");
      const clampedHeight = element.scrollHeight;
      setShouldTruncate(fullHeight > clampedHeight);
    }
  }, [description]);

  const handleStart = () => {
    if (onStart) {
      onStart(content.id);
    } else if (content.type === 'project') {
      // Default project behavior
      if (content.pdfUrl || content.downloadUrl) {
        window.open(content.pdfUrl || content.downloadUrl, '_blank');
      }
    } else {
      // Default quiz/exam behavior
      router.push(`/quizes/${content.id}/start`);
    }
  };

  const handleDownload = () => {
    if (onDownload && (content.pdfUrl || content.downloadUrl)) {
      onDownload(content.pdfUrl || content.downloadUrl!);
    } else if (content.pdfUrl || content.downloadUrl) {
      window.open(content.pdfUrl || content.downloadUrl, '_blank');
    }
  };

  const handleViewAnswers = () => {
    if (onViewAnswers) {
      onViewAnswers(content.id);
    } else {
      router.push(`/quizes/reports/${content.id}`);
    }
  };

  const getDisplayDate = () => {
    if (content.deadline) {
      return new Date(content.deadline).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    if (content.date) {
      return new Date(content.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    if (content.createdAt) {
      return new Date(content.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return "-";
  };

  const getDisplaySubject = () => {
    return content.subject || "Subject";
  };

  const getDisplayDifficulty = () => {
    if (!content?.difficulty) return "";
    return content.difficulty.charAt(0).toUpperCase() + content.difficulty.slice(1);
  };

  return (
    <div
      className="flex flex-row bg-white border border-[#DEDEDE] items-center
                w-full hover:shadow-lg
                flex-shrink-0 p-5 hover:scale-[1.02] transition-all duration-300 transform"
      style={{
        maxWidth: "520px",
        minWidth: "380px",
        height: "240px",
        borderRadius: "15.51px",
        boxShadow: "0px 2.15px 16px 0px #0000002E",
      }}
    >
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden pr-4">
        <div className="flex-1 min-h-0 pb-3">
          <div className="text-[#626262] text-xs sm:text-sm font-medium mb-1.5">
            {content.type === 'project' ? 'Subject' : 'Difficulty'}:{" "}
            {content.type === 'project' ? getDisplaySubject() : getDisplayDifficulty()}
          </div>
          <div className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-semibold text-gradient-primary mb-2 break-words leading-tight">
            {content.title}
          </div>
          <div className="text-black text-xs sm:text-sm mb-3 leading-relaxed">
            <div
              ref={descriptionRef}
              className={`break-words cursor-pointer ${
                !isExpanded ? "line-clamp-2" : ""
              }`}
              onClick={() => shouldTruncate && setIsExpanded(!isExpanded)}
            >
              {description}
            </div>
            {shouldTruncate && (
              <button
                className="text-gradient-primary hover:opacity-80 text-xs mt-1 font-medium"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </div>
          {showScoreAndDate && (
            <div className="flex items-center gap-2 text-black text-xs sm:text-sm mb-3">
              <span role="img" aria-label={content.type === 'project' ? "calendar" : "clock"}>
                {content.type === 'project' ? "🗓️" : "🕒"}
              </span>
              <span className="break-words">
                {content.type === 'project' ? "Created on" : "Due date"}: {getDisplayDate()}
              </span>
            </div>
          )}
        </div>
        <div className="mt-auto pt-3">
          {previous ? (
            <button
              className="bg-gradient-primary text-primary-foreground rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
              onClick={handleViewAnswers}
            >
              View answers
            </button>
          ) : content.type === 'project' ? (
            <button
              className="bg-gradient-primary cursor-pointer text-primary-foreground rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
              onClick={handleDownload}
            >
              Download Project
            </button>
          ) : (
            <button
              className="bg-gradient-primary cursor-pointer text-primary-foreground rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
              onClick={handleStart}
            >
              Start {type === 'exam' ? 'Exam' : 'Quiz'}
            </button>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-3 sm:ml-4 lg:ml-5">
        <div
          className={`flex items-center justify-center text-white font-bold relative overflow-hidden rounded-[9px] shadow-[0px_0.89px_6.68px_0px_#00000075]
                     h-[10rem] w-[14rem]
            ${getSubjectClass(content.subject)}`}
        >
          <span className="z-10 font-bold tracking-wide text-center px-1.5 break-words">
            {getDisplaySubject()}
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
