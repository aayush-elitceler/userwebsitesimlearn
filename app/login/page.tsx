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
import { X } from "lucide-react";

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
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

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

      // Non-blocking profile fetch
      axios.get(`/users/auth/get-profile`)
        .then(profileRes => { if (profileRes?.data?.data) applyTheme(profileRes.data.data); })
        .catch(() => {});

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

  const handleSelectPlan = async (planKey: string, amount: number) => {
    if (amount === 0) {
      router.push("/");
      return;
    }
    setPaymentLoading(planKey);
    try {
      const res = await fetch('/api/cashfree-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, token: authToken }),
      });
      const data = await res.json();
      const sessionId = data?.data?.payment_session_id;
      if (!sessionId) throw new Error('No session ID');

      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({ mode: 'production' });
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

  const primaryColor = '#FFB31F';
  const secondaryColor = '#FF4949';

  if (showPlans) {
    const planMeta: Record<string, { tagline: string; originalPrice?: string; features: { text: string; count: string }[] }> = {
      FREE: {
        tagline: 'Perfect for individuals just getting started.',
        features: [
          { count: '1', text: 'Chat with AI' },
          { count: '1', text: 'Talk to AI (Voice)' },
          { count: '1', text: 'Point & Ask' },
          { count: '1', text: 'Quiz' },
          { count: '1', text: 'Project workspace' },
        ],
      },
      STANDARD: {
        tagline: 'Ideal for students & professionals.',
        originalPrice: '₹999',
        features: [
          { count: '5', text: 'Chat sessions' },
          { count: '5', text: 'Talk to AI (Voice)' },
          { count: '3', text: 'Point & Ask' },
          { count: '5', text: 'Quizzes' },
          { count: '5', text: 'Project workspaces' },
        ],
      },
      PREMIUM: {
        tagline: 'For organizations & power users.',
        originalPrice: '₹3000',
        features: [
          { count: '∞', text: 'Chat with AI' },
          { count: '∞', text: 'Talk to AI (Voice)' },
          { count: '∞', text: 'Point & Ask' },
          { count: '∞', text: 'Quizzes' },
          { count: '∞', text: 'Project workspaces' },
        ],
      },
    };

    const hoverBgs: Record<string, string> = {
      FREE: 'linear-gradient(145deg, #6366f1 0%, #8b5cf6 100%)',
      STANDARD: `linear-gradient(145deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      PREMIUM: 'linear-gradient(145deg, #0f172a 0%, #334155 100%)',
    };
    const hoverShadows: Record<string, string> = {
      FREE: '0 30px 60px -10px rgba(99,102,241,0.45)',
      STANDARD: `0 30px 60px -10px ${secondaryColor}55`,
      PREMIUM: '0 30px 60px -10px rgba(15,23,42,0.5)',
    };

    return (
      <div className={`${poppins.className} fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4`}>
        <div className='bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl' style={{ overflowX: 'hidden' }}>

          {/* Header */}
          <div className='relative overflow-hidden rounded-t-3xl px-8 py-7 text-white' style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}>
            <div className='absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none' />
            <div className='absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none' />
            <div className='relative z-10 flex items-start justify-between'>
              <div>
                <p className='text-[10px] font-black uppercase tracking-widest text-white/50 mb-1'>Pricing</p>
                <h2 className='text-3xl font-black leading-tight'>Choose Your Plan</h2>
                <p className='text-sm text-white/60 mt-1.5'>Upgrade anytime · Cancel anytime</p>
              </div>
              <button onClick={() => router.push('/')} className='p-2 hover:bg-white/20 rounded-full transition-colors mt-1 shrink-0'>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className='px-6 pt-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch'>
            {plans.map((plan) => {
              const isPopular = plan.key === 'STANDARD';
              const isPremium = plan.key === 'PREMIUM';
              const isHovered = hoveredPlan === plan.key;
              const meta = planMeta[plan.key];

              const bg = isHovered ? hoverBgs[plan.key] : '#ffffff';
              const border = isHovered ? 'transparent' : '#e2e8f0';
              const isLight = !isHovered;
              const textColor = isLight ? '#0f172a' : '#ffffff';
              const subColor = isLight ? '#64748b' : 'rgba(255,255,255,0.55)';
              const dividerColor = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.12)';
              const checkBg = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.18)';
              const featColor = isLight ? '#475569' : 'rgba(255,255,255,0.82)';

              return (
                <div
                  key={plan.key}
                  className='relative flex flex-col rounded-3xl overflow-hidden cursor-pointer'
                  style={{
                    background: bg,
                    border: `2px solid ${border}`,
                    transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                    boxShadow: isHovered ? hoverShadows[plan.key] : '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                  onMouseEnter={() => setHoveredPlan(plan.key)}
                  onMouseLeave={() => setHoveredPlan(null)}
                >
                  {isHovered && (
                    <div className='absolute inset-0 rounded-3xl pointer-events-none' style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' }} />
                  )}

                  {isPopular && (
                    <div className='absolute top-0 inset-x-0 flex justify-center'>
                      <span className='text-[9px] font-black px-4 py-1 rounded-b-xl tracking-widest uppercase'
                        style={{ background: isHovered ? 'rgba(255,255,255,0.25)' : `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`, color: '#ffffff', backdropFilter: 'blur(8px)' }}>
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className='p-6 flex flex-col gap-4 flex-1' style={{ paddingTop: isPopular ? '2.5rem' : '1.5rem' }}>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-[10px] font-bold uppercase tracking-widest mb-0.5' style={{ color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.45)' }}>
                          {isPremium ? 'Enterprise' : isPopular ? 'Most Popular' : 'Starter'}
                        </p>
                        <span className='text-lg font-black' style={{ color: textColor }}>{plan.name}</span>
                      </div>
                    </div>

                    <p className='text-xs leading-snug -mt-2' style={{ color: subColor }}>{meta?.tagline}</p>

                    <div>
                      {meta?.originalPrice && (
                        <div className='flex items-center gap-1.5 mb-1'>
                          <span className='text-xs line-through opacity-50' style={{ color: textColor }}>{meta.originalPrice}</span>
                          <span className='text-[10px] font-black px-1.5 py-0.5 rounded-md' style={{ background: isLight ? '#fef3c7' : 'rgba(255,255,255,0.2)', color: isLight ? '#d97706' : '#ffffff' }}>
                            {Math.round((1 - plan.amount / parseInt(meta.originalPrice.replace('₹', ''))) * 100)}% OFF
                          </span>
                        </div>
                      )}
                      <div className='flex items-end gap-1.5'>
                        <span className='text-5xl font-black leading-none' style={{ color: textColor }}>{plan.amount === 0 ? '₹0' : `₹${plan.amount}`}</span>
                        {plan.amount > 0 && <span className='mb-1 text-sm font-medium' style={{ color: subColor }}>/mo</span>}
                      </div>
                      <p className='text-xs mt-1' style={{ color: subColor }}>{plan.amount === 0 ? 'Free forever · No card needed' : 'Billed monthly · Cancel anytime'}</p>
                    </div>

                    <div className='h-px' style={{ background: dividerColor }} />

                    <ul className='space-y-2 flex-1'>
                      {(meta?.features || []).map((f) => (
                        <li key={f.text} className='flex items-center gap-2.5 text-sm'>
                          <span className='w-6 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0'
                            style={{ background: checkBg, color: textColor }}>{f.count}</span>
                          <span className='leading-snug' style={{ color: featColor }}>{f.text}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSelectPlan(plan.key, plan.amount)}
                      disabled={paymentLoading === plan.key}
                      className='w-full py-3.5 rounded-2xl text-sm font-black transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-1'
                      style={isLight
                        ? { background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`, color: '#ffffff', boxShadow: `0 4px 15px ${primaryColor}44` }
                        : { background: 'rgba(255,255,255,0.95)', color: primaryColor, fontWeight: 900 }
                      }
                    >
                      {paymentLoading === plan.key ? 'Processing...' : plan.amount === 0 ? 'Get Started Free' : 'Upgrade Now →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className='flex items-center justify-center pb-6 text-xs text-gray-400'>
            Secure payment via Cashfree · No hidden fees · Cancel anytime
          </div>
        </div>

        <p className="absolute bottom-6 text-center text-sm text-white/50 cursor-pointer underline" onClick={() => router.push('/')}>
          Skip for now
        </p>
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
