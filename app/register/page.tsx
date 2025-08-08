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
        setStep(2);
      } else {
        throw new Error("No token returned from API");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      alert(err.message || "Registration failed");
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

  // Auto-add +91 if not present
  const formatPhone = (num: string) => {
    let clean = num.trim();
    if (!clean.startsWith("+")) {
      clean = "+91" + clean.replace(/^0+/, ""); // remove leading zeros if any
    }
    return clean;
  };

  const phoneFormatted = formatPhone(formData.phone);
  const altPhoneFormatted = formatPhone(formData.altPhone);

  // Validate phone format (after adding +91)
  const phoneRegex = /^\+\d{10,15}$/;
  if (!phoneRegex.test(phoneFormatted) || !phoneRegex.test(altPhoneFormatted)) {
    alert("Phone numbers must be valid and include country code.");
    return;
  }

  // Email check
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
    fd.append("phone", phoneFormatted);
    fd.append("alternatePhone", altPhoneFormatted);
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
  } catch (err: any) {
    alert(err.message || "Profile update failed");
  } finally {
    setLoading(false);
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
            <div className="relative w-full">
              <div className="absolute top-3 left-0 w-full h-[2px] bg-gray-300 z-0" />
              <div
                className="absolute top-3 left-0 h-[2px] bg-red-500 z-0 transition-all duration-300"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
              <div className="relative flex justify-between z-10">
                {["Basic Information", "Academic Details", "Contact Details", "Photo Upload"].map(
                  (label, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = step > stepNumber;
                    const isActive = step === stepNumber;
                    return (
                      <div key={label} className="flex flex-col items-center text-center">
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full border text-xs font-medium
                          ${
                            isActive
                              ? "border-red-500 bg-white text-red-500"
                              : isCompleted
                              ? "border-red-500 bg-red-500 text-white"
                              : "border-gray-400 bg-white text-gray-500"
                          }`}
                        >
                          {stepNumber}
                        </span>
                        <span
                          className={`text-xs mt-1 w-max ${
                            isActive || isCompleted ? "text-red-500" : "text-gray-500"
                          }`}
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
                <Input
                  placeholder="Name"
                  value={accountData.name}
                  onChange={(e) => handleAccountChange("name", e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={accountData.email}
                  onChange={(e) => handleAccountChange("email", e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={accountData.password}
                  onChange={(e) => handleAccountChange("password", e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                />
              </>
            )}

            {step === 2 && (
              <>
                <Input
                  placeholder="Student Name"
                  value={formData.studentName}
                  onChange={(e) => handleChange("studentName", e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                />
                <div
      className="w-full border border-[#E5E5E5] rounded-lg bg-white flex items-center justify-between px-4 py-3 cursor-pointer relative"
      onClick={toggleCalendar}
    >
      <span className={formData.dob ? "text-gray-700" : "text-gray-400"}>
        {formData.dob || "Date of Birth"}
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


                <select
                  value={formData.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-3 px-1 bg-white text-gray-700"
                >
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </>
            )}

            {step === 3 && (
              <>
                <Input
                  placeholder="Class"
                  value={formData.class}
                  onChange={(e) => handleChange("class", e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                />
                <Input
                  placeholder="Section"
                  value={formData.section}
                  onChange={(e) => handleChange("section", e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                />
                <Input
                  type="email"
                  placeholder="School Mail ID"
                  value={formData.schoolEmail}
                  onChange={(e) => handleChange("schoolEmail", e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                />
                <Input
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                />
                <Input
                  placeholder="Alternative Phone Number"
                  value={formData.altPhone}
                  onChange={(e) => handleChange("altPhone", e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white"
                />
              </>
            )}

            {step === 4 && (
              <div className="flex flex-col items-center">
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
                    <span className="text-orange-400">📷</span>
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
                  className="mt-4 bg-red-500 text-white hover:bg-red-600 rounded-full px-6"
                >
                  Add photo
                </Button>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-2">
              {step < 4 && (
                <Button
                  type="button"
                  onClick={() => (step === 1 ? handleStep1Submit() : setStep(step + 1))}
                  className="bg-gradient-to-r w-full from-orange-400 to-red-400 text-white py-6 px-6 rounded-lg"
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
