"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Project {
  id: string;
  title: string;
  subject: string;
  description: string;
  class: string;
  persona: string;
  pdfUrl: string;
  createdAt: string;
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setError("Authentication required");
          return;
        }

        const projectId = params.id as string;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setProject(data.data);
          } else {
            setError("Project not found");
          }
        } else {
          setError("Failed to load project");
        }
      } catch (e) {
        console.error("Error fetching project:", e);
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/projects")}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/projects")}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-transparent bg-clip-text">
              {project.title}
            </h1>
            <button
              onClick={() => router.push("/projects")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              ← Back to Projects
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Project Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-600">Subject:</span>
                  <span className="ml-2 text-gray-800">{project.subject}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Class:</span>
                  <span className="ml-2 text-gray-800">{project.class}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Persona:</span>
                  <span className="ml-2 text-gray-800">{project.persona}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created:</span>
                  <span className="ml-2 text-gray-800">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={project.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 point-ask-gradient text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-[#16a34a] transition shadow"
              >
                📄 Download Project PDF
              </a>
              <button
                onClick={() => router.push("/projects")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Create Another Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
