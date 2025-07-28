"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { Poppins } from "next/font/google";
import { Mail, Lock } from "lucide-react";

const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"] });

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/users/auth/login`, { email, password });
      Cookies.set("auth", JSON.stringify({ token: res.data.data.token }), { expires: 1 });
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Implement Google sign-in logic
  };

  return (
    <div className={`${poppins.className} min-h-screen flex flex-col md:flex-row bg-white`}>
      
      {/* Left Illustration Panel */}
      <div className="w-full md:w-1/2  flex items-center justify-center p-10">
        <img
          src="/images/login_new_image.svg" // Replace with the correct image shown in the design
          alt="Login Illustration"
          className="max-w-[400px] w-full h-auto"
        />
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardHeader className="text-left mb-4">
            <h1 className="text-3xl font-bold text-black leading-tight">
              SIGN IN TO YOUR <span className="text-[#FFA902]">ADVENTURE!</span>
            </h1>
          </CardHeader>
          <CardContent className="space-y-5">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div className="mb-3">
                <Input
                  type="email"
                  placeholder="Enter your E - mail Id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#E5E5E5]  rounded-lg py-6 bg-white text-gray-700"
                />
              </div>
              <div className="mb-3">
                <Input
                  type="password"
                  placeholder="Enter your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white text-gray-700"
                />
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFA903] cursor-pointer hover:bg-yellow-600 text-white font-normal py-4 rounded-lg transition"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-sm">Or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-[#FCEED5] cursor-pointer hover:bg-[#f7dfb3] border border-gray-200 text-gray-700 flex items-center justify-center gap-2 rounded-lg py-3"
            >
              <img src="/images/googleLogo.svg" alt="Google" className="w-5 h-5" />
              Google
            </Button>

            <div className="text-center text-sm text-gray-500">
              Don’t have an account?{" "}
              {/* <a href="/register" className="text-[#FFA903] font-normal underline">
                Sign up
              </a> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
