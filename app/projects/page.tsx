"use client";
import React, { useEffect, useState } from "react";

const subjectColors: Record<string, string> = {
  Maths: "#4A90E2",
  Math: "#4A90E2",
  Science: "#8F5AFF",
  English: "#F44336",
  EVS: "#E6AF3F",
  // fallback
  Default: "#E6AF3F",
};

interface Project {
  id: string;
  subject: string;
  title: string;
  description: string;
  deadline: string | null;
  createdAt: string;
  projectUrl: string;
  teacher: {
    name: string;
    email: string;
  };
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data && data.data.projects) {
          setProjects(data.data.projects);
        }
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  // For demo, treat all as upcoming if no completed flag
  const upcoming = projects;
  const previous: Project[] = [];

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-gradient-to-br from-[#181c24] to-[#1a2a22]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">Projects</h2>
        <div className="text-lg text-white mb-8">Complete Fun Projects and Earn Feedback<span className="align-middle">🏅✨</span></div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Upcoming projects</h3>
          <a href="#" className="text-white font-semibold flex items-center gap-1 hover:underline">View all <span>→</span></a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {loading ? (
            <div className="text-white">Loading...</div>
          ) : upcoming.length === 0 ? (
            <div className="text-white">No upcoming projects.</div>
          ) : (
            upcoming.map((project) => (
              <div key={project.id} className="flex flex-row items-center bg-[#393e3a] rounded-2xl p-6 shadow-lg min-w-[340px] max-w-full">
                <div className="flex-1">
                  <div className="text-green-400 font-semibold text-sm mb-1">Subject: {project.subject || "-"}</div>
                  <div className="text-2xl font-bold text-white mb-2">{project.title}</div>
                  <div className="text-white mb-2">{project.description}</div>
                  <div className="text-gray-200 text-sm mb-4 flex items-center gap-2">
                    <span>🗓️ Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : "-"}</span>
                  </div>
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-[#1ec773] text-black rounded-full px-6 py-2 font-semibold shadow hover:bg-[#16a34a] transition"
                  >
                    Download project
                  </a>
                </div>
                <div className="ml-6 flex-shrink-0 relative">
                  <div
                    className="rounded-2xl flex items-center justify-center w-40 h-28 md:w-44 md:h-32 text-white text-xl font-bold shadow-lg relative overflow-hidden"
                    style={{ background: subjectColors[project.subject] || subjectColors.Default, minWidth: 140 }}
                  >
                    <span className="z-10 text-lg font-semibold tracking-wide">{project.subject || "-"}</span>
                    <svg width="100" height="100" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 z-0" style={{pointerEvents:'none'}}><circle cx="50" cy="50" r="48" stroke="#fff" strokeWidth="2" fill="none"/><circle cx="50" cy="50" r="30" stroke="#fff" strokeWidth="1" fill="none"/></svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-xl font-bold text-white">Previous Projects</h3>
          <a href="#" className="text-white font-semibold flex items-center gap-1 hover:underline">View all <span>→</span></a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            <div className="text-white">Loading...</div>
          ) : previous.length === 0 ? (
            <div className="text-white">No previous projects.</div>
          ) : (
            previous.map((project) => (
              <div key={project.id} className="flex flex-row items-center bg-[#393e3a] rounded-2xl p-6 shadow-lg min-w-[340px] max-w-full">
                <div className="flex-1">
                  <div className="text-green-400 font-semibold text-sm mb-1">Subject: {project.subject || "-"}</div>
                  <div className="text-2xl font-bold text-white mb-2">{project.title}</div>
                  <div className="text-white mb-2">{project.description}</div>
                  <div className="text-gray-200 text-sm mb-4 flex items-center gap-2">
                    <span>🗓️ Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : "-"}</span>
                  </div>
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-[#1ec773] text-black rounded-full px-6 py-2 font-semibold shadow hover:bg-[#16a34a] transition"
                  >
                    View project
                  </a>
                </div>
                <div className="ml-6 flex-shrink-0 relative">
                  <div
                    className="rounded-2xl flex items-center justify-center w-40 h-28 md:w-44 md:h-32 text-white text-xl font-bold shadow-lg relative overflow-hidden"
                    style={{ background: subjectColors[project.subject] || subjectColors.Default, minWidth: 140 }}
                  >
                    <span className="z-10 text-lg font-semibold tracking-wide">{project.subject || "-"}</span>
                    <svg width="100" height="100" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 z-0" style={{pointerEvents:'none'}}><circle cx="50" cy="50" r="48" stroke="#fff" strokeWidth="2" fill="none"/><circle cx="50" cy="50" r="30" stroke="#fff" strokeWidth="1" fill="none"/></svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
