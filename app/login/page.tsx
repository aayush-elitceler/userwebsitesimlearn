"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import axios from "@/lib/axiosInstance";
import Cookies from "js-cookie";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"] });

declare const google: {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      prompt: () => void;
    };
  };
};

interface Plan {
  id: string;
  key: string;
  name: string;
  amount: number;
  amountPaise: number;
  metadata: { tokenLimits: Record<string, number | string> };
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showPlans, setShowPlans] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  const router = useRouter();

  const handleGoogleSignIn = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return;
    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async (response: { credential: string }) => {
        try {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/users/auth/google/login`,
            { idToken: response.credential }
          );
          if (res.data?.data?.token) {
            Cookies.set("auth", JSON.stringify({ token: res.data.data.token, user: res.data.data.user }), { expires: 1 });
            router.push("/");
          }
        } catch (err) {
          console.error("Google login failed", err);
        }
      }
    });
    google.accounts.id.prompt();
  };

  const applyTheme = (profile: Record<string, unknown>) => {
    try {
      localStorage.setItem('user-profile', JSON.stringify(profile));
      const inst = profile?.institution as Record<string, string> | undefined;
      const primary = inst?.primaryColor;
      const secondary = inst?.secondaryColor;
      if (!primary && !secondary) return;
      localStorage.setItem('institution-theme', JSON.stringify({ primary, secondary }));
      const root = document.documentElement;
      if (primary) {
        root.style.setProperty('--primary', primary);
        const hex = primary.replace('#', '');
        const h = hex.length === 3 ? hex.split('').map((c: string) => c + c).join('') : hex;
        const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        root.style.setProperty('--primary-foreground', yiq >= 128 ? '#000000' : '#ffffff');
        root.style.setProperty('--accent', primary);
        root.style.setProperty('--accent-foreground', yiq >= 128 ? '#000000' : '#ffffff');
      }
      if (secondary) {
        root.style.setProperty('--secondary', secondary);
        const hex2 = secondary.replace('#', '');
        const h2 = hex2.length === 3 ? hex2.split('').map((c: string) => c + c).join('') : hex2;
        const r2 = parseInt(h2.slice(0, 2), 16), g2 = parseInt(h2.slice(2, 4), 16), b2 = parseInt(h2.slice(4, 6), 16);
        const yiq2 = (r2 * 299 + g2 * 587 + b2 * 114) / 1000;
        root.style.setProperty('--secondary-foreground', yiq2 >= 128 ? '#000000' : '#ffffff');
      }
    } catch { }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/users/auth/login`,
        { email, password }
      );
      const token = res.data.data.token;
      const user = res.data.data.user;
      Cookies.set("auth", JSON.stringify({ token, user }), { expires: 1 });

      try {
        const profileRes = await axios.get(`/users/auth/get-profile`);
        if (profileRes?.data?.data) applyTheme(profileRes.data.data);
      } catch { }

      // Fetch plans and show selector
      try {
        const plansRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/payments/plans`);
        const plansData = await plansRes.json();
        if (plansData?.data?.length) {
          setPlans(plansData.data);
          setAuthToken(token);
          setShowPlans(true);
          return;
        }
      } catch { }

      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.amount === 0) {
      router.push("/");
      return;
    }
    setPaymentLoading(plan.key);
    try {
      const res = await fetch('/api/cashfree-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: plan.key, token: authToken }),
      });
      const data = await res.json();
      const sessionId = data?.data?.payment_session_id;
      if (!sessionId) throw new Error('No session ID');

      // Load Cashfree SDK and open checkout
      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({ mode: 'sandbox' });
      cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: '_self',
      });
    } catch (err) {
      console.error(err);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setPaymentLoading(null);
    }
  };

  if (showPlans) {
    return (
      <div className={`${poppins.className} min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF0D3] to-[#FEF9F3] p-6`}>
        <div className="w-full max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-2">Choose Your Plan</h2>
          <p className="text-center text-gray-500 mb-8">Select a plan to get started</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.key} className={`bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4 border-2 ${plan.key === 'STANDARD' ? 'border-[#FFB31F]' : 'border-transparent'}`}>
                {plan.key === 'STANDARD' && (
                  <span className="text-xs font-semibold bg-[#FFB31F] text-white px-3 py-1 rounded-full self-start">Popular</span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-3xl font-bold">
                  {plan.amount === 0 ? 'Free' : `₹${plan.amount}`}
                  {plan.amount > 0 && <span className="text-sm font-normal text-gray-400">/mo</span>}
                </p>
                <ul className="flex flex-col gap-2 text-sm text-gray-600 flex-1">
                  {Object.entries(plan.metadata.tokenLimits).map(([k, v]) => (
                    <li key={k} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{k.replace(/_/g, ' ')}: {v}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={paymentLoading === plan.key}
                  className="w-full text-white"
                  style={{ background: 'linear-gradient(90deg, #FFB31F 0%, #FF4949 100%)' }}
                >
                  {paymentLoading === plan.key ? 'Processing...' : plan.amount === 0 ? 'Continue Free' : 'Get Started'}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-6 cursor-pointer underline" onClick={() => router.push('/')}>
            Skip for now
          </p>
        </div>
      </div>
    );
  }



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
              SIGN IN TO YOUR <span className="text-[#ffa902]">ADVENTURE!</span>
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
                className="w-full text-lg cursor-pointer text-white font-normal py-6 rounded-lg transition hover:opacity-90"
                style={{ background: 'linear-gradient(90deg, #FFB31F 0%, #FF4949 100%)' }}
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
              <Link href="/register" className="text-[#ff5146] font-normal underline cursor-pointer">
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
