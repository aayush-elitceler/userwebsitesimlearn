"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios, { redirectToLogin } from '@/lib/axiosInstance';
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

export default function CreateProjectPage() {
  const router = useRouter();
  const subjectOptions = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Zoology', 'History', 'Economics', 'Civics', 'Geography', 'English'];
  const [form, setForm] = useState({
    title: "",
    class: "",
    persona: "Teacher",
    subject: "",
    customSubject: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowModal(true);

    const body = {
      title: form.title,
      class: form.class,
      persona: form.persona,
      subject: form.subject === 'other' ? form.customSubject : form.subject,
      description: form.description,
    };

    try {
      console.log("Creating project with data:", body);

      const response = await axios.post('/users/projects/generate', body);

      const data = response.data;
      console.log("API Response data:", data);

      if (data.success && data.data?.project) {
        // Open PDF in new tab if available
        const pdfUrl = data.data.project.pdfUrl;
        if (pdfUrl) {
          window.open(pdfUrl, '_blank');
        }

        const projectId = data.data.project.id;
        if (projectId) {
          router.push(`/projects/${projectId}`);
        } else {
          // Project created successfully, just redirect to projects page
          setLoading(false);
          setShowModal(false);
          router.push("/projects");
        }
      } else {
        const errorData = data;
        console.error("API Error:", errorData);
        setError(`Failed to create project: ${errorData.message || 'Unknown error'}`);
        setLoading(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        redirectToLogin();
      } else {
        console.error("Network error:", error);
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setError("Request timed out. The server is taking too long to respond. Please try again.");
          } else {
            setError(`Network error: ${error.message}. Please check your connection and try again.`);
        }
      } else {
        setError("Network error. Please check your connection and try again.");
      }
      setLoading(false);
    }
  };}

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Modal Popup */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
          <div className='rounded-2xl shadow-lg p-8 min-w-[420px] max-w-[90vw] flex flex-col items-center' style={{
            background: 'linear-gradient(180deg, rgba(255, 159, 39, 0.12) 0%, rgba(255, 81, 70, 0.12) 100%)'
          }}>
            {loading ? (
              <>
                <div className='mb-6'>
                  <MultiStepLoader
                    loading={loading}
                    loadingStates={[
                      { text: "Analyzing project requirements" },
                      { text: "Generating project content" },
                      { text: "Creating project structure" },
                      { text: "Preparing project files" },
                      { text: "Finalizing project" },
                    ]}
                    duration={6000}
                    loop={true}
                  />
                </div>

              </>
            ) : error ? (
              <>
                <div className='text-red-400 font-semibold mb-4'>{error}</div>
                <button
                  className='mt-2 px-6 py-2 rounded bg-gray-700 text-black'
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
      <div className='max-w-4xl w-full bg-muted/50 rounded-2xl shadow-lg p-8'>
        <h2 className='text-2xl font-bold text-black mb-2'>Create Project</h2>
        <hr className='border-border mb-6' />
        <form
          onSubmit={handleSubmit}
          className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'
        >
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className='rounded px-3 py-2 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent'
              placeholder="e.g. Law of Motion"
              required
            />
          </div>
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Class</label>
            <select
              name="class"
              value={form.class}
              onChange={handleChange}
              className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
              aria-label="Select class"
              required
            >
              <option value="">Select Class</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((classNum) => (
                <option key={classNum} value={classNum.toString()}>
                {classNum}
                </option>
              ))}
            </select>
          </div>
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Persona</label>
            <select
              name="persona"
              value={form.persona}
              onChange={handleChange}
              className='w-full rounded-lg px-4 py-3 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
              aria-label="Select persona"
            >
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
            </select>
          </div>
          <div className='flex flex-col'>
            <label className='text-black mb-1 font-semibold'>Subject</label>
            <div className='relative'>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className='w-full rounded px-3 py-2 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent appearance-none cursor-pointer pr-8'
                aria-label="Select subject"
                required
              >
                <option value="">Select Subject</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg className='w-4 h-4 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
          </div>
          <div className='flex flex-col md:col-span-2'>
            <label className='text-black mb-1 font-semibold'>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className='rounded px-3 py-2 bg-input text-foreground border border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent'
              rows={4}
              placeholder="Describe the topic..."
              required
            />
          </div>
        </form>
        
        {/* Buttons */}
        <div className='flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-4 border-t border-border'>
          <button
            type='button'
            className='border border-destructive text-destructive rounded-lg px-6 py-3 font-semibold bg-transparent hover:bg-muted transition-all duration-200 min-w-[120px] order-2 sm:order-1'
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type='button'
            className='bg-gradient-primary text-primary-foreground cursor-pointer rounded-lg px-6 py-3 font-semibold shadow hover:opacity-90 hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed min-w-[140px] order-1 sm:order-2'
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
        
        {error && (
          <div className='text-destructive font-semibold mt-4'>{error}</div>
        )}
      </div>
    </div>
  );
}

