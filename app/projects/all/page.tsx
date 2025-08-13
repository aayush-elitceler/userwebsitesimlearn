"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const subjectColors: Record<string, string> = {
  Maths: "#4A90E2",
  Math: "#4A90E2",
  Science: "#8F5AFF",
  English: "#F44336",
  EVS: "#E6AF3F",
  Physics: "#F5A623",
  Default: "#E6AF3F",
};

interface UserProject {
  id: string;
  class: string;
  title: string;
  persona: string;
  subject: string;
  description?: string;
  createdAt: string;
  pdfUrl: string;
}

// Project Card Component
function ProjectCard({
  project,
  onDownload,
}: {
  project: UserProject;
  onDownload: () => void;
}) {
  return (
    <div className="flex flex-row bg-white border border-[#DEDEDE] items-center 
                    w-full h-[220px] rounded-[15.51px] shadow-[0px_2.15px_16px_0px_#0000002E] flex-shrink-0 p-5">
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full overflow-hidden">
        <div className="flex-1 min-h-0">
          <div className="text-[#626262] text-xs sm:text-sm font-medium mb-1.5">
            Subject: {project.subject || "Subject"}
          </div>
          <div className="text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-semibold bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-transparent bg-clip-text mb-2 break-words leading-tight">
            {project.title}
          </div>
          <div className="text-black text-xs sm:text-sm mb-3 leading-relaxed break-words">
            {project.description || `Class ${project.class} - ${project.persona}`}
          </div>
          <div className="flex items-center gap-2 text-black text-xs sm:text-sm mb-3">
            <span role="img" aria-label="calendar">🗓️</span>
            <span className="break-words">
              Created on {new Date(project.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="mt-auto pt-1">
          <button
            className="bg-gradient-to-r from-[#FFB31F] to-[#FF4949] cursor-pointer text-white rounded-lg px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-semibold shadow hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
            onClick={onDownload}
          >
            Download Project
          </button>
        </div>
      </div>
      <div className="flex-shrink-0 ml-3 sm:ml-4 lg:ml-5">
        <div
          className="flex items-center justify-center text-white font-bold relative overflow-hidden rounded-[9px] shadow-[0px_0.89px_6.68px_0px_#00000075]
                      w-[120px] h-[80px] text-sm
                      sm:w-[130px] sm:h-[85px] sm:text-base
                      md:w-[110px] md:h-[75px] md:text-sm
                      lg:w-[140px] lg:h-[95px] lg:text-base
                      xl:w-[160px] xl:h-[110px] xl:text-lg
                      2xl:w-[180px] 2xl:h-[120px] 2xl:text-xl"
          style={{
            background: subjectColors[project.subject] || subjectColors.Default,
          }}
        >
          <span className="z-10 font-bold tracking-wide text-center px-1.5 break-words">
            {project.subject || "Subject"}
          </span>
          {/* SVG Pattern from Figma - matching exam/quiz cards */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <svg width="134" height="133" viewBox="0 0 134 133" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="61.3397" cy="72.3504" r="5.11912" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3395" cy="72.3512" r="10.6834" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3393" cy="72.351" r="16.2477" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3391" cy="72.3508" r="21.8119" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3389" cy="72.3506" r="27.3762" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3387" cy="72.3514" r="32.9404" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3385" cy="72.3512" r="38.5047" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3403" cy="72.351" r="44.069" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3401" cy="72.3508" r="49.6332" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3399" cy="72.3506" r="55.1975" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3397" cy="72.3514" r="60.7618" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3395" cy="72.3512" r="66.326" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <circle cx="61.3393" cy="72.351" r="71.8903" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
              <line x1="61.1936" y1="72.784" x2="0.000449386" y2="72.8107" stroke="white" strokeOpacity="0.3" strokeWidth="0.890282"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default function AllProjectsPage() {
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setLoading(false);
          return;
        }

        console.log("Fetching all user projects...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/projects`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        console.log("Projects API Response status:", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("Projects API Response data:", data);

          if (data.success && data.data && data.data["user-generated"]) {
            setUserProjects(data.data["user-generated"]);
          }
        } else {
          console.error("Failed to fetch projects:", res.status, res.statusText);
        }
      } catch (e) {
        console.error("Error fetching projects:", e);
        if (e instanceof Error) {
          if (e.name === 'AbortError') {
            console.error("Request timed out while fetching projects");
          }
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen w-full px-4 md:px-8 lg:px-12 py-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-black">All My Projects</h1>
        </div>

        <div className="text-base md:text-lg text-black mb-8">
          🎯 Complete Fun Projects and Earn Feedback{" "}
          <span className="align-middle">🏅✨</span>
        </div>

        {/* Grid layout for all project cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
            <span className="text-black">Loading your projects...</span>
          </div>
        ) : userProjects.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-black text-center">
              <div className="text-4xl mb-4">📝</div>
              <div className="text-xl font-semibold mb-2">No projects created yet</div>
              <div className="text-gray-600 mb-4">Start creating your first project!</div>
              <button
                onClick={() => router.push("/projects/create")}
                className="bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Create Your First Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDownload={() => window.open(project.pdfUrl, '_blank')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
