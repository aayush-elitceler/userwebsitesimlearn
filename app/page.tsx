
"use client"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Poppins } from "next/font/google";
import { CheckCircle2, ArrowRight, Calendar, BookOpen, Target, Users, Zap, TrendingUp } from "lucide-react";

const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"] });
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const Home = () => {
  const weekDays = [
    { day: "M", date: "04", active: true, icon: "⚡" },
    { day: "T", date: "05", active: true, icon: "⚡" },
    { day: "W", date: "06", active: true, icon: "⚡" },
    { day: "T", date: "07", active: true, icon: "⚡" },
    { day: "F", date: "08", active: false, icon: "⚡" },
    { day: "S", date: "09", active: false, icon: "⚡" },
    { day: "S", date: "10", active: false, icon: "⚡" },
  ];

  const missions = [
    { task: "Practice 3 MCQs", completed: true },
    { task: "Retry 1 past mistake", completed: true },
    { task: "Ask 1 doubt (chat / voice / image)", completed: true },
  ];

  const quickLinks = [
    { task: "My Projects (1 due in 2 days)", completed: true },
    { task: "Smart Revision Plan (AI timeline ready)", completed: true },
    { task: "Mock Interviews (UX role active)", completed: true },
  ];

  const learningGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Learning Growth',
        data: [20, 35, 25, 45, 30, 60, 45],
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const progressData = [
    { subject: "Algebra", progress: 48, color: "point-ask-gradient" },
    { subject: "Grammar", progress: 88, color: "point-ask-gradient" },
  ];

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${poppins.className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">

        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Hi John! 👋 Let&apos;s make today count.
        </h1>
        <button className=" cursor-pointer  ml-4 text-orange-500 font-semibold flex items-center gap-1 hover:text-orange-600 transition-colors">
            View all <ArrowRight size={16} />
          </button>
        
        </div>
        {/* Weekly Calendar */}
        <div className="flex gap-2 mt-6 w-max p-4 rounded-md" 
        style={{background: 'linear-gradient(90deg, rgba(255, 179, 31, 0.12) 0%, rgba(255, 73, 73, 0.12) 100%)'}}>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                day.active 
                  ? 'bg-transparent text-[#FF4D47]' 
                  : 'bg-transparent'
              }`}
            >
              <span className="text-2xl mb-1 ">{day.icon}</span>
              <span className={`text-sm font-semibold ${day.active ? 'text-orange-600' : 'text-gray-400'}`}>
                {day.day}
              </span>
            </div>
          ))}
         
        </div>
        
      </div>
      

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Continue Learning Card */}
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Continue where you left off:</h3>
          <p className="text-gray-600 text-sm mb-4">Last: Algebra Practice Set</p>
          <button className=" cursor-pointer  point-ask-gradient text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors">
            Resume Learning
          </button>
        </div>


        {/* View Progress Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">View Progress:</h3>
          <p className="text-gray-600 text-sm mb-4">Algebra 68% • Grammar 45%</p>
          <button className=" cursor-pointer  point-ask-gradient text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors">
            Track Progress
          </button>
        </div>

        {/* Create Practice Tests Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Create Practice tests:</h3>
          <p className="text-gray-600 text-sm mb-4">Generate custom tests by topic & difficulty</p>
          <button className=" cursor-pointer  point-ask-gradient text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors">
            Start Exam
          </button>
        </div>

        {/* Projects Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Projects:</h3>
          <p className="text-gray-600 text-sm mb-4">1 Project Pending - &apos;Solar System&apos;</p>
          <button className=" cursor-pointer  point-ask-gradient text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors">
            Open Projects
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Today's Missions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Today&apos;s Missions</h2>
            <div className="space-y-4">
              {missions.map((mission, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span className="text-gray-700">{mission.task}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Growth Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Learning growth</h2>
            <div className="h-64">
              <Line 
                data={learningGrowthData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { 
                      grid: { display: false },
                      border: { display: false }
                    },
                    y: { 
                      grid: { color: '#f3f4f6' },
                      border: { display: false },
                      ticks: { display: false }
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
            <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Links</h2>
            <div className="space-y-4">
              {quickLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span className="text-gray-700">{link.task}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress from last week */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Progress from last week</h2>
            <div className="space-y-6">
              {progressData.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">{item.subject}</span>
                    <span className="text-gray-700 font-bold">{item.progress}%</span>
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
};

export default Home;