"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

type FormState = {
  studentName: string;
  gender: string;
  dob: string;
  class: string;
  section: string;
  schoolMail: string;
  phone: string;
  altPhone: string;
  password: string;
  photo: File | null;
};

const steps = [
  "Basic Information",
  "Academic Details",
  "Contact Details",
  "Photo Upload",
];

const initialForm: FormState = {
  studentName: "",
  gender: "",
  dob: "",
  class: "",
  section: "",
  schoolMail: "",
  phone: "",
  altPhone: "",
  password: "",
  photo: null,
};

const iconClass = "absolute left-5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none";
const inputClass =
  "bg-[#888888]/60 p-6 rounded-2xl border-none pl-12 text-white placeholder:text-white/80 input-shadow w-full text-lg font-medium";

const Stepper = ({ completed }: { step: number, completed: boolean[] }) => (
  <div className="w-full mb-8 relative">
    {/* Full yellow line behind all steps */}
    <div className="absolute top-1/2 left-0 right-0 h-0.5 point-ask-gradient z-0" style={{ transform: 'translateY(-50%)' }} />
    <div className="flex items-center justify-between gap-x-8 bg-[#888888]/60 rounded-2xl px-4 py-3 relative z-10 overflow-x-auto">
      {steps.map((label, idx) => (
        <div key={label} className="flex flex-col items-center flex-1 relative min-w-[80px]">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${completed[idx] ? 'point-ask-gradient' : 'bg-[#888888] border-2 border-[#fff]'}`}
          >
            {completed[idx] ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6.5L5 8.5L9 4.5" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : null}
          </div>
          <span className="text-base mt-2 text-white font-medium whitespace-nowrap px-2">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

function isStepComplete(step: number, form: typeof initialForm) {
  if (step === 0) return !!(form.studentName && form.gender && form.dob);
  if (step === 1) return !!(form.class && form.section && form.schoolMail);
  if (step === 2) return !!(form.phone && form.altPhone && form.password);
  if (step === 3) return !!form.photo;
  return false;
}

const InstitutionalRegistrationForm = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "photo" && files && files[0]) {
      setForm((prev) => ({ ...prev, photo: files[0] }));
      setPhotoPreview(URL.createObjectURL(files[0]));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Compute completed steps for the stepper
  const completed = steps.map((_, idx) => isStepComplete(idx, form));

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < steps.length - 1 && isStepComplete(step, form)) setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => s - 1);
  const handlePhotoClick = () => fileInputRef.current?.click();

  // Disable Next unless current step is complete
  const nextDisabled = !isStepComplete(step, form);

  return (
    <form className="w-full max-w-2xxl mx-auto" onSubmit={handleNext}>
      <Stepper step={step} completed={completed} />
      {step === 0 && (
        <div className="space-y-6">
          {/* Student Name */}
          <div className="relative">
            <span className={iconClass}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="none"/><path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2"/></svg>
            </span>
            <input
              type="text"
              name="studentName"
              placeholder="Student Name"
              value={form.studentName}
              onChange={handleChange}
              className={inputClass}
              autoComplete="off"
            />
          </div>
          {/* Date of Birth */}
          <div className="relative">
            <span className={iconClass}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="none"/><rect x="3" y="4" width="18" height="18" rx="2" stroke="#fff" strokeWidth="2"/><path stroke="#fff" strokeWidth="2" d="M16 2v4M8 2v4M3 10h18"/></svg>
            </span>
            <input
              type="date"
              name="dob"
              placeholder="Date of Birth"
              value={form.dob}
              onChange={handleChange}
              className={inputClass}
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="none"/><rect x="3" y="4" width="18" height="18" rx="2" stroke="#fff" strokeWidth="2"/><path stroke="#fff" strokeWidth="2" d="M16 2v4M8 2v4M3 10h18"/></svg>
            </span>
          </div>
          {/* Gender */}
          <div className="relative">
            <span className={iconClass}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="none"/><path d="M12 12v8" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2"/></svg>
            </span>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={inputClass + " appearance-none"}
              aria-label="Gender selection"
            >
              <option value="" disabled>Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth="2"/></svg>
            </span>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-6">
          {/* Class */}
          <div className="relative">
            <span className={iconClass}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="none"/><rect x="6" y="10" width="12" height="4" rx="2" stroke="#fff" strokeWidth="2"/></svg>
            </span>
            <input
              type="text"
              name="class"
              placeholder="Class"
              value={form.class}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          {/* Section */}
          <div className="relative">
            <span className={iconClass}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="none"/><rect x="6" y="10" width="12" height="4" rx="2" stroke="#fff" strokeWidth="2"/></svg>
            </span>
            <input
              type="text"
              name="section"
              placeholder="Section"
              value={form.section}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          {/* School Mail ID */}
          <div className="relative">
            <span className={iconClass}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="none"/><rect x="4" y="7" width="16" height="10" rx="2" stroke="#fff" strokeWidth="2"/><path d="M4 7l8 6 8-6" stroke="#fff" strokeWidth="2"/></svg>
            </span>
            <input
              type="email"
              name="schoolMail"
              placeholder="School Mail ID"
              value={form.schoolMail}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-6">
          {/* Phone Number */}
          <div className="relative">
            <span className={iconClass}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="none"/><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1C7.61 21 3 16.39 3 10.5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.35.27 2.67.76 3.88a1 1 0 0 1-.21 1.11l-2.2 2.2z" stroke="#fff" strokeWidth="2"/></svg>
            </span>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          {/* Alternative Mobile Number */}
          <div className="relative">
            <span className={iconClass}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="none"/><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1C7.61 21 3 16.39 3 10.5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.35.27 2.67.76 3.88a1 1 0 0 1-.21 1.11l-2.2 2.2z" stroke="#fff" strokeWidth="2"/></svg>
            </span>
            <input
              type="tel"
              name="altPhone"
              placeholder="Alternative Mobile Number"
              value={form.altPhone}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          {/* Create Password */}
          <div className="relative">
            <span className={iconClass}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="none"/><rect x="6" y="10" width="12" height="8" rx="2" stroke="#fff" strokeWidth="2"/><path d="M12 16v-4" stroke="#fff" strokeWidth="2"/></svg>
            </span>
            <input
              type="password"
              name="password"
              placeholder="Create Password"
              value={form.password}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="flex flex-col items-center space-y-6">
          <div className="w-full flex flex-col items-center">
            <div
              className="w-full bg-[#888888]/60 rounded-2xl flex flex-col items-center justify-center py-8 relative"
              style={{ minHeight: 220 }}
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={handlePhotoClick}
              >
                <div className="border-2 border-dashed border-white/60 rounded-full w-40 h-40 flex items-center justify-center mb-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-36 h-36 object-cover rounded-full" />
                  ) : (
                    <svg width="64" height="64" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" stroke="#fff" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2"/><rect x="8" y="8" width="8" height="8" rx="2" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#fff" strokeWidth="2"/></svg>
                  )}
                </div>
                <Button
                  type="button"
                  className="point-ask-gradient text-black font-semibold rounded-full px-8 py-2 text-lg mt-2"
                >
                  Add photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="photo"
                  accept="image/*"
                  className="hidden"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between mt-10">
        {step > 0 && (
          <Button
            type="button"
            onClick={handleBack}
            className="rounded-2xl px-8 py-3 bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
          >
            Back
          </Button>
        )}
        <Button
          type={step === steps.length - 1 ? "submit" : "button"}
          className="rounded-2xl px-8 py-3 point-ask-gradient text-white font-semibold ml-auto text-lg hover:opacity-90"
          onClick={step === steps.length - 1 ? undefined : handleNext}
          disabled={nextDisabled}
        >
          {step === steps.length - 1 ? "Sign up" : "Next"}
        </Button>
      </div>
    </form>
  );
};

export default InstitutionalRegistrationForm;
