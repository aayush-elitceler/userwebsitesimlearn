"use client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { pageAnimationStyles, getAnimationDelay } from '@/lib/animations';

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

// Project Card Component similar to ExamCard
function ProjectCard({
  project,
  onDownload,
  buttonText = "Download project",
}: {
  project: {
    title: string;
    subject: string;
    description: string;
    deadline?: string | null;
    downloadUrl: string;
    class?: string;
    persona?: string;
  };
  onDownload?: () => void;
  buttonText?: string;
}) {
  return (
    <div className="flex flex-row bg-white rounded-2xl p-8 mb-6 shadow-lg max-w-3xl w-full items-center">
      <div className="flex-1">
        <div className="text-black font-semibold mb-1">
          Subject: {project.subject || "N/A"}
        </div>
        <div className="text-2xl font-semibold bg-gradient-to-r from-[#006a3d] to-[#006a3d] text-transparent bg-clip-text">
          {project.title}
        </div>
        <div className="text-black mb-3">
          {project.description || `Class ${project.class} - ${project.persona}`}
        </div>
        <div className="text-black mb-4 flex items-center gap-2">
          <span role="img" aria-label="calendar">🗓️</span>
          Deadline:{" "}
          {project.deadline
            ? new Date(project.deadline).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-"}
        </div>
        <button
          className="point-ask-gradient cursor-pointer text-white rounded-lg px-6 py-2 font-semibold shadow hover:bg-green-700 transition"
          onClick={onDownload}
        >
          {buttonText}
        </button>
      </div>
      <div className="ml-6 flex-shrink-0 relative">
        <div
          className="rounded-2xl flex items-center justify-center w-40 h-28 md:w-44 md:h-32 text-black text-xl font-bold shadow-lg relative overflow-hidden"
          style={{
            background: subjectColors[project.subject] || subjectColors.Default,
            minWidth: 140,
          }}
        >
          <span className="z-10 text-lg font-semibold tracking-wide">
            {project.subject}
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

export default function ProjectsPage() {
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        console.log("Fetching projects...");
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

          if (data.success && data.data) {
            if (data.data["user-generated"]) {
              // Reverse the array to show newest first
              setUserProjects(data.data["user-generated"].reverse());
            }
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl md:text-3xl font-bold text-black">Projects</h2>
        </div>
        <div className="w-full px-4 md:px-0 mb-6">
          <div className="flex justify-end">
            <button
              className="flex items-center gap-2 bg-gradient-to-r from-[#006a3d] to-[#006a3d] hover:opacity-90 transition-opacity text-white cursor-pointer font-semibold px-5 py-3 rounded-lg shadow"
              onClick={() => router.push("/projects/create")}
            >
              <Plus size={20} />
              Create Project
            </button>
          </div>
        </div>
        <div className="text-base md:text-lg text-black mb-8">
          Complete Fun Projects and Earn Feedback{" "}
          <span className="align-middle">🏅✨</span>
        </div>

        {/* User Created Projects */}
        <div className="flex items-center justify-between mb-4 mt-8 gap-4">
          <h3 className="text-xl font-bold text-black">Your Created Projects</h3>
          <a
            href="#"
            className="font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-[#006a3d] to-[#006a3d] flex-shrink-0"
            onClick={(e) => {
              e.preventDefault();
              router.push('/projects/all');
            }}
          >
            View all 
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.627 8.75H0.5V7.25H12.627L6.93075 1.55375L8 0.5L15.5 8L8 15.5L6.93075 14.4462L12.627 8.75Z" fill="url(#paint0_linear_1309_2563)"/>
              <defs>
                <linearGradient id="paint0_linear_1309_2563" x1="0.5" y1="8" x2="15.5" y2="8" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#006a3d"/>
                  <stop offset="1" stopColor="#006a3d"/>
                </linearGradient>
              </defs>
            </svg>
          </a>
        </div>
        <div className="mb-10 py-4">
          <div className="flex flex-row gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 overflow-x-clip">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                <span className="text-black">Loading your projects...</span>
              </div>
            ) : userProjects.length === 0 ? (
              <div className="text-black text-center py-8">No projects created yet.</div>
            ) : (
              userProjects.slice(0, 2).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={{
                    title: project.title,
                    subject: project.subject,
                    description: project.description || `Class ${project.class} - ${project.persona}`,
                    downloadUrl: project.pdfUrl,
                    class: project.class,
                    persona: project.persona,
                  }}
                  onDownload={() => window.open(project.pdfUrl, '_blank')}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
