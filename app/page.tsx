"use client";
import { useEffect, useState } from "react";
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
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Poppins } from "next/font/google";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"] });
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

// TypeScript interfaces for API response
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
  name: string;
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const authCookie = Cookies.get("auth");
      let token: string | undefined;
      if (authCookie) {
        try {
          token = JSON.parse(authCookie).token;
        } catch (e) {
          console.error('Error parsing auth cookie:', e);
        }
      }
        
        const response = await fetch(`https://apisimplylearn.selflearnai.in/api/v1/users/dashboard`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const result: ApiResponse = await response.json();
        setDashboardData(result.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Create chart data from API response
  const createLearningGrowthData = () => {
    if (!dashboardData?.learningGrowth) return null;

    const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dataMap = new Map(dashboardData.learningGrowth.data.map(item => [item.month, item.percentage]));
    
    return {
      labels: allMonths,
      datasets: [
        {
          label: "Learning Growth",
          data: allMonths.map(month => dataMap.get(month) || 0),
          borderColor: "#F97316",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#F97316",
          pointRadius: 4,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${poppins.className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${poppins.className}`}>
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
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
    <div className={`min-h-screen bg-gray-50 p-6 ${poppins.className}`}>
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Hi {dashboardData.user.firstName}! <span className="inline-block">👋</span> Let&apos;s make today count.
          </h1>
 
          {/* Streak & Badge Wrapper */}
          <div className="flex flex-col md:flex-row w-full gap-4 mt-4">
            {/* Streak Calendar */}
            <div
              className="w-full md:w-1/2 flex gap-2 p-4 rounded-xl"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255, 179, 31, 0.12) 0%, rgba(255, 73, 73, 0.12) 100%)",
              }}
            >
              {dashboardData.dailyStreak.days.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex-1 flex flex-col items-center px-2 py-2 rounded-xl ${
                    day.isActive ? "text-orange-500" : "text-gray-400"
                  }`}
                >
                  <span className="text-xl mb-1">⚡</span>
                  <span className="text-sm font-semibold">{day.day}</span>
                </div>
              ))}
            </div>

            {/* Badge Card */}
            <div className="w-full md:w-1/2 cursor-pointer flex items-center gap-3 px-6 py-4 rounded-xl border border-orange-200 bg-gradient-to-r from-yellow-50 to-red-50 shadow-sm">
              <span className="text-2xl">
                <img src="/images/medal.svg" alt="" />
              </span>
              <span className="text-orange-500 font-semibold flex-1">
                {dashboardData.badgeChallenge.title}
              </span>
              <div className="text-sm text-gray-600">
                {dashboardData.badgeChallenge.current}/{dashboardData.badgeChallenge.target}
              </div>
              <button className="cursor-pointer text-orange-500 hover:text-orange-600 flex-shrink-0">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Your activities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Continue Learning */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">
              Continue where you left off:
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {dashboardData.activities.continueLearning.title}
            </p>
            <button onClick={() => router.push('/quizes')} className="cursor-pointer point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Resume Learning
            </button>
          </div>
          
          {/* View Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">View Progress:</h3>
            <p className="text-gray-600 text-sm mb-4">
              {dashboardData.activities.progress.subjects.slice(0, 2).map((subject, idx) => (
                <span key={idx}>
                  {subject.name.substring(0, 20)}{subject.name.length > 20 ? '...' : ''} {subject.percentage}%
                  {idx === 0 && dashboardData.activities.progress.subjects.length > 1 ? ' • ' : ''}
                </span>
              ))}
            </p>
            <button onClick={() => router.push('/quizes')} className="cursor-pointer point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Track Progress
            </button>
          </div>
          
          {/* Projects */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Projects:</h3>
            <p className="text-gray-600 text-sm mb-4">
              {dashboardData.activities.projects.pending} Project{dashboardData.activities.projects.pending !== 1 ? 's' : ''} Pending – &apos;{dashboardData.activities.projects.nextProject}&apos;
            </p>
            <button onClick={() => router.push('/projects/teacherproject')} className="cursor-pointer point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Open Projects
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Column */}
        <div className="flex flex-col h-full">
          {/* Today's Missions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[280px]">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Today&apos;s Missions
            </h2>
            <div className="space-y-4">
              {dashboardData.todaysMissions.map((mission, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="text-gray-700 font-medium">{mission.title}</span>
                    <p className="text-gray-500 text-sm">{mission.description}</p>
                  </div>
                  {mission.completed ? (
                    // #009B41
                    <button className=" bg-[#009B41] text-white px-7 py-2 rounded-lg font-medium transition-colors">
                      Completed
                    </button>
                  ) : (
                    <button className="cursor-pointer point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      Complete now
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Learning Growth */}
          <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm border border-gray-100 h-full flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Learning growth
            </h2>
            <div className="h-46">
              {learningGrowthData && (
                <Line
                  data={learningGrowthData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false }, border: { display: false } },
                      y: {
                        grid: { color: "#f3f4f6" },
                        border: { display: false },
                        ticks: { display: false },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="flex flex-col h-full">
          {/* Quick Links */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[280px]">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Quick Links
            </h2>
            <div className="space-y-4">
              {dashboardData.quickLinks.map((link, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="text-gray-700 font-medium">{link.title}</span>
                    <p className="text-gray-500 text-sm">{link.description}</p>
                  </div>
                  <span
                   className={`cursor-pointer point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ${
                      link.status === "Completed"
                        ? "bg-[#009B41] hover:bg-[#008a3a]"
                        : "point-ask-gradient hover:from-orange-600 hover:to-orange-700"
                    }`}
                  >
                    {link.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Progress from last week */}
          <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm border border-gray-100 h-full flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Progress from last week
            </h2>
            <div className="space-y-6">
              {dashboardData.weeklyProgress.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">
                      {item.name}
                    </span>
                    <span className="text-gray-700 font-semibold">
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full point-ask-gradient transition-all duration-500"
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

