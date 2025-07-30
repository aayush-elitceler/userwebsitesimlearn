"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    class: "",
    persona: "Teacher",
    subject: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body = {
      title: form.title,
      class: form.class,
      persona: form.persona,
      subject: form.subject,
      description: form.description,
    };

    try {
      const token = getTokenFromCookie();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/projects/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const projectId = data.data?.id || data.project?.id;
        router.push(`/projects/${projectId}`);
      } else {
        alert("Failed to create project");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-10 w-full max-w-3xl shadow-lg"
      >
        <h2 className="text-3xl font-bold text-black mb-6">Create Project</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-black mb-2">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full p-3 rounded bg-[#FFB12133] text-black"
              placeholder="e.g. Law of Motion"
              required
            />
          </div>
          <div>
            <label className="block text-black mb-2">Class</label>
            <input
              name="class"
              value={form.class}
              onChange={handleChange}
              className="w-full p-3 rounded bg-[#FFB12133] text-black"
              placeholder="e.g. 10"
              required
            />
          </div>
          <div>
            <label className="block text-black mb-2">Persona</label>
            <select
              name="persona"
              value={form.persona}
              onChange={handleChange}
              className="w-full p-3 rounded bg-[#FFB12133] text-black"
            >
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
            </select>
          </div>
          <div>
            <label className="block text-black mb-2">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full p-3 rounded bg-[#FFB12133] text-black"
              placeholder="e.g. Physics"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-black mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full p-3 rounded bg-[#FFB12133] text-black"
              rows={4}
              placeholder="Describe the topic..."
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            className="px-6 py-3 cursor-pointer rounded-lg border border-white text-black"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 cursor-pointer rounded-lg point-ask-gradient hover:bg-[#ffa500] text-white font-semibold"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
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
