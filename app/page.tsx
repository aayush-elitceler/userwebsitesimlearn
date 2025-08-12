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
import { ArrowRight } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setLogoUrl } = useLogo();

  useEffect(() => {
    const fetchDashboardData = async () => {
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

        const response = await fetch(
          `https://apisimplylearn.selflearnai.in/api/v1/users/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const result: ApiResponse = await response.json();
        setDashboardData(result.data);

        // Set logo URL if available
        if (result.data.logo) {
          console.log('Setting logo URL:', result.data.logo);
          setLogoUrl(result.data.logo);
        } else {
          console.log('No logo found in data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  console.log('Dashboard Data:', dashboardData);

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
      {/* Header with Logout and Profile buttons */}
      <div className='flex justify-between items-center mb-6'>
        <div></div> {/* Empty div for spacing */}
        <div className='flex gap-3'>
          <button
            onClick={() => router.push('/profile')}
            className='px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium'
          >
            Profile
          </button>
          <button
            onClick={() => {
              Cookies.remove('auth');
              router.push('/login');
            }}
            className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium'
          >
            Logout
          </button>
        </div>
      </div>

      {/* Header */}
      <h1 className='text-2xl sm:text-3xl font-semibold text-gray-800 mb-4'>
        Hi {dashboardData.user.firstName}! 👋 Let&apos;s make today count.
      </h1>

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

        <div className='flex-1 cursor-pointer flex items-center gap-3 px-6 py-4 rounded-xl border border-orange-200 bg-gradient-to-r from-yellow-50 to-red-50 shadow-sm'>
          <img src='/images/medal.svg' alt='' className='w-[50px] h-[50px]' />
          <div className='flex-1 text-orange-500 font-semibold'>
            {dashboardData.badgeChallenge.title}
          </div>
          <div className='text-sm text-gray-600'>
            {dashboardData.badgeChallenge.current}/
            {dashboardData.badgeChallenge.target}
          </div>
          <ArrowRight size={20} className='text-orange-500' />
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
              className='point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto'
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
                    onClick={() => !mission.completed && router.push('/quizes')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-white w-[150px] h-[40px]  ${
                      mission.completed
                        ? 'bg-[#009B41] hover:bg-[#008a3a] cursor-default'
                        : 'point-ask-gradient hover:from-orange-600 hover:to-orange-700'
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
                    onClick={() => router.push('/projects/teacherproject')}
                    className={`px-4 py-2 rounded-lg font-medium text-white w-[150px] h-[40px] ${
                      link.status === 'Completed'
                        ? 'bg-[#009B41] hover:bg-[#008a3a]'
                        : 'point-ask-gradient hover:from-orange-600 hover:to-orange-700'
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
    </div>
  );
}
