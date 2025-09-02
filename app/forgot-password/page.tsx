"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Poppins } from "next/font/google";

const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"] });

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleForgotPassword = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/users/auth/forgot-password`,
        { email }
      );
      setSuccess("Reset link sent to your email!");
    } catch (err) {
      console.error(err);
      setError("Failed to send reset link. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Implement Google sign-in logic
  };

  return (
    <div
      className={`${poppins.className} min-h-screen flex flex-col md:flex-row`}
      style={{
        background: "linear-gradient(180deg, #FFF0D3 11%, #FEF9F3 100%)",
      }}
    >
      {/* Left Illustration Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-10">
        <img
          src="/images/login_new_image.svg" // Replace with your forgot-password illustration
          alt="Forgot Password Illustration"
          className="max-w-[723px] w-full h-auto"
        />
      </div>

      {/* Right Form Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardHeader className="text-left mb-4">
            <h1 className="text-[45px] font-bold text-black leading-tight">
              FORGOT YOUR <span className="text-[#006a3d]">PASSWORD?</span>
            </h1>
          </CardHeader>
          <CardContent className="space-y-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleForgotPassword();
              }}
            >
              <div className="mb-3">
                <Input
                  type="email"
                  required
                  placeholder="Enter your E - mail Id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white text-gray-700"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              {success && (
                <p className="text-green-500 text-sm text-center">{success}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-lg point-ask-gradient cursor-pointer hover:bg-yellow-600 text-white font-normal py-6 rounded-lg transition"
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-black text-sm">Or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white cursor-pointer hover:bg-[#f7dfb3] border border-gray-200 text-gray-700 flex items-center justify-center gap-2 rounded-lg py-3"
            >
              <img
                src="/images/googleLogo.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Google
            </Button>

            <div className="text-center text-sm text-black">
              Don’t have an account?{" "}
              <span
                onClick={() => router.push("/register")}
                className="text-[#006a3d] cursor-pointer"
              >
                Sign Up
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
