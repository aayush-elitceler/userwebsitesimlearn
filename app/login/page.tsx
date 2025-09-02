"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { Poppins } from "next/font/google";
import Link from "next/link";

const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"] });

// At the top of your page file
declare const google: {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      prompt: () => void;
    };
  };
};


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();


const handleGoogleSignIn = () => {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    console.error("Google Client ID not configured");
    return;
  }

  /* global google */
  google.accounts.id.initialize({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    callback: async (response: { credential: string }) => {
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/auth/google/login`,
          { idToken: response.credential }
        );

        // Save both token and user data if available
        if (res.data?.data?.token) {
          Cookies.set("auth", JSON.stringify({ 
            token: res.data.data.token,
            user: res.data.data.user 
          }), {
            expires: 1,
          });
          router.push("/");
        }
      } catch (err) {
        console.error("Google login failed", err);
      }
    }
  });

  google.accounts.id.prompt(); // Opens Google login popup
};




  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/users/auth/login`,
        { email, password }
      );
      
      // Save both token and user data
      Cookies.set("auth", JSON.stringify({ 
        token: res.data.data.token,
        user: res.data.data.user 
      }), {
        expires: 1,
      });
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Invalid Credentials");
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
      {/* Left Illustration Panel */}
      <div className="w-full md:w-1/2  flex items-center justify-center p-10">
        <img
          src="/images/login_new_image.svg" // Replace with the correct image shown in the design
          alt="Login Illustration"
          className="max-w-[723px] w-full h-auto"
        />
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardHeader className="text-left mb-4">
            <h1 className="text-[45px] font-bold text-black leading-tight font-">
              SIGN IN TO YOUR <span className="text-[#006a3d]">ADVENTURE!</span>
            </h1>
          </CardHeader>
          <CardContent className="space-y-5">
            <form
              onSubmit={(e) => {
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
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full border border-[#E5E5E5] rounded-lg py-6 bg-white text-gray-700"
                />
              </div>

              <Link href={"/forgot-password"}  className="flex justify-end text-[#000000] text-sm mb-3 cursor-pointer">
                Forgot Password
              </Link >

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-lg point-ask-gradient cursor-pointer hover:bg-yellow-600 text-white font-normal py-6 rounded-lg transition"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-black text-sm">Or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <Button
              variant="outline"
              type="button"
              // onClick={handleGoogleSignIn}
              className="w-full bg-white cursor-pointer hover:bg-[#f7dfb3] border border-gray-200 text-gray-700 flex items-center justify-center gap-2 rounded-lg py-3"
            >
              <img
                src="/images/googleLogo.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Google
            </Button> */}

            <div className="text-center text-sm text-black">
              Don't have an account?{" "}
              <Link href="/register" className="text-[#006a3d] font-normal underline cursor-pointer">
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
