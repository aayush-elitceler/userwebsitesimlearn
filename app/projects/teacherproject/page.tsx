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
            // Reverse the array to show newest first
            setTeacherProjects(data.data.teacherAssigned.reverse());
          }
          if (data.data["user-generated"]) {
            // Reverse the array to show newest first
            setUserProjects(data.data["user-generated"].reverse());
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
        <div className="text-2xl font-semibold bg-gradient-to-r from-[#006a3d] to-[#006a3d] text-transparent bg-clip-text">
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
