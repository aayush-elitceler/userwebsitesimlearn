"use client";
import ContentCard from "@/components/ContentCard";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios, { redirectToLogin } from '@/lib/axiosInstance';


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
  subject: string | null;
  description?: string | null;
  createdAt: string;
  pdfUrl: string;
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
        const response = await axios.get('/users/projects');

        const data = response.data;

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
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          redirectToLogin();
        } else {
          console.error("Error fetching projects:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen w-full px-4 md:px-12 py-8 bg-background">
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
              <ContentCard
                key={project.id}
                content={{
                  ...project,
                  subject: project.subject || undefined,
                  description: project.description || undefined,
                  type: 'project',
                  downloadUrl: project.projectUrl,
                }}
                type="project"
                showScoreAndDate={true}
                onDownload={(url) => window.open(url, '_blank')}
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

