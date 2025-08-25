'use client';
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Poppins } from 'next/font/google';
import { ArrowRight, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useLogo } from '@/lib/LogoContext';
import { pageAnimationStyles, getAnimationDelay } from '@/lib/animations';
import axios from 'axios';

const poppins = Poppins({ weight: ['400', '600', '700'], subsets: ['latin'] });

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
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
  const router = useRouter();
  const { setLogoUrl } = useLogo();

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
          } catch (e) {
            console.error('Error parsing auth cookie:', e);
          }
        }

        if (!authCookie || !token) {
          router.push('/login');
          return;
        }

        // Set user data from cookie if available
        if (userFromCookie) {
          setProfileData(userFromCookie);
          console.log('User Data from Cookie:', userFromCookie);
        }

        // Fetch dashboard data
        const dashboardResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const dashboardResult: ApiResponse = dashboardResponse.data;
        setDashboardData(dashboardResult.data);

        // Set logo URL if available
        if (dashboardResult.data.logo) {
          console.log('Setting logo URL:', dashboardResult.data.logo);
          setLogoUrl(dashboardResult.data.logo);
        } else {
          console.log('No logo found in data');
        }

        // Only fetch profile data if not available in cookie
        if (!userFromCookie) {
          try {
            const profileResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_BASE_URL}/users/auth/get-profile`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (profileResponse.data.success) {
              setProfileData(profileResponse.data.data);
              console.log('Profile Data from API:', profileResponse.data.data);
            }
          } catch (profileErr) {
            console.error('Error fetching profile:', profileErr);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  console.log('Dashboard Data:', dashboardData);
  console.log('User Data:', dashboardData?.user);
  console.log('Section:', dashboardData?.user?.section);

  const createLearningGrowthData = () => {
    if (!dashboardData?.learningGrowth) return null;

    const allMonths = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const dataMap = new Map(
      dashboardData.learningGrowth.data.map((item) => [
        item.month,
        item.percentage,
      ])
    );

    return {
      labels: allMonths,
      datasets: [
        {
          label: 'Learning Growth',
          data: allMonths.map((month) => dataMap.get(month) || 0),
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#F97316',
          pointRadius: 4,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gray-50 ${poppins.className}`}
      >
        <div className='text-center'>
          <div className='animate-spin rounded-full h-20 w-20 border-b-2 border-orange-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gray-50 ${poppins.className}`}
      >
        <div className='text-center'>
          <p className='text-red-600 text-lg mb-4'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600'
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
      className={`min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-4 ${poppins.className}`}
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
            {profileData?.class && (
              <div className='animate-pulse'>
                {getOrdinal(parseInt(profileData.class))} Class
                {profileData?.section && ` - ${profileData.section}`}
              </div>
            )}
            <div className='animate-pulse delay-100'>Self Learn AI</div>
          </div>
          <div 
            onClick={() => router.push('/profile')}
            className='w-10 h-10 bg-white text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 hover:shadow-md hover:scale-110 transition-all duration-300 flex items-center justify-center cursor-pointer overflow-hidden relative'
            title='Profile'
          >
            {dashboardData.user.profilePictureUrl ? (
              <>
                <img 
                  src={dashboardData.user.profilePictureUrl} 
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
              className={`flex-1 flex flex-col items-center py-2 rounded-xl ${
                day.isActive ? 'text-orange-800' : 'text-gray-400'
              }`}
            >
              <img
                src={`${
                  day.isActive ? '/images/Thunder.svg' : '/images/Frame.svg'
                }`}
                alt=''
                className={`w-[18px] h-[24px] transition-transform duration-300 ${day.isActive ? 'animate-pulse' : ''}`}
              />
              <span className='text-sm font-semibold'>{day.day}</span>
            </div>
          ))}
        </div>

        <div 
          className='flex-1 cursor-pointer flex items-center gap-3 px-6 py-4 rounded-xl border border-orange-200 bg-gradient-to-r from-yellow-50 to-red-50 shadow-sm hover:shadow-lg hover:scale-[1.02] hover:border-orange-300 transition-all duration-200'
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
          <div className='flex-1 text-orange-500 font-semibold'>
            {primaryChallenge ? primaryChallenge.title : 'Badge Challenge'}
            {challenges.length > 1 && (
              <span className='ml-2 text-xs text-gray-600'>({challenges.length} challenges)</span>
            )}
          </div>
          <div className='text-sm text-gray-600'>
            {primaryChallenge ? (
              primaryChallenge.current >= primaryChallenge.target ? (
                <span className='text-green-600 font-semibold'>🎉 Earned!</span>
              ) : (
                <>
                  {primaryChallenge.current}/{primaryChallenge.target}
                </>
              )
            ) : null}
          </div>
          <span className='text-orange-500 font-medium'>
            {(primaryChallenge?.quizId || primaryChallenge?.link) && !isPrimaryCompleted ? 'Start' : 'View'}
          </span>
        </div>
      </div>

      {/* Activities */}
      <div className='mb-10 mt-6'>
        <h2 className='text-xl font-semibold text-gray-800 mb-10 mt-10'>Your Activities</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {[
          {
            title: 'Continue where you left off:',
            description: dashboardData.activities.continueLearning.title,
      buttonText: 'Resume Quiz',
            link: dashboardData.activities.continueLearning.link
              ? (dashboardData.activities.continueLearning.link.includes('/users/quiz-by-id?id=')
                  ? `/quizes/${dashboardData.activities.continueLearning.link.split('id=')[1]?.split('&')[0]}/start`
                  : (/^\/quizes\/[A-Za-z0-9_-]+$/.test(dashboardData.activities.continueLearning.link)
                      ? `${dashboardData.activities.continueLearning.link}/start`
                      : dashboardData.activities.continueLearning.link))
        : (dashboardData.activities.continueLearning.quizId
          ? `/quizes/${dashboardData.activities.continueLearning.quizId}/start`
          : '/quizes'),
          },
          {
            title: 'View Progress:',
            description: dashboardData.activities.progress.subjects
              .slice(0, 2)
              .map(
                (subject) =>
                  `${(subject.name || 'Unknown Subject').substring(0, 20)} ${subject.percentage}%`
              )
              .join(' • '),
            buttonText: 'Track Progress',
            link: '/quizes',
          },
          {
            title: 'Projects:',
            description: `${dashboardData.activities.projects.pending} Project${
              dashboardData.activities.projects.pending !== 1 ? 's' : ''
            } Pending – '${dashboardData.activities.projects.nextProject}'`,
            buttonText: 'Open Projects',
            link: '/projects/teacherproject',
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className='bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 transform'
            style={{
              ...getAnimationDelay(2 + idx * 0.1, 150),
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <h3 className='font-semibold text-gray-800 mb-2'>{card.title}</h3>
            <p className='text-gray-600 text-sm mb-3 break-words line-clamp-2'>
              {card.description}
            </p>
            <button
              onClick={() => router.push(card.link)}
              className='point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 w-full sm:w-auto hover:shadow-lg hover:scale-105'
            >
              {card.buttonText}
            </button>
          </div>
        ))}
        </div>
      </div>

      {/* Main Grid */}
      <div 
        className='grid grid-cols-1 lg:grid-cols-2 gap-4'
        style={{
          ...getAnimationDelay(3, 150),
          animation: 'fadeInUp 0.8s ease-out forwards'
        }}
      >
        {/* Left Column */}
        <div className='space-y-4'>
          {/* Today's Missions */}
          <div className='bg-white p-4 rounded-2xl shadow-sm border border-gray-100 '>
            <h2 className='text-xl font-semibold text-gray-800 mb-3'>
              Today&apos;s Missions
            </h2>
            <div className='space-y-3 '>
              {dashboardData.todaysMissions.map((mission, idx) => (
                <div
                  key={idx}
                  className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-1 border-gray-200 pb-2 last:border-b-0'
                >
                  <div>
                    <h4 className='font-medium text-gray-800'>
                      {mission.title}
                    </h4>
                    <p className='text-gray-500 text-sm'>
                      {mission.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMissionClick(mission)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-white w-[150px] h-[40px]  ${
                      mission.completed
                        ? 'bg-[#009B41] hover:bg-[#008a3a] hover:shadow-lg hover:scale-105 cursor-default'
                        : 'point-ask-gradient hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:scale-105'
                    }`}
                  >
                    {mission.completed
                      ? 'Completed'
                      : (mission.quizId || mission.link) ? 'Start quiz' : 'Complete now'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Growth */}
          {/* Learning Growth */}
          <div className='bg-white p-4 rounded-2xl shadow-sm border border-gray-100'>
            <h2 className='text-xl font-semibold text-gray-800 mb-3'>
              Learning Growth
            </h2>
            <div className='relative w-full min-h-[200px]'>
              {learningGrowthData && (
                <Line
                  data={learningGrowthData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: {
                        title: {
                          display: false,
                          text: 'Month',
                        },
                        grid: { display: false },
                      },
                      y: {
                        title: {
                          display: false,
                          text: 'Percentage',
                        },
                        grid: { color: '#f3f4f6' },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className='space-y-4'>
          {/* Quick Links */}
          <div className='bg-white p-4 rounded-2xl shadow-sm border border-gray-100'>
            <h2 className='text-xl font-semibold text-gray-800 mb-3'>
              Quick Links
            </h2>
            <div className='space-y-3'>
              {dashboardData.quickLinks.map((link, idx) => (
                <div
                  key={idx}
                  className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-1 border-gray-200 pb-2 last:border-b-0 transform transition-all duration-300 hover:bg-gray-50 hover:scale-[1.01] rounded-lg px-2'
                  style={{
                    ...getAnimationDelay(4 + idx * 0.1, 150),
                    animation: 'fadeInUp 0.5s ease-out forwards'
                  }}
                >
                  <div>
                    <h4 className='font-medium text-gray-800'>{link.title}</h4>
                    <p className='text-gray-500 text-sm'>{link.description}</p>
                  </div>
                  <button
                    onClick={() => handleQuickLinkClick(link)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-white w-[150px] h-[40px] ${
                      link.status === 'Completed'
                        ? 'bg-[#009B41] hover:bg-[#008a3a] hover:shadow-lg hover:scale-105'
                        : 'point-ask-gradient hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:scale-105'
                    }`}
                  >
                    {link.status === 'Completed' 
                      ? 'Completed' 
                      : link.link && link.link.startsWith('http') 
                        ? 'View project' 
                        : (link.title.toLowerCase().includes('project') ? 'View project' : (link.status || 'Open'))
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Progress */}
          <div className='bg-white p-4 rounded-2xl shadow-sm border border-gray-100'>
            <h2 className='text-xl font-semibold text-gray-800 mb-3'>
              Progress from last week
            </h2>
            <div className='space-y-3'>
              {dashboardData.weeklyProgress.map((item, idx) => (
                <div key={idx}>
                  <div className='flex justify-between mb-1 text-sm font-medium text-gray-700'>
                    <span className=''>{(item.subject || 'Unknown Subject').toUpperCase()}</span>
                    <span>{item.percentage}%</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-3'>
                    <div
                      className='h-3 rounded-full point-ask-gradient transition-all duration-500'
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badge Challenge Modal */}
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
                    <span className="font-semibold text-orange-500">{challenges[selectedChallengeIndex]?.current} tasks</span>
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
                          background: (challenges[selectedChallengeIndex]?.current || 0) >= (challenges[selectedChallengeIndex]?.target || 0) 
                            ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' 
                            : 'linear-gradient(90deg, #FF9F27 0%, #FF5146 100%)'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Status */}
                  {(challenges[selectedChallengeIndex]?.current || 0) >= (challenges[selectedChallengeIndex]?.target || 0) ? (
                    <div className="flex items-center gap-2 text-green-700 font-semibold">
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
                          <span className="bg-orange-500 text-white text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
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
                    className="flex-1 point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    Start Challenge
                  </button>
                )}
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className={`px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:shadow-md hover:scale-105 transition-all duration-200 ${
                    ((challenges[selectedChallengeIndex]?.current || 0) >= (challenges[selectedChallengeIndex]?.target || 0)) ? 'flex-1' : ''
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
