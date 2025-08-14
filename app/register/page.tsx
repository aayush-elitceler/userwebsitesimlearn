"use client";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"] });
const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ""; // set in .env

export default function Register() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const [showCalendar, setShowCalendar] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

   const toggleCalendar = () => {
    setShowCalendar(true);
    dateInputRef.current?.showPicker?.(); // Works in modern browsers
  };

  
  // Step 1 form
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Steps 2–4 form
  const [formData, setFormData] = useState({
    studentName: "",
    dob: "",
    gender: "",
    class: "",
    section: "",
    schoolEmail: "",
    phone: "",
    altPhone: "",
    photo: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Country codes for phone numbers
  const countryCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+61", country: "Australia" },
    { code: "+86", country: "China" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+39", country: "Italy" },
    { code: "+34", country: "Spain" },
  ];

  // Class options
  const classOptions = [
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
    "Class 11", "Class 12", "UG", "PG"
  ];

  const handleAccountChange = (field: string, value: string) => {
    setAccountData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChange = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Safe image upload validation
  const MAX_FILE_SIZE_MB = 2;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Only JPG, PNG, or WebP images are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = "";
      return;
    }
    handleChange("photo", file);
  };

  const handleStep1Submit = async () => {
    // If already registered, just move to next step
    if (isRegistered && token) {
      setStep(2);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: accountData.name,
        email: accountData.email,
        password: accountData.password,
      };
      const res = await fetch(`${baseURL}/users/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || "Registration failed");

      const token = data?.data?.token;
      if (token) {
        setToken(token);
        setIsRegistered(true);
        setStep(2);
      } else {
        throw new Error("No token returned from API");
      }
    } catch (err: Error | unknown) {
      console.error("Registration error:", err);
      alert(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const checkProfileCompletion = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${baseURL}/users/auth/get-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      if (data?.isRegistrationCompleted) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (step === 2) checkProfileCompletion();
  }, [step]);

  const handleFinalSubmit = async () => {
  if (!token) {
    alert("No auth token");
    return;
  }

  // File size check
  if (formData.photo && formData.photo.size > 2 * 1024 * 1024) {
    alert("Image size must be less than 2MB");
    return;
  }

  // Validate phone format (basic validation)
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(formData.phone) || !phoneRegex.test(formData.altPhone)) {
    alert("Phone numbers must be 10 digits.");
    return;
  }

  // Email check (removed .edu restriction)
  if (!/\S+@\S+\.\S+/.test(formData.schoolEmail)) {
    alert("Invalid school email address");
    return;
  }

  try {
    setLoading(true);
    const fd = new FormData();
    fd.append("name", formData.studentName.trim());
    fd.append("dob", formData.dob); // YYYY-MM-DD
    fd.append("gender", formData.gender.toUpperCase()); 
    fd.append("class", formData.class.trim());
    fd.append("section", formData.section.trim().toUpperCase()); // Ensure A/B/C uppercase
    fd.append("schoolMailId", formData.schoolEmail.trim());
    fd.append("phone", "+91" + formData.phone); // Add country code
    fd.append("alternatePhone", "+91" + formData.altPhone); // Add country code
    if (formData.photo) {
      fd.append("profilePic", formData.photo);
    }

    const res = await fetch(`${baseURL}/users/auth/update-profile`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.message || "Profile update failed");
    }

    router.push("/");
  } catch (err: Error | unknown) {
    alert(err instanceof Error ? err.message : "Profile update failed");
  } finally {
    setLoading(false);
  }
};

  // Function to go back to previous step
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Function to handle next step navigation
  const handleNextStep = () => {
    if (step === 1) {
      handleStep1Submit();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div
      className={`${poppins.className} min-h-screen flex flex-col md:flex-row`}
      style={{
        background: "linear-gradient(180deg, #FFF0D3 11%, #FEF9F3 100%)",
      }}
    >
      {/* Left Illustration */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-10">
        <img
          src="/images/login_new_image.svg"
          alt="Register Illustration"
          className="max-w-[723px] w-full h-auto"
        />
      </div>

      {/* Right Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardHeader className="text-left mb-4">
            <h1 className="text-[45px] font-bold text-black leading-tight">
              SIGN UP TO YOUR <span className="text-[#FFA902]">ADVENTURE!</span>
            </h1>
          </CardHeader>

          <CardContent className="space-y-5">
                         {/* Stepper */}
             <div 
               className="relative w-full p-6 rounded-lg"
               style={{
                 background: "linear-gradient(90deg, rgba(255, 159, 39, 0.12) 0%, rgba(255, 81, 70, 0.12) 100%)"
               }}
             >
                             <div className="absolute top-10 left-6 right-6 h-[2px] bg-gray-300 z-0" />
               <div
                 className="absolute top-10 left-6 h-[2px] bg-red-500 z-0 transition-all duration-300"
                 style={{ width: `calc(${((step - 1) / 3) * 100}% - 48px)` }}
               />
               <div className="relative flex justify-between z-10 px-4">
                {["Basic Information", "Academic Details", "Contact Details", "Photo Upload"].map(
                  (label, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = step > stepNumber;
                    const isActive = step === stepNumber;
                    return (
                      <div key={label} className="flex flex-col items-center text-center">
                        <span
                          className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-medium
                          ${
                            isActive
                              ? "border-[#FF5146] bg-white text-[#FF5146]"
                              : isCompleted
                              ? "border-[#FF5146] bg-[#FF5146] text-white"
                              : "border-[#FF5146] bg-white text-[#FF5146]"
                          }`}
                        >
                          {stepNumber}
                        </span>
                        <span
                          className={`text-xs mt-2 px-1 ${
                            isActive || isCompleted ? "text-[#FF5146] font-medium" : "text-gray-600"
                          }`}
                          style={{
                            fontSize: 'clamp(10px, 2vw, 12px)',
                            lineHeight: '1.2'
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Step Content */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter your name"
                    value={accountData.name}
                    onChange={(e) => handleAccountChange("name", e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={accountData.email}
                    onChange={(e) => handleAccountChange("email", e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={accountData.password}
                    onChange={(e) => handleAccountChange("password", e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Student Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter student name"
                    value={formData.studentName}
                    onChange={(e) => handleChange("studentName", e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div
                    className="w-full border border-[#E5E5E5] rounded-lg bg-white flex items-center justify-between px-4 py-3 cursor-pointer relative"
                    onClick={toggleCalendar}
                  >
                    <span className={formData.dob ? "text-gray-700" : "text-gray-400"}>
                      {formData.dob || "Select date of birth"}
                    </span>
                    <img
                      src="/images/calendar_month.svg"
                      alt="Calendar"
                      className="w-5 h-5 pointer-events-none"
                    />
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleChange("dob", e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg py-3 px-1 bg-white text-gray-700"
                    aria-label="Gender selection"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.class}
                    onChange={(e) => handleChange("class", e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg py-3 px-1 bg-white text-gray-700"
                    aria-label="Class selection"
                  >
                    <option value="">Select class</option>
                    {classOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter section (e.g., A, B, C)"
                    value={formData.section}
                    onChange={(e) => handleChange("section", e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    School Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter school email"
                    value={formData.schoolEmail}
                    onChange={(e) => handleChange("schoolEmail", e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select 
                      className="border border-[#E5E5E5] rounded-lg py-3 px-2 bg-white text-gray-700 min-w-[80px]"
                      aria-label="Country code"
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.code}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="Enter 10-digit phone number"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleChange("phone", value);
                      }}
                      className="flex-1 border border-[#E5E5E5] rounded-lg py-6 bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Alternative Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select 
                      className="border border-[#E5E5E5] rounded-lg py-3 px-2 bg-white text-gray-700 min-w-[80px]"
                      aria-label="Alternative phone country code"
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.code}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="Enter 10-digit phone number"
                      value={formData.altPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleChange("altPhone", value);
                      }}
                      className="flex-1 border border-[#E5E5E5] rounded-lg py-6 bg-white"
                    />
                  </div>
                </div>
              </>
            )}

                         {step === 4 && (
               <div className="flex flex-col items-center">
                 <label className="text-sm font-medium text-gray-700 mb-4">
                   Profile Photo <span className="text-gray-400">(Optional)</span>
                 </label>
                 <label
                   htmlFor="photo"
                   className="w-48 h-48 border-2 border-dashed border-orange-300 rounded-full flex items-center justify-center cursor-pointer"
                 >
                   {formData.photo ? (
                     <img
                       src={URL.createObjectURL(formData.photo)}
                       alt="Preview"
                       className="w-full h-full object-cover rounded-full"
                     />
                   ) : (
                     <img
                       src="/images/camera.svg"
                       alt="Camera"
                       className="w-12 h-12"
                       style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' }}
                     />
                   )}
                 </label>
                 <input
                   type="file"
                   id="photo"
                   className="hidden"
                   accept="image/*"
                   onChange={handlePhotoChange}
                 />
                 <Button
                   variant="outline"
                   className="mt-4 bg-[#FF5146] text-white hover:bg-red-600 rounded-full px-6"
                 >
                   Add photo
                 </Button>
               </div>
             )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-2">
              {step > 1 && (
                <Button
                  type="button"
                  onClick={goBack}
                  className="bg-gray-500 text-white py-6 px-6 rounded-lg"
                >
                  Back
                </Button>
              )}
                             {step < 4 && (
                 <Button
                   type="button"
                   onClick={handleNextStep}
                   className={`bg-gradient-to-r from-orange-400 to-red-400 text-white py-6 px-6 rounded-lg ${step === 1 ? 'w-full' : 'flex-1'}`}
                   disabled={loading}
                 >
                   {loading ? "Loading..." : "Next"}
                 </Button>
               )}
              {step === 4 && (
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="w-full bg-gradient-to-r from-orange-400 to-red-400 text-white py-6 rounded-lg"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Sign up"}
                </Button>
              )}
            </div>

            <div className="text-center text-sm text-black">
              Already have an account?{" "}
              <span onClick={() => router.push("/login")} className="text-[#FF6B6B] cursor-pointer">
                Sign In
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
