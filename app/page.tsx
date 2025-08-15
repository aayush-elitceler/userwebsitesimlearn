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
}
interface QuickLink {
  title: string;
  description: string;
  status: string;
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
  badgeChallenge: BadgeChallenge;
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
  const router = useRouter();
  const { setLogoUrl } = useLogo();

  // Function to handle mission redirects based on mission type
  const handleMissionClick = (mission: Mission) => {
    if (mission.completed) return;
    
    // Determine redirect based on mission title
    if (mission.title.toLowerCase().includes('practice') || mission.title.toLowerCase().includes('mcq')) {
      // Practice MCQs - redirect to quiz generation
      router.push('/quizes/generate');
    } else if (mission.title.toLowerCase().includes('retry') || mission.title.toLowerCase().includes('mistake')) {
      // Retry past mistakes - redirect to retry incorrect questions
      router.push('/quizes/generate');
    } else if (mission.title.toLowerCase().includes('doubt') || mission.title.toLowerCase().includes('chat') || mission.title.toLowerCase().includes('voice') || mission.title.toLowerCase().includes('image')) {
      // Ask doubts - redirect to AI chat
      router.push('/aichats/chat');
    } else {
      // Default fallback
      router.push('/quizes/generate');
    }
  };

  // Function to handle quick link redirects based on link type
  const handleQuickLinkClick = (link: QuickLink) => {
    if (link.status === 'Completed') return;
    
    // Determine redirect based on link title
    if (link.title.toLowerCase().includes('project') || link.title.toLowerCase().includes('due')) {
      // Projects - redirect to projects page
      router.push('/projects/teacherproject');
    } else if (link.title.toLowerCase().includes('revision') || link.title.toLowerCase().includes('timeline') || link.title.toLowerCase().includes('ai')) {
      // Smart revision plan - redirect to personalised learning
      router.push('/aichats/voice');
    } else {
      // Default fallback
      router.push('/projects/teacherproject');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authCookie = Cookies.get('auth');
        let token: string | undefined;
        if (authCookie) {
          try {
            token = JSON.parse(authCookie).token;
          } catch (e) {
            console.error('Error parsing auth cookie:', e);
          }
        }

        if (!authCookie || !token) {
          router.push('/login');
          return;
        }

        // Fetch dashboard data
        const dashboardResponse = await fetch(
          `https://apisimplylearn.selflearnai.in/api/v1/users/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!dashboardResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardResult: ApiResponse = await dashboardResponse.json();
        setDashboardData(dashboardResult.data);

        // Set logo URL if available
        if (dashboardResult.data.logo) {
          console.log('Setting logo URL:', dashboardResult.data.logo);
          setLogoUrl(dashboardResult.data.logo);
        } else {
          console.log('No logo found in data');
        }

        // Fetch profile data to get section information
        const profileResponse = await fetch(
          'https://apisimplylearn.selflearnai.in/api/v1/users/auth/get-profile',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (profileResponse.ok) {
          const profileResult = await profileResponse.json();
          setProfileData(profileResult.data);
          console.log('Profile Data:', profileResult.data);
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

  return (
    <div
      className={`min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-6 ${poppins.className}`}
    >

      {/* Header with greeting and School/Class Info side by side */}
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl sm:text-3xl font-semibold text-gray-800'>
          Hi {dashboardData.user.firstName}! 👋 Let&apos;s make today count.
        </h1>
        <div className='flex items-center gap-3'>
          {/* School and Class Info */}
          <div className='text-sm text-gray-600 text-right'>
            {profileData?.section && (
              <div>Section {profileData.section}</div>
            )}
            <div>Self Learn AI</div>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className='w-10 h-10 bg-white text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center justify-center text-xl'
            title='Profile'
          >
            👤
          </button>
        </div>
      </div>

      {/* Streak + Badge */}
      <div className='flex flex-col md:flex-row gap-4 mb-6'>
        <div
          className='flex-1 p-4 rounded-xl flex gap-2'
          style={{
            background:
              'linear-gradient(90deg, rgba(255, 179, 31, 0.12) 0%, rgba(255, 73, 73, 0.12) 100%)',
          }}
        >
          {dashboardData.dailyStreak.days.map((day, idx) => (
            <div
              key={idx}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl ${
                day.isActive ? 'text-orange-800' : 'text-gray-400'
              }`}
            >
              {/* <span className="text-xl mb-1">⚡</span> */}
              <img
                src={`${
                  day.isActive ? '/images/Thunder.svg' : '/images/Frame.svg'
                }`}
                alt=''
                className={`w-[18px] h-[24px] `}
              />
              <span className='text-sm font-semibold'>{day.day}</span>
            </div>
          ))}
        </div>

        <div 
          className='flex-1 cursor-pointer flex items-center gap-3 px-6 py-4 rounded-xl border border-orange-200 bg-gradient-to-r from-yellow-50 to-red-50 shadow-sm hover:shadow-lg hover:scale-[1.02] hover:border-orange-300 transition-all duration-200'
          onClick={() => setShowBadgeModal(true)}
        >
          <img src='/images/medal.svg' alt='' className='w-[50px] h-[50px]' />
          <div className='flex-1 text-orange-500 font-semibold'>
            {dashboardData.badgeChallenge.title}
          </div>
          <div className='text-sm text-gray-600'>
            {dashboardData.badgeChallenge.current}/
            {dashboardData.badgeChallenge.target}
          </div>
          <span className='text-orange-500 font-medium'>View</span>
        </div>
      </div>

      {/* Activities */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
        {[
          {
            title: 'Continue where you left off:',
            description: dashboardData.activities.continueLearning.title,
            buttonText: 'Resume Learning',
            link: '/quizes',
          },
          {
            title: 'View Progress:',
            description: dashboardData.activities.progress.subjects
              .slice(0, 2)
              .map(
                (subject) =>
                  `${subject.name!.substring(0, 20)} ${subject.percentage}%`
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
            className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'
          >
            <h3 className='font-semibold text-gray-800 mb-2'>{card.title}</h3>
            <p className='text-gray-600 text-sm mb-4 break-words line-clamp-2'>
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

      {/* Main Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Left Column */}
        <div className='space-y-6'>
          {/* Today's Missions */}
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 '>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>
              Today&apos;s Missions
            </h2>
            <div className='space-y-4 '>
              {dashboardData.todaysMissions.map((mission, idx) => (
                <div
                  key={idx}
                  className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-1 border-gray-200 pb-3 last:border-b-0'
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
                    {mission.completed ? 'Completed' : 'Complete now'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Growth */}
          {/* Learning Growth */}
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>
              Learning Growth
            </h2>
            <div className='relative w-full min-h-[250px]'>
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
        <div className='space-y-6'>
          {/* Quick Links */}
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>
              Quick Links
            </h2>
            <div className='space-y-4'>
              {dashboardData.quickLinks.map((link, idx) => (
                <div
                  key={idx}
                  className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-1 border-gray-200 pb-3 last:border-b-0'
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
                    {link.status}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Progress */}
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>
              Progress from last week
            </h2>
            <div className='space-y-4'>
              {dashboardData.weeklyProgress.map((item, idx) => (
                <div key={idx}>
                  <div className='flex justify-between mb-1 text-sm font-medium text-gray-700'>
                    <span className=''>{item.subject.toUpperCase()}</span>
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
                  <h2 className="text-2xl font-semibold text-gray-800">Badge Challenge</h2>
                </div>
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className="p-2 hover:bg-gray-100 hover:shadow-md hover:scale-110 rounded-full transition-all duration-200"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {dashboardData.badgeChallenge.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {dashboardData.badgeChallenge.description}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-semibold text-orange-500">
                      {dashboardData.badgeChallenge.current}/{dashboardData.badgeChallenge.target}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-semibold text-red-500">
                      {dashboardData.badgeChallenge.deadline}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Challenge Questions:</h4>
                <div className="space-y-4">
                  {dashboardData.badgeChallenge.questions.map((question, index) => (
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

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/quizes/generate')}
                  className="flex-1 point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  Start Challenge
                </button>
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:shadow-md hover:scale-105 transition-all duration-200"
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
