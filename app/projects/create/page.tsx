"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

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
      const token = getTokenFromCookie();
      if (!token) {
        setError('No auth token found. Please login.');
        setLoading(false);
        setShowModal(false);
        return;
      }

      console.log("Creating project with data:", body);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/projects/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("API Response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("API Response data:", data);
        
        // Open PDF in new tab if available
        const pdfUrl = data.data?.project?.pdfUrl;
        if (pdfUrl) {
          window.open(pdfUrl, '_blank');
        }
        
        const projectId = data.data?.project?.id || data.project?.id;
        if (projectId) {
          router.push(`/projects/${projectId}`);
        } else {
          // Project created successfully, just redirect to projects page
          setLoading(false);
          setShowModal(false);
          router.push("/projects");
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("API Error:", errorData);
        setError(`Failed to create project: ${errorData.message || res.statusText}`);
        setLoading(false);
      }
    } catch (error) {
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
  };

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
                {/* Loading Spinner */}
                <div className='mb-6'>
                  <img 
                    src="/images/loadingSpinner.svg" 
                    alt="Loading" 
                    className='w-24 h-24 animate-spin'
                  />
                </div>

                <div className='text-black font-semibold text-lg mb-6'>
                  Generating your project....
                </div>

                {/* Project Details */}
                <div className='flex flex-col gap-3 mb-8'>
                  <div className='flex items-center gap-3 bg-muted rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/>
                      <polyline points='14,2 14,8 20,8'/>
                      <line x1='16' y1='13' x2='8' y2='13'/>
                      <line x1='16' y1='17' x2='8' y2='17'/>
                      <polyline points='10,9 9,9 8,9'/>
                    </svg>
                    <span className='text-foreground font-medium'>{form.subject || 'Subject'}</span>
                  </div>

                  <div className='flex items-center gap-3 bg-muted rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path d='M9 12l2 2 4-4'/>
                      <path d='M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z'/>
                      <path d='M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z'/>
                      <path d='M12 3c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 1 2 2z'/>
                      <path d='M12 21c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z'/>
                    </svg>
                    <span className='text-foreground font-medium'>{form.persona}</span>
                  </div>

                  <div className='flex items-center gap-3 bg-muted rounded-lg px-4 py-2'>
                    <svg className='w-5 h-5 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'/>
                    </svg>
                    <span className='text-foreground font-medium'>Class {form.class}</span>
                  </div>
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

// Utility to get token from 'auth' cookie
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
