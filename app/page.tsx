'use client';
import { useEffect, useState, lazy, Suspense } from 'react';
import {
  Chart as ChartJS,
  Tooltip,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ArrowRight, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useLogo } from '@/lib/LogoContext';
import { pageAnimationStyles, getAnimationDelay } from '@/lib/animations';
import axios, { redirectToLogin } from '@/lib/axiosInstance';

ChartJS.register(
  Tooltip,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

// Interfaces (same as your original)
interface User {
  firstName: string;
  lastName: string;
  role: string;
  photoUrl: string;
  profilePictureUrl?: string;
  section?: string;
}
interface DayStreak {
  day: string;
  isActive: boolean;
}
interface DailyStreak {
  days: DayStreak[];
  currentStreak: number;
}
interface LoginStreak {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
}
interface BadgeChallenge {
  title: string;
  description: string;
  target: number;
  current: number;
  deadline: string;
  questions: string[];
  // Optional quiz wiring from API
  quizId?: string;
  link?: string;
}
interface Subject {
  subject: string;
  name?: string;
  percentage: number;
}
interface Activities {
  continueLearning: {
    title: string;
    remainingQuestions: number;
    lastActivity: string;
    // Optional routing info
    quizId?: string;
    link?: string;
  };
  progress: {
    subjects: Subject[];
  };
  projects: {
    pending: number;
    nextProject: string;
  };
}
interface Mission {
  title: string;
  description: string;
  completed: boolean;
  quizId?: string;
  questionId?: string;
  link?: string;
}
interface QuickLink {
  title: string;
  description: string;
  status: string;
  link?: string;
  projectId?: string;
  dueDate?: string;
}
interface LearningGrowthData {
  data: Array<{
    month: string;
    percentage: number;
  }>;
  currentPercentage: number;
}
interface DashboardData {
  logo?: string;
  user: User;
  dailyStreak: DailyStreak;
  loginStreak?: LoginStreak;
  badgeChallenge?: BadgeChallenge;
  badgeChallenges?: BadgeChallenge[];
  activities: Activities;
  todaysMissions: Mission[];
  quickLinks: QuickLink[];
  learningGrowth: LearningGrowthData;
  weeklyProgress: Subject[];
}
interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: DashboardData;
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedChallengeIndex, setSelectedChallengeIndex] = useState(0);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<{ id: string; key: string; name: string; amount: number; amountPaise: number; metadata: { tokenLimits: Record<string, string | number> } }[]>([]);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const router = useRouter();
  const { setLogoUrl } = useLogo();
  const [primaryColor, setPrimaryColor] = useState<string>('#000');
  const [secondaryColor, setSecondaryColor] = useState<string>('#000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const p = getComputedStyle(root).getPropertyValue('--primary').trim();
      const s = getComputedStyle(root).getPropertyValue('--secondary').trim();
      if (p) setPrimaryColor(p);
      if (s) setSecondaryColor(s);
    }
  }, []);

  const withAlpha = (color: string, alpha: number): string => {
    if (color.startsWith('oklch(')) {
      return color.replace(/\)$/, ` / ${alpha})`);
    }
    return color;
  };

  // Function to convert number to ordinal (1st, 2nd, 3rd, etc.)
  const getOrdinal = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) {
      return num + "st";
    }
    if (j === 2 && k !== 12) {
      return num + "nd";
    }
    if (j === 3 && k !== 13) {
      return num + "rd";
    }
    return num + "th";
  };

  // Function to handle mission redirects using API links
  const handleMissionClick = async (mission: Mission) => {
    if (mission.completed) return;
    // Prefer explicit quizId
    if (mission.quizId) {
      router.push(`/quizes/${mission.quizId}/start`);
      return;
    }

    // Use the link from API if available
    if (mission.link) {
      if (mission.link.startsWith('http')) {
        // External link - open in new tab
        window.open(mission.link, '_blank');
      } else {
        // Transform API link format to desired format
        let finalLink = mission.link;

        // Check if it's the quiz-by-id format and transform it
        if (mission.link.includes('/users/quiz-by-id?id=')) {
          const quizId = mission.link.split('id=')[1]?.split('&')[0];
          if (quizId) {
            finalLink = `/quizes/${quizId}/start`;
          }
        }
        // If it's already in /quizes/{id} format, ensure /start
        if (/^\/quizes\/[A-Za-z0-9_-]+$/.test(mission.link)) {
          finalLink = `${mission.link}/start`;
        }

        // Internal route - navigate using router
        router.push(finalLink);
      }
      return;
    }

    // Fallback logic for missions without links
    if (mission.title.toLowerCase().includes('doubt') || mission.title.toLowerCase().includes('chat') || mission.title.toLowerCase().includes('voice') || mission.title.toLowerCase().includes('image')) {
      router.push('/aichats/chat');
    } else if (mission.title.toLowerCase().includes('practice') || mission.title.toLowerCase().includes('mcq')) {
      router.push('/quizes/generate');
    } else if (mission.title.toLowerCase().includes('retry') || mission.title.toLowerCase().includes('mistake')) {
      router.push('/quizes/generate');
    } else {
      router.push('/quizes/generate');
    }
  };

  // Function to handle quick link redirects using API links
  const handleQuickLinkClick = (link: QuickLink) => {
    // Use the link from API if available
    if (link.link) {
      if (link.link.startsWith('http')) {
        // External link - open in new tab
        window.open(link.link, '_blank');
      } else {
        // Internal route - navigate using router
        router.push(link.link);
      }
      return;
    }

    // Fallback to old logic if no link provided
    if (link.title.toLowerCase().includes('project') || link.title.toLowerCase().includes('due')) {
      router.push('/projects/teacherproject');
    } else if (link.title.toLowerCase().includes('revision') || link.title.toLowerCase().includes('timeline') || link.title.toLowerCase().includes('ai')) {
      router.push('/aichats/voice');
    } else {
      router.push('/projects/teacherproject');
    }
  };

  const applyThemeFromProfile = (profile: any) => {
    const primary = profile?.institution?.primaryColor;
    const secondary = profile?.institution?.secondaryColor;
    if (!primary && !secondary) return;
    localStorage.setItem('institution-theme', JSON.stringify({ primary, secondary }));
    const root = document.documentElement;
    const applyColor = (color: string, prop: string, accentProp?: string) => {
      root.style.setProperty(prop, color);
      const hex = color.replace('#', '');
      const h = hex.length === 3 ? hex.split('').map((c: string) => c + c).join('') : hex;
      const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      const fg = (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#000000' : '#ffffff';
      root.style.setProperty(`${prop}-foreground`, fg);
      if (accentProp) { root.style.setProperty(accentProp, color); root.style.setProperty(`${accentProp}-foreground`, fg); }
    };
    if (primary) applyColor(primary, '--primary', '--accent');
    if (secondary) applyColor(secondary, '--secondary');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authCookie = Cookies.get('auth');
        let token: string | undefined;
        let userFromCookie: any = null;

        if (authCookie) {
          try {
            const parsedAuth = JSON.parse(authCookie);
            token = parsedAuth.token;
            userFromCookie = parsedAuth.user;
          } catch (e) { /* invalid cookie */ }
        }

        if (!authCookie || !token) { redirectToLogin(); return; }

        if (userFromCookie) setProfileData(userFromCookie);

        // Fire plans fetch separately — don't block dashboard
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/payments/plans`)
          .then(r => r.json())
          .then(d => { if (d?.data?.length) setPlans(d.data); })
          .catch(() => {});

        // Fetch dashboard
        const dashboardResponse = await axios.get(`/users/dashboard`, { headers: { Authorization: `Bearer ${token}` } });

        const dashboardResult: ApiResponse = dashboardResponse.data;
        setDashboardData(dashboardResult.data);
        if (dashboardResult.data.logo) setLogoUrl(dashboardResult.data.logo);

        // Profile fetch only if not in cookie — non-blocking
        if (!userFromCookie) {
          axios.get(`/users/auth/get-profile`, { headers: { Authorization: `Bearer ${token}` } })
            .then(profileResponse => {
              if (profileResponse.data.success) {
                const profile = profileResponse.data.data;
                setProfileData(profile);
                try {
                  localStorage.setItem('user-profile', JSON.stringify(profile));
                  applyThemeFromProfile(profile);
                } catch { }
              }
            })
            .catch(profileErr => {
              if (axios.isAxiosError(profileErr) && profileErr.response?.status === 401) redirectToLogin();
            });
        } else {
          try { applyThemeFromProfile(userFromCookie); } catch { }
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) { redirectToLogin(); return; }
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchPlans = async (openModal = true) => {
    if (plans.length) { if (openModal) setShowPlansModal(true); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/payments/plans`);
      const data = await res.json();
      setPlans(data.data || []);
    } catch { }
    if (openModal) setShowPlansModal(true);
  };

  const handleSelectPlan = async (planKey: string, amount: number) => {
    if (amount === 0) { setShowPlansModal(false); return; }
    setPaymentLoading(planKey);
    try {
      const authCookie = Cookies.get('auth');
      const token = authCookie ? JSON.parse(authCookie).token : '';
      const res = await fetch('/api/cashfree-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, token }),
      });
      const data = await res.json();
      const sessionId = data?.data?.payment_session_id;
      if (!sessionId) throw new Error('No session ID');
      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({ mode: 'sandbox' });
      cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: '_self' });
    } catch {
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setPaymentLoading(null);
    }
  };


  const createLearningGrowthData = () => {
    if (!dashboardData?.learningGrowth) return null;
    const allMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dataMap = new Map(dashboardData.learningGrowth.data.map((item) => [item.month, item.percentage]));
    // Only show months that have data or up to current month
    const currentMonth = new Date().getMonth(); // 0-indexed
    const labels = allMonths.slice(0, currentMonth + 1);
    const data = labels.map((month) => dataMap.get(month) || 0);
    const color = primaryColor.startsWith('#') ? primaryColor : 'var(--primary)';
    return {
      labels,
      datasets: [{
        label: 'Score',
        data,
        borderColor: color,
        backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'transparent';
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, primaryColor.startsWith('#') ? `${primaryColor}33` : 'rgba(0,0,0,0.1)');
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          return gradient;
        },
        tension: 0.45,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: color,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: color,
        borderWidth: 2.5,
      }],
    };
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-4 font-[var(--font-nunito-sans)]`}>
        {/* Skeleton header */}
        <div className='flex justify-between items-center mb-6'>
          <div className='h-8 w-56 bg-gray-200 rounded-xl animate-pulse' />
          <div className='h-10 w-10 bg-gray-200 rounded-full animate-pulse' />
        </div>
        {/* Skeleton streak */}
        <div className='h-16 w-full bg-gray-200 rounded-2xl animate-pulse mb-4' />
        {/* Skeleton plan card */}
        <div className='h-36 w-full bg-gray-200 rounded-2xl animate-pulse mb-6' />
        {/* Skeleton activity cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
          {[1,2,3].map(i => <div key={i} className='h-28 bg-gray-200 rounded-2xl animate-pulse' />)}
        </div>
        {/* Skeleton grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div className='space-y-4'>
            <div className='h-48 bg-gray-200 rounded-2xl animate-pulse' />
            <div className='h-48 bg-gray-200 rounded-2xl animate-pulse' />
          </div>
          <div className='space-y-4'>
            <div className='h-48 bg-gray-200 rounded-2xl animate-pulse' />
            <div className='h-48 bg-gray-200 rounded-2xl animate-pulse' />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gray-50 font-[var(--font-nunito-sans)]`}
      >
        <div className='text-center'>
          <p className='text-red-600 text-lg mb-4'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-gradient-primary text-primary-foreground rounded-lg hover:bg-primary/90'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const learningGrowthData = createLearningGrowthData();
  // Normalize challenges into an array
  const challenges: BadgeChallenge[] = (dashboardData.badgeChallenges && dashboardData.badgeChallenges.length > 0)
    ? dashboardData.badgeChallenges
    : (dashboardData.badgeChallenge ? [dashboardData.badgeChallenge] : []);
  // Choose primary challenge as first incomplete, else first
  const primaryChallengeIndex = Math.max(0, challenges.findIndex(c => (c.current ?? 0) < (c.target ?? 0)));
  const primaryChallenge = challenges[primaryChallengeIndex] || null;
  const isPrimaryCompleted = primaryChallenge ? (primaryChallenge.current >= primaryChallenge.target) : false;

  return (
    <div
      className={`min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-4 font-[var(--font-nunito-sans)]`}
    >
      <style jsx>{pageAnimationStyles}</style>

      {/* Header with greeting and School/Class Info side by side */}
      <div
        className='flex justify-between items-center mb-4'
        style={{
          ...getAnimationDelay(0, 150),
          animation: 'slideInDown 0.6s ease-out forwards'
        }}
      >
        <h1 className='text-2xl sm:text-3xl font-semibold text-gray-800'>
          Hi {dashboardData.user.firstName}! 👋 Let&apos;s make today count.
        </h1>
        <div className='flex items-center gap-3'>
          {/* School and Class Info */}
          <div
            className='text-sm text-gray-600 text-right transform transition-all duration-300 hover:scale-105'
            style={{
              ...getAnimationDelay(0.5, 150),
              animation: 'slideInRight 0.8s ease-out forwards'
            }}
          >
            {dashboardData.loginStreak && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-100 shadow-sm mr-4 mb-2 sm:mb-0"
                title="Daily Login Streak"
              >
                <span className="text-lg">🔥</span>
                <span className="font-bold text-sm text-orange-700">{dashboardData.loginStreak.currentStreak}</span>
              </div>
            )}
            {profileData?.class && (
              <div className='animate-pulse'>
                {getOrdinal(parseInt(profileData.class))} Class
                {profileData?.section && ` - ${profileData.section}`}
              </div>
            )}
            {profileData?.institution?.name && (
              <div className='animate-pulse delay-100'>{profileData.institution.name}</div>
            )}
          </div>
          <div
            onClick={() => router.push('/profile')}
            className='w-10 h-10 bg-white text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 hover:shadow-md hover:scale-110 transition-all duration-300 flex items-center justify-center cursor-pointer overflow-hidden relative'
            title='Profile'
          >
            {(profileData?.photoUrl || dashboardData.user.profilePictureUrl) ? (
              <>
                <img
                  src={(profileData?.photoUrl as string) || (dashboardData.user.profilePictureUrl as string)}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <span className="fallback-icon hidden w-full h-full items-center justify-center">👤</span>
              </>
            ) : (
              <span>👤</span>
            )}
          </div>
        </div>
      </div>

      {/* Streak + Badge */}
      <div
        className='flex flex-col md:flex-row gap-4 mb-4'
        style={{
          ...getAnimationDelay(1, 150),
          animation: 'fadeInUp 0.6s ease-out forwards'
        }}
      >
        <div
          className='flex-1 p-4 rounded-xl flex gap-2 transform transition-all duration-300 hover:scale-[1.02]'
          style={{
            background:
              'linear-gradient(90deg, rgba(255, 179, 31, 0.12) 0%, rgba(255, 73, 73, 0.12) 100%)',
            ...getAnimationDelay(1.2, 150),
            animation: 'slideInLeft 0.8s ease-out forwards'
          }}
        >
          {dashboardData.dailyStreak.days.map((day, idx) => (
            <div
              key={idx}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl ${day.isActive ? 'text-gradient-primary' : 'text-gray-400'
                }`}
            >
              <img
                src={`${day.isActive ? '/images/Thunder.svg' : '/images/Frame.svg'
                  }`}
                alt=''
                className={`w-[18px] h-[24px] transition-transform duration-300 ${day.isActive ? 'animate-pulse' : ''}`}
              />
              <span className='text-sm font-semibold'>{day.day}</span>
            </div>
          ))}
        </div>

        <div
          className='flex-1 cursor-pointer flex items-center gap-3 px-6 py-4 rounded-xl border border-primary/20 bg-gradient-primary  shadow-sm hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-200'
          onClick={() => {
            if (primaryChallenge) {
              if (primaryChallenge.quizId) {
                return router.push(`/quizes/${primaryChallenge.quizId}/start`);
              }
              if (primaryChallenge.link) {
                const l = primaryChallenge.link;
                if (l.includes('/users/quiz-by-id?id=')) {
                  const qid = l.split('id=')[1]?.split('&')[0];
                  if (qid) return router.push(`/quizes/${qid}/start`);
                }
                if (l.startsWith('http')) return window.open(l, '_blank');
                return router.push(l);
              }
            }
            setSelectedChallengeIndex(primaryChallengeIndex);
            setShowBadgeModal(true);
          }}
        >
          <img src='/images/medal.svg' alt='' className='w-[50px] h-[50px]' />
          <div className='flex-1 font-semibold '>
            <span className='text-white'>
              {primaryChallenge ? primaryChallenge.title : 'Badge Challenge'}
            </span>
            {challenges.length > 1 && (
              <span className='ml-2 text-xs text-white'>({challenges.length} challenges)</span>
            )}
          </div>
          <div className='text-sm text-white'>
            {primaryChallenge ? (
              primaryChallenge.current >= primaryChallenge.target ? (
                <span className='text-white font-semibold'>🎉 Earned!</span>
              ) : (
                <>
                  {primaryChallenge.current}/{primaryChallenge.target}
                </>
              )
            ) : null}
          </div>
          <div className='w-10 h-10 bg-gradient-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 hover:shadow-lg hover:scale-110 transition-all duration-200'>
            <ArrowRight size={20} />
          </div>
        </div>
      </div>

      {/* Plan Card */}
      {plans.length > 0 && (() => {
        const currentPlanKey = ((dashboardData as unknown as Record<string, unknown>)?.currentPlan as string || 'FREE').toUpperCase();
        const activePlan = plans.find(p => p.key === currentPlanKey) || plans[0];
        const dailyLimit = activePlan?.metadata?.tokenLimits?.daily_tokens as number || 2000;
        const perReqLimit = activePlan?.metadata?.tokenLimits?.max_tokens_per_request as number || 1500;
        const rateLimit = activePlan?.metadata?.tokenLimits?.rate_limit as string | undefined;
        const tokensUsed = ((dashboardData as unknown as Record<string, unknown>)?.tokensUsedToday as number) || 0;
        const usedPct = Math.min(100, Math.round((tokensUsed / dailyLimit) * 100));
        const isPaid = activePlan?.amount > 0;
        const barColor = usedPct >= 90 ? '#ef4444' : usedPct >= 60 ? '#f59e0b' : undefined;
        const statusLabel = usedPct >= 90 ? 'Critical' : usedPct >= 60 ? 'Moderate' : tokensUsed === 0 ? 'No usage yet' : 'Healthy';
        const statusClass = usedPct >= 90 ? 'text-red-400 bg-red-500/10 border-red-400/30' : usedPct >= 60 ? 'text-amber-300 bg-amber-500/10 border-amber-400/30' : tokensUsed === 0 ? 'text-white/40 bg-white/5 border-white/10' : 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30';
        return (
          <div className='mb-6 relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300'
            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
            {/* Decorative circles */}
            <div className='absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none' />
            <div className='absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none' />
            <div className='absolute top-0 right-0 w-full h-full pointer-events-none' style={{ background: 'linear-gradient(135deg, transparent 60%, rgba(0,0,0,0.15) 100%)' }} />

            <div className='relative p-6'>
              {/* Top row */}
              <div className='flex items-start justify-between mb-5'>
                <div>
                  <p className='text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 mb-1'>Current Plan</p>
                  <div className='flex items-center gap-2.5'>
                    <h3 className='text-2xl font-black text-white capitalize'>{activePlan?.name}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${isPaid ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/25' : 'bg-white/10 text-white/50 border-white/15'}`}>
                      {isPaid ? '● Active' : 'Free Tier'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => fetchPlans(true)}
                  className='px-4 py-2 rounded-xl text-xs font-bold text-white hover:scale-105 transition-all duration-200 whitespace-nowrap'
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}
                >
                  Change Plan
                </button>
              </div>

              {/* Usage bar */}
              <div className='mb-5'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-xs font-semibold text-white/60'>Today&apos;s Usage</span>
                  <div className='flex items-center gap-2'>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>{statusLabel}</span>
                    <span className='text-xs text-white/40'>{usedPct}% used</span>
                  </div>
                </div>
                <div className='w-full rounded-full h-2 overflow-hidden' style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className='h-2 rounded-full transition-all duration-700'
                    style={{ width: `${Math.max(usedPct, 1)}%`, background: barColor || 'rgba(255,255,255,0.7)' }} />
                </div>
                <div className='flex justify-between mt-1.5'>
                  <span className='text-[10px] text-white/35'>{100 - usedPct}% remaining today</span>
                  <span className='text-[10px] text-white/35'>Resets daily</span>
                </div>
              </div>

              {/* Included features — inline pills */}
              <div className='flex flex-wrap gap-2'>
                {[
                  { label: 'Chat', value: currentPlanKey === 'PREMIUM' ? 'Unlimited' : currentPlanKey === 'STANDARD' ? '5/day' : '1/day' },
                  { label: 'Voice', value: currentPlanKey === 'PREMIUM' ? 'Unlimited' : currentPlanKey === 'STANDARD' ? '5/day' : '1/day' },
                  { label: 'Point & Ask', value: currentPlanKey === 'PREMIUM' ? 'Unlimited' : currentPlanKey === 'STANDARD' ? '3/day' : '1/day' },
                  { label: 'Quiz', value: currentPlanKey === 'PREMIUM' ? 'Unlimited' : currentPlanKey === 'STANDARD' ? '5/day' : '1/day' },
                  { label: 'Projects', value: currentPlanKey === 'PREMIUM' ? 'Unlimited' : currentPlanKey === 'STANDARD' ? '5' : '1' },
                ].map(f => (
                  <span key={f.label} className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white'
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {f.label} <span className='text-white/50'>·</span> {f.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
      {/* Activities */}
      <div className='mb-8'>
        <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-3'>Your Activities</p>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {[
            {
              label: 'Learning',
              title: dashboardData.activities.continueLearning.title,
              cta: 'Resume Quiz',
              link: dashboardData.activities.continueLearning.link
                ? (dashboardData.activities.continueLearning.link.includes('/users/quiz-by-id?id=')
                  ? `/quizes/${dashboardData.activities.continueLearning.link.split('id=')[1]?.split('&')[0]}/start`
                  : (/^\/quizes\/[A-Za-z0-9_-]+$/.test(dashboardData.activities.continueLearning.link)
                    ? `${dashboardData.activities.continueLearning.link}/start`
                    : dashboardData.activities.continueLearning.link))
                : (dashboardData.activities.continueLearning.quizId ? `/quizes/${dashboardData.activities.continueLearning.quizId}/start` : '/quizes'),
              iconBg: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              icon: '▶',
            },
            {
              label: 'Progress',
              title: dashboardData.activities.progress.subjects.slice(0, 2).map(s => `${(s.name || 'Subject').substring(0, 16)} ${s.percentage}%`).join(' · '),
              cta: 'Track Progress',
              link: '/personalisedLearning',
              iconBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              icon: '◎',
            },
            {
              label: 'Projects',
              title: `${dashboardData.activities.projects.pending} pending — ${dashboardData.activities.projects.nextProject}`,
              cta: 'Open Projects',
              link: '/projects/teacherproject',
              iconBg: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              icon: '◈',
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className='group bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer overflow-hidden relative'
              style={{
                ...getAnimationDelay(2 + idx * 0.1, 150),
                animation: 'fadeInUp 0.6s ease-out forwards',
                transition: 'all 0.25s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
              onClick={() => router.push(card.link)}
            >
              {/* Hover color wash */}
              <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl'
                style={{ background: card.iconBg, opacity: 0 }}
                ref={el => { if (el) { el.style.opacity = '0'; el.parentElement?.addEventListener('mouseenter', () => { el.style.opacity = '0.04'; }); el.parentElement?.addEventListener('mouseleave', () => { el.style.opacity = '0'; }); } }}
              />
              <div className='relative'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-black shadow-sm shrink-0'
                    style={{ background: card.iconBg }}>
                    {card.icon}
                  </div>
                  <p className='text-[10px] font-bold uppercase tracking-wide text-gray-400'>{card.label}</p>
                </div>
                <p className='text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-4 min-h-[40px]'>{card.title}</p>
                <div className='flex items-center gap-1.5 text-xs font-bold group-hover:gap-2.5 transition-all duration-200'
                  style={{ color: primaryColor }}>
                  {card.cta} <ArrowRight size={11} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid — equal height columns */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6'
        style={{ ...getAnimationDelay(3, 150), animation: 'fadeInUp 0.8s ease-out forwards' }}>

        {/* Left Column */}
        <div className='flex flex-col gap-4'>

          {/* Today's Missions */}
          <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300'>
            <div className='px-5 py-4 flex items-center justify-between' style={{ borderBottom: '1px solid #f8fafc' }}>
              <h2 className='text-sm font-bold text-gray-900'>Today&apos;s Missions</h2>
              <div className='flex items-center gap-2'>
                <div className='flex gap-1'>
                  {dashboardData.todaysMissions.map((m, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${m.completed ? 'bg-green-400' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <span className='text-[10px] font-bold text-gray-400'>
                  {dashboardData.todaysMissions.filter(m => m.completed).length}/{dashboardData.todaysMissions.length}
                </span>
              </div>
            </div>
            <div className='divide-y divide-gray-50/80'>
              {dashboardData.todaysMissions.map((mission, idx) => (
                <div key={idx} className='flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors duration-150'>
                  <button
                    onClick={() => handleMissionClick(mission)}
                    className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border-2 transition-all duration-200 ${
                      mission.completed ? 'border-green-400 bg-green-400' : 'border-gray-200 hover:border-primary'
                    }`}
                  >
                    {mission.completed && <span className='text-white text-[9px] font-black'>✓</span>}
                  </button>
                  <div className='min-w-0 flex-1'>
                    <h4 className={`text-sm font-semibold truncate ${mission.completed ? 'text-gray-300 line-through' : 'text-gray-800'}`}>{mission.title}</h4>
                    {mission.description && <p className='text-gray-400 text-xs truncate mt-0.5'>{mission.description}</p>}
                  </div>
                  {!mission.completed && (
                    <button
                      onClick={() => handleMissionClick(mission)}
                      className='shrink-0 px-3 py-1 rounded-lg text-[11px] font-bold bg-gradient-primary text-white hover:shadow-md hover:scale-105 transition-all duration-200'
                    >
                      {(mission.quizId || mission.link) ? 'Start →' : 'Do it'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Learning Growth */}
          <div className='bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex-1'>
            <div className='flex items-center justify-between mb-1'>
              <h2 className='text-sm font-bold text-gray-900'>Learning Growth</h2>
              <span className='text-[10px] text-gray-400 font-medium'>{new Date().getFullYear()}</span>
            </div>
            <p className='text-xs text-gray-400 mb-3'>Your monthly performance score</p>
            {learningGrowthData ? (
              <div style={{ height: '160px' }}>
                <Line data={learningGrowthData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#1e293b',
                      titleColor: '#94a3b8',
                      bodyColor: '#ffffff',
                      padding: 10,
                      cornerRadius: 8,
                      displayColors: false,
                      callbacks: { label: (ctx: { parsed: { y: number } }) => `Score: ${ctx.parsed.y}%` },
                    },
                  },
                  scales: {
                    x: { grid: { display: false }, border: { display: false } as never, ticks: { font: { size: 10 }, color: '#94a3b8' } },
                    y: { min: 0, max: 100, grid: { color: '#f8fafc' }, border: { display: false } as never, ticks: { font: { size: 10 }, color: '#94a3b8', callback: (v: string | number) => `${v}%`, stepSize: 25 } },
                  },
                }} />
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-40 text-gray-300'>
                <div className='text-4xl mb-2'>📈</div>
                <p className='text-xs text-gray-400'>No data yet — start learning!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className='flex flex-col gap-4'>

          {/* Quick Links */}
          <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300'>
            <div className='px-5 py-4' style={{ borderBottom: '1px solid #f8fafc' }}>
              <h2 className='text-sm font-bold text-gray-900'>Quick Links</h2>
            </div>
            <div className='divide-y divide-gray-50/80'>
              {dashboardData.quickLinks.slice(0, 3).map((link, idx) => (
                <div
                  key={idx}
                  className='group/link flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer'
                  style={{ ...getAnimationDelay(4 + idx * 0.1, 150), animation: 'fadeInUp 0.5s ease-out forwards' }}
                  onClick={() => handleQuickLinkClick(link)}
                >
                  <div className='w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-black shadow-sm'
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                    {(link.title?.[0] || '?').toUpperCase()}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h4 className='font-semibold text-gray-800 text-sm truncate'>{link.title}</h4>
                    <p className='text-gray-400 text-xs mt-0.5 truncate'>{link.description}</p>
                  </div>
                  <div className='shrink-0 flex items-center gap-1 group-hover/link:gap-2 transition-all duration-200'
                    style={{ color: primaryColor }}>
                    <span className='text-[11px] font-bold'>{link.status === 'Completed' ? 'Done' : 'Open'}</span>
                    <ArrowRight size={11} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Progress — flex-1 to match height */}
          <div className='bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex-1'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-sm font-bold text-gray-900'>Weekly Progress</h2>
              <span className='text-[10px] text-gray-400 font-medium'>vs last week</span>
            </div>
            {dashboardData.weeklyProgress.length > 0 ? (
              <div className='space-y-4'>
                {dashboardData.weeklyProgress.map((item, idx) => (
                  <div key={idx}>
                    <div className='flex justify-between mb-1.5'>
                      <span className='text-xs font-semibold text-gray-600'>{(item.subject || 'Unknown').toUpperCase()}</span>
                      <span className='text-xs font-bold' style={{ color: primaryColor }}>{item.percentage}%</span>
                    </div>
                    <div className='w-full bg-gray-100 rounded-full h-1.5 overflow-hidden'>
                      <div
                        className='h-1.5 rounded-full transition-all duration-700'
                        style={{ width: `${item.percentage}%`, background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-32 text-gray-300'>
                <div className='text-4xl mb-2'>📊</div>
                <p className='text-xs text-gray-400'>Complete quizzes to see progress</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plans Modal */}
      {showPlansModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl' style={{ overflowX: 'hidden' }}>

            {/* Header */}
            <div className='relative overflow-hidden rounded-t-3xl bg-gradient-primary px-8 py-7 text-white'>
              <div className='absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none' />
              <div className='absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none' />
              <div className='relative z-10 flex items-start justify-between'>
                <div>
                  <p className='text-[10px] font-black uppercase tracking-widest text-white/50 mb-1'>Pricing</p>
                  <h2 className='text-3xl font-black leading-tight'>Choose Your Plan</h2>
                  <p className='text-sm text-white/60 mt-1.5'>Upgrade anytime · Cancel anytime</p>
                </div>
                <button onClick={() => setShowPlansModal(false)} className='p-2 hover:bg-white/20 rounded-full transition-colors mt-1 shrink-0'>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className='px-6 pt-2 pb-6 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch' style={{ paddingTop: '1.5rem' }}>
              {plans.map((plan) => {
                const isPopular = plan.key === 'STANDARD';
                const isPremium = plan.key === 'PREMIUM';
                const currentPlanKey = ((dashboardData as unknown as Record<string, unknown>)?.currentPlan as string || 'FREE').toUpperCase();
                const isCurrent = plan.key === currentPlanKey;
                const isHovered = hoveredPlan === plan.key;
                const dailyTok = plan.metadata?.tokenLimits?.daily_tokens as number;
                const perReqTok = plan.metadata?.tokenLimits?.max_tokens_per_request as number;
                const rate = plan.metadata?.tokenLimits?.rate_limit as string | undefined;
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
                const meta = planMeta[plan.key];

                // All cards same resting color — each reveals unique color on hover
                const hoverBgs: Record<string, string> = {
                  FREE:     `linear-gradient(145deg, #6366f1 0%, #8b5cf6 100%)`,
                  STANDARD: `linear-gradient(145deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  PREMIUM:  `linear-gradient(145deg, #0f172a 0%, #334155 100%)`,
                };
                const hoverShadows: Record<string, string> = {
                  FREE:     '0 30px 60px -10px rgba(99,102,241,0.45)',
                  STANDARD: `0 30px 60px -10px ${secondaryColor}55`,
                  PREMIUM:  '0 30px 60px -10px rgba(15,23,42,0.5)',
                };

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
                    {/* Glow ring on hover */}
                    {isHovered && (
                      <div className='absolute inset-0 rounded-3xl pointer-events-none' style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.25)` }} />
                    )}

                    {/* Popular badge */}
                    {isPopular && (
                      <div className='absolute top-0 inset-x-0 flex justify-center'>
                        <span className='text-[9px] font-black px-4 py-1 rounded-b-xl tracking-widest uppercase'
                          style={{ background: isHovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)', color: '#ffffff', backdropFilter: 'blur(8px)' }}>
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className='p-6 flex flex-col gap-4 flex-1' style={{ paddingTop: isPopular ? '2.5rem' : '1.5rem' }}>
                      {/* Plan name + badge */}
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-[10px] font-bold uppercase tracking-widest mb-0.5' style={{ color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.45)' }}>
                            {isPremium ? 'Enterprise' : isPopular ? 'Most Popular' : 'Starter'}
                          </p>
                          <span className='text-lg font-black' style={{ color: textColor }}>{plan.name}</span>
                        </div>
                        {isCurrent && (
                          <span className='text-[10px] px-2.5 py-1 rounded-full font-black'
                            style={{ background: isLight ? '#dcfce7' : 'rgba(255,255,255,0.2)', color: isLight ? '#16a34a' : '#ffffff', border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(255,255,255,0.3)'}` }}>
                            ✓ Active
                          </span>
                        )}
                      </div>

                      {/* Tagline */}
                      <p className='text-xs leading-snug -mt-2' style={{ color: subColor }}>{meta?.tagline}</p>

                      {/* Price */}
                      <div>
                        {meta?.originalPrice && (
                          <div className='flex items-center gap-1.5 mb-1'>
                            <span className='text-xs line-through opacity-50' style={{ color: textColor }}>{meta.originalPrice}</span>
                            <span className='text-[10px] font-black px-1.5 py-0.5 rounded-md' style={{ background: isLight ? '#fef3c7' : 'rgba(255,255,255,0.2)', color: isLight ? '#d97706' : '#ffffff' }}>
                              {Math.round((1 - plan.amount / parseInt(meta.originalPrice.replace('₹',''))) * 100)}% OFF
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

                      {/* Features */}
                      <ul className='space-y-2 flex-1'>
                        {(meta?.features || []).map((f) => (
                          <li key={f.text} className='flex items-center gap-2.5 text-sm'>
                            <span className='w-6 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0'
                              style={{ background: checkBg, color: textColor }}>{f.count}</span>
                            <span className='leading-snug' style={{ color: featColor }}>{f.text}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <button
                        onClick={() => handleSelectPlan(plan.key, plan.amount)}
                        disabled={paymentLoading === plan.key || isCurrent}
                        className='w-full py-3.5 rounded-2xl text-sm font-black transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-1'
                        style={isCurrent
                          ? { background: 'rgba(255,255,255,0.12)', color: textColor, border: `1px solid ${dividerColor}` }
                          : isLight
                            ? { background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`, color: '#ffffff', boxShadow: `0 4px 15px ${primaryColor}44` }
                            : { background: 'rgba(255,255,255,0.95)', color: primaryColor, fontWeight: 900 }
                        }
                      >
                        {paymentLoading === plan.key ? 'Processing...' : isCurrent ? 'Current Plan' : plan.amount === 0 ? 'Get Started Free' : 'Upgrade Now →'}
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
        </div>
      )}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src='/images/medal.svg' alt='' className='w-[40px] h-[40px]' />
                  <h2 className="text-2xl font-semibold text-gray-800">Badge Challenges</h2>
                </div>
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className="p-2 hover:bg-gray-100 hover:shadow-md hover:scale-110 rounded-full transition-all duration-200"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Selector if multiple challenges */}
              {challenges.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select a challenge</label>
                  <select
                    className="w-full border rounded-lg p-2"
                    value={selectedChallengeIndex}
                    onChange={(e) => setSelectedChallengeIndex(parseInt(e.target.value, 10))}
                  >
                    {challenges.map((c, idx) => (
                      <option key={idx} value={idx}>
                        {c.title} {c.current >= c.target ? '(Completed)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Current challenge details */}
              {challenges.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {challenges[selectedChallengeIndex]?.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {challenges[selectedChallengeIndex]?.description}
                  </p>

                  {/* Progress Tracking Section */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Progress Tracking</h4>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-semibold text-gray-800">{challenges[selectedChallengeIndex]?.target} tasks</span>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-semibold text-gradient-primary">{challenges[selectedChallengeIndex]?.current} tasks</span>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-semibold text-red-500">
                        {Math.max(0, (challenges[selectedChallengeIndex]?.target || 0) - (challenges[selectedChallengeIndex]?.current || 0))} tasks
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(((challenges[selectedChallengeIndex]?.current || 0) / Math.max(1, (challenges[selectedChallengeIndex]?.target || 0))) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (((challenges[selectedChallengeIndex]?.current || 0) / Math.max(1, (challenges[selectedChallengeIndex]?.target || 0))) * 100))}%`,
                            background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)'
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Status */}
                    {(challenges[selectedChallengeIndex]?.current || 0) >= (challenges[selectedChallengeIndex]?.target || 0) ? (
                      <div className="flex items-center gap-2 text-gradient-primary font-semibold">
                        🎉 Badge Completed!
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Deadline:</span>
                        <span className="font-semibold text-red-500">{challenges[selectedChallengeIndex]?.deadline}</span>
                      </div>
                    )}
                  </div>
                </div>)}

              {challenges.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Challenge Questions:</h4>
                  <div className="space-y-4">
                    {challenges[selectedChallengeIndex]?.questions?.map((question, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <span className="bg-green-700 text-white text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                            {index + 1}
                          </span>
                          <p className="text-gray-700">{question}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {(challenges[selectedChallengeIndex]?.current || 0) < (challenges[selectedChallengeIndex]?.target || 0) && (
                  <button
                    onClick={() => {
                      const c = challenges[selectedChallengeIndex];
                      if (c?.quizId) return router.push(`/quizes/${c.quizId}/start`);
                      if (c?.link) {
                        if (c.link.includes('/users/quiz-by-id?id=')) {
                          const qid = c.link.split('id=')[1]?.split('&')[0];
                          if (qid) return router.push(`/quizes/${qid}/start`);
                        }
                        if (c.link.startsWith('http')) return window.open(c.link, '_blank');
                        return router.push(c.link);
                      }
                      router.push('/quizes/generate');
                    }}
                    className="flex-1 bg-gradient-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    Start Challenge
                  </button>
                )}
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className={`px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:shadow-md hover:scale-105 transition-all duration-200 ${((challenges[selectedChallengeIndex]?.current || 0) >= (challenges[selectedChallengeIndex]?.target || 0)) ? 'flex-1' : ''
                    }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
