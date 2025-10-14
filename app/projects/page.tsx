"use client";
import { Plus, ArrowRight } from "lucide-react";
import ContentCard from "@/components/ContentCard";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { pageAnimationStyles, getAnimationDelay } from '@/lib/animations';
import axios, { redirectToLogin } from '@/lib/axiosInstance';


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
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        console.log("Fetching projects...");
        const response = await axios.get('/users/projects');

        const data = response.data;
        console.log("Projects API Response data:", data);

        if (data.success && data.data) {
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
          if (axios.isAxiosError(error)) {
            if (error.name === 'AbortError') {
              console.error("Request timed out while fetching projects");
            }
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
              className="flex items-center gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer font-semibold px-5 py-3 rounded-lg shadow"
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
            className="font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity text-sm sm:text-base text-gradient-primary flex-shrink-0"
            onClick={(e) => {
              e.preventDefault();
              router.push('/projects/all');
            }}
          >
            View all
            <ArrowRight className="w-4 h-4 text-gradient-primary" />
          </a>
        </div>
        <div className="mb-10 py-4">
          <div className="flex flex-row gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 ">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                <span className="text-black">Loading your projects...</span>
              </div>
            ) : userProjects.length === 0 ? (
              <div className="text-black text-center py-8">No projects created yet.</div>
            ) : (
              userProjects.slice(0, 2).map((project) => (
                <ContentCard
                  key={project.id}
                  content={{
                    ...project,
                    subject: project.subject || undefined,
                    description: project.description || undefined,
                    type: 'project',
                    downloadUrl: project.pdfUrl,
                  }}
                  type="project"
                  showScoreAndDate={false}
                  onDownload={(url) => window.open(url, '_blank')}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
