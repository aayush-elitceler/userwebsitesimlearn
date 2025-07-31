"use client";
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

const weekDays = [
  { day: "M", active: true },
  { day: "T", active: true },
  { day: "W", active: true },
  { day: "T", active: true },
  { day: "F", active: false },
  { day: "S", active: false },
  { day: "S", active: false },
];

const missions = [
  { task: "Practice 3 MCQs" },
  { task: "Retry 1 past mistake" },
  { task: "Ask 1 doubt (chat / voice / image)" },
];

const quickLinks = [
  { task: "My Projects (1 due in 2 days)", status: "Completed" },
  { task: "Smart Revision Plan (AI timeline ready)", status: "Complete now" },
  { task: "Mock Interviews (UX role active)", status: "Complete now" },
];

const learningGrowthData = {
  labels: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  datasets: [
    {
      label: "Learning Growth",
      data: [20, 35, 25, 45, 30, 60, 45, 50, 95, 40, 30, 35],
      borderColor: "#F97316",
      backgroundColor: "rgba(249, 115, 22, 0.1)",
      tension: 0.4,
      fill: true,
      pointBackgroundColor: "#F97316",
      pointRadius: 4,
    },
  ],
};

const progressData = [
  {
    subject: "Algebra",
    progress: 48,
    color: "point-ask-gradient",
  },
  {
    subject: "Grammar",
    progress: 88,
    color: "point-ask-gradient",
  },
];

export default function Home() {
  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${poppins.className}`}>
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Hi John! <span className="inline-block">👋</span> Let&apos;s make
            today count.
          </h1>
 
          {/* Streak & Badge Wrapper - Fixed Layout */}
          <div className="flex flex-col md:flex-row w-full gap-4 mt-4">
            {/* Streak Calendar - Now takes exactly half width */}
            <div
              className="w-full md:w-1/2 flex gap-2 p-4 rounded-xl"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255, 179, 31, 0.12) 0%, rgba(255, 73, 73, 0.12) 100%)",
              }}
            >
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex-1 flex flex-col items-center px-2 py-2 rounded-xl ${
                    day.active ? "text-orange-500" : "text-gray-400"
                  }`}
                >
                  <span className="text-xl mb-1">⚡</span>
                  <span className="text-sm font-semibold">{day.day}</span>
                </div>
              ))}
            </div>

            {/* Badge Card - Now takes exactly half width */}
            <div className="w-full md:w-1/2 cursor-pointer flex items-center gap-3 px-6 py-4 rounded-xl border border-orange-200 bg-gradient-to-r from-yellow-50 to-red-50 shadow-sm">
              <span className="text-2xl">
                <img src="/images/medal.svg" alt="" />
              </span>
              <span className="text-orange-500 font-semibold flex-1">
                Solve 5 MCQs before 8 PM to win badge
              </span>
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
              Last: Algebra Practice Set
            </p>
            <button className="cursor-pointer point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Resume Learning
            </button>
          </div>
          {/* View Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">View Progress:</h3>
            <p className="text-gray-600 text-sm mb-4">
              Algebra 68% • Grammar 45%
            </p>
            <button className="cursor-pointer point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Track Progress
            </button>
          </div>
          {/* Projects */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Projects:</h3>
            <p className="text-gray-600 text-sm mb-4">
              1 Project Pending – &apos;Solar System&apos;
            </p>
            <button className="cursor-pointer point-ask-gradient hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Open Projects
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Today's Missions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Today&apos;s Missions
            </h2>
            <div className="space-y-4">
              {missions.map((mission, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-700">{mission.task}</span>
                  <button className="cursor-pointer point-ask-gradient text-white px-4 py-1 rounded-lg font-medium text-sm shadow hover:from-orange-600 hover:to-orange-700 transition-colors">
                    Complete now
                  </button>
                </div>
              ))}
            </div>
          </div>
          {/* Learning Growth */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Learning growth
            </h2>
            <div className="h-28">
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
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Links */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Quick Links
            </h2>
            <div className="space-y-4">
              {quickLinks.map((link, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-700">{link.task}</span>
                  <span
                    className={`cursor-pointer text-white px-4 py-1 rounded-lg font-medium text-sm shadow transition-colors ${
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Progress from last week
            </h2>
            <div className="space-y-6">
              {progressData.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">
                      {item.subject}
                    </span>
                    <span className="text-gray-700 font-semibold">
                      {item.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.progress}%` }}
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

