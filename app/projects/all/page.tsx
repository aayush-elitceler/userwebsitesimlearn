"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ContentCard from "@/components/ContentCard";
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



export default function AllProjectsPage() {
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        console.log("Fetching all user projects...");
        const response = await axios.get('/users/projects');

        const data = response.data;
        console.log("Projects API Response data:", data);

        if (data.success && data.data && data.data["user-generated"]) {
          // Reverse the array to show newest first
          setUserProjects(data.data["user-generated"].reverse());
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          redirectToLogin();
        } else {
          console.error("Error fetching projects:", error);
          if (error instanceof Error) {
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
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
                className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Create Your First Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userProjects.map((project) => (
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
                showScoreAndDate={true}
                onDownload={(url) => window.open(url, '_blank')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
