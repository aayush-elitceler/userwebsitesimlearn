"use client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const subjectColors: Record<string, string> = {
  Maths: "#4A90E2",
  Math: "#4A90E2",
  Science: "#8F5AFF",
  English: "#F44336",
  EVS: "#E6AF3F",
  Physics: "#F5A623",
  Default: "#E6AF3F",
};

interface TeacherProject {
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

export default function ProjectsPage() {
  const [teacherProjects, setTeacherProjects] = useState<TeacherProject[]>([]);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        if (!token) return;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/projects`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (data.success && data.data) {
          if (data.data.teacherAssigned) {
            setTeacherProjects(data.data.teacherAssigned);
          }
          if (data.data["user-generated"]) {
            setUserProjects(data.data["user-generated"]);
          }
        }
      } catch (e) {
        console.error("Error fetching projects:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-black mb-2">Projects</h2>
        <button
          className="fixed top-6 right-6 cursor-pointer z-50 flex items-center gap-2 point-ask-gradient hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-lg shadow transition"
          onClick={() => router.push("/projects/create")}
        >
          <Plus size={20} />
          Create Project
        </button>
        <div className="text-lg text-black mb-8">
          Complete Fun Projects and Earn Feedback{" "}
          <span className="align-middle">🏅✨</span>
        </div>

        {/* Assigned Projects */}
        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-xl font-bold text-black">
            Teacher Assigned Projects
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {loading ? (
            <div className="text-black">Loading...</div>
          ) : teacherProjects.length === 0 ? (
            <div className="text-black">No assigned projects.</div>
          ) : (
            teacherProjects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                subject={project.subject}
                description={project.description}
                deadline={project.deadline}
                downloadUrl={project.projectUrl}
              />
            ))
          )}
        </div>

        {/* User Projects */}
        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-xl font-bold text-black">
            Your Created Projects
          </h3>
        </div>
        <div className="overflow-x-auto scrollbar-hide mb-10 pb-4 w-full">
          <div className="flex flex-row flex-nowrap gap-8 w-max ">
            {loading ? (
              <div className="text-black">Loading previous quizzes...</div>
            ) : userProjects.length === 0 ? (
              <div className="text-black">No previous quizzes.</div>
            ) : (
              userProjects.map((project) => {
                return (
                  <ProjectCard
                    key={project.id}
                    title={project.title}
                    subject={project.subject}
                    description={
                      project.description ||
                      `Class ${project.class} - ${project.persona}`
                    }
                    deadline={null}
                    downloadUrl={project.pdfUrl}
                  />
                );
              })
            )}
          </div>
        </div>
        {/* <div className="overflow-x-auto ">
          <div className="flex gap-6 pb-2 pr-4 w-max min-w-full">
            {loading ? (
              <div className="text-black">Loading...</div>
            ) : userProjects.length === 0 ? (
              <div className="text-black">No user-created projects.</div>
            ) : (
              userProjects.map((project) => (
                <div key={project.id} className="min-w-[340px] max-w-[400px]">
                  <ProjectCard
                    title={project.title}
                    subject={project.subject}
                    description={
                      project.description ||
                      `Class ${project.class} - ${project.persona}`
                    }
                    deadline={null}
                    downloadUrl={project.pdfUrl}
                  />
                </div>
              ))
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}

// Reusable card component
function ProjectCard({
  title,
  subject,
  description,
  deadline,
  downloadUrl,
}: {
  title: string;
  subject: string;
  description: string;
  deadline: string | null;
  downloadUrl: string;
}) {
  return (
    <div className="flex flex-row items-center bg-white rounded-2xl p-6 shadow-lg min-w-[340px] max-w-full">
      <div className="flex-1">
        <div className="text-black font-semibold text-sm mb-1">
          Subject: {subject || "-"}
        </div>
        <div className="text-2xl font-semibold bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-transparent bg-clip-text">
          {title}
        </div>
        <div className="text-black mb-2">{description}</div>
        <div className="text-black text-sm mb-4 flex items-center gap-2">
          <span>
            🗓️ Deadline:{" "}
            {deadline ? new Date(deadline).toLocaleDateString() : "-"}
          </span>
        </div>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block point-ask-gradient text-white cursor-pointer rounded-full px-6 py-2 font-semibold shadow hover:bg-[#16a34a] transition"
        >
          Download project
        </a>
      </div>
      <div className="ml-6 flex-shrink-0 relative">
        <div
          className="rounded-2xl flex items-center justify-center w-40 h-28 md:w-44 md:h-32 text-black text-xl font-bold shadow-lg relative overflow-hidden"
          style={{
            background: subjectColors[subject] || subjectColors.Default,
            minWidth: 140,
          }}
        >
          <span className="z-10 text-lg font-semibold tracking-wide">
            {subject}
          </span>
          <svg
            width="100"
            height="100"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 z-0"
            style={{ pointerEvents: "none" }}
          >
            <circle
              cx="50"
              cy="50"
              r="48"
              stroke="#fff"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="30"
              stroke="#fff"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
