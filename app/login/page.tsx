"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import LoaderOverlay from "@/components/ui/Loader";
import { Poppins } from "next/font/google";
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
    }
    finally {
      setLoading(false);
    }
  };

  // Google sign-in handler placeholder
  const handleGoogleSignIn = () => {
    // Implement Google sign-in logic here
  };

  return (
    <div
      className={`${poppins.className} min-h-screen w-full flex flex-col md:flex-row bg-[#0B0B1F]`}
      style={{ backgroundImage: "url('/images/newBg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Left: Illustration */}
      <div className="hidden md:flex flex-1 items-center justify-center relative z-10">
        <img
          src="/images/roboLogin.svg"
          alt="AI Robot Illustration"
          className="max-w-[480px] w-full h-auto drop-shadow-2xl"
        />
      </div>
      {/* Mobile Illustration */}
      <div className="flex md:hidden w-full justify-center pt-10">
        <img
          src="/images/roboLogin.svg"
          alt="AI Robot Illustration"
          className="max-w-[320px] w-full h-auto drop-shadow-2xl"
        />
      </div>
      {/* Right: Sign-in Form */}
      <div className="flex flex-1 items-center justify-center z-20 px-4 py-12 md:py-0">
        <Card className="w-full max-w-md rounded-4xl shadow-xl  backdrop-blur-md border-0">
          <CardHeader className="text-left mt-6 md:mt-10">
            <div className="text-3xl md:text-4xl text-white font-bold mb-2 leading-tight">
              SIGN IN TO YOUR <span className="text-[#007437]">ADVENTURE!</span>
            </div>
            {/* <div className="text-gray-500 text-sm font-normal">Enter your E - mail Id and Password to get started</div> */}
          </CardHeader>
          <CardContent className="space-y-4 mt-2">
            <Input
              type="email"
              placeholder="Enter your E - mail Id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/80 p-6 rounded-md border border-[#EDF1F3] placeholder:text-gray-500 input-shadow"
              />
            <Input
              type="password"
              placeholder="Enter your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/80 p-6 rounded-md border border-[#EDF1F3] placeholder:text-gray-500"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button
              onClick={handleLogin}
              className="w-full py-2 text-lg font-normal rounded-md cursor-pointer p-6 mt-2"
              style={{
                background: "#007437",
                color: "white",
                border: "none",
              }}
            >
              Sign in
            </Button>
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-xs">Or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <Button
              variant="outline"
              className="w-full flex cursor-pointer items-center justify-center gap-2 rounded-full py-5 text-base font-medium border-gray-300 bg-gray-100 hover:bg-gray-200"
              onClick={handleGoogleSignIn}
              type="button"
            >
              <img src="/images/googleLogo.svg" alt="Google" className="w-5 h-5" />
              Google
            </Button>
            <div className="text-center text-xs text-gray-400 mt-2">
              By registering you with our <a href="#" className="text-[#007437] underline">Terms and Conditions</a>
            </div>
          </CardContent>
        </Card>
        {loading && <LoaderOverlay />}
      </div>
    </div>
  );
}
