"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { Nunito_Sans } from "next/font/google";
const nunitoSans = Nunito_Sans({ weight: ["400", "600", "700"], subsets: ["latin"] });
interface TestData {
  id: string;
  testName: string;
  score: number;
  reportStatus: string;
  status: string;
  testDate: string;
  reportUrl: string;
  formattedTestDate: string;
  formattedTestTime: string;
}

interface AssessmentCycle {
  cycleName: string;
  tests: TestData[];
  latestSummaryReportUrl: string;
  latestDetailedReportUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  noOfTests: number;
  countryCode?: string;
  createdAt?: string;
  referralCode?: string;
}

export default function UserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [assessmentCycles, setAssessmentCycles] = useState<AssessmentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const token = Cookies.get("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/user-reports?userId=${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch user details");
        const data = await res.json();
        console.log(data.data , "user data");
        
        setUser(data.data.user);
        setAssessmentCycles(data.data.assessmentCycles || []);
      } catch (err) {
        console.error(err);
        setError("Error fetching user details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  const handleTestRowClick = (test: TestData) => {
    if (test.reportStatus === "AVAILABLE" && test.reportUrl) {
      window.open(test.reportUrl, '_blank');
    }
  };

  return (
    <div className={`p-8 bg-gray-100 min-h-screen ${nunitoSans.className}`}>
      {/* User Details Card */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">User details</h2>
            <button className="text-gray-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          {loading ? (
            <div className="py-4">Loading...</div>
          ) : error ? (
            <div className="text-red-500 py-4">{error}</div>
          ) : user ? (
            <div className="grid grid-cols-5 gap-8">
              <div>
                <div className="text-gray-500 mb-1">Name</div>
                <div className="font-medium">{user.name}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Phone Number</div>
                <div className="font-medium">{user.countryCode ? `${user.countryCode} ${user.phoneNumber}` : user.phoneNumber}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Referral Code</div>
                <div className="font-medium">{user.referralCode || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Signed up date</div>
                <div className="font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Tests Done</div>
                <div className="font-medium">{user.noOfTests}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Tests Table Card */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold">Mental Health Tests Taken</h3>
            {/* <button 
              onClick={downloadOverallReports}
              className="flex items-center cursor-pointer gap-2 px-6 py-2.5 rounded-full text-white font-medium"
              style={{ background: 'linear-gradient(90deg, #704180 0%, #8B2D6C 100%)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download reports
            </button> */}
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : assessmentCycles.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No tests found.</div>
            ) : (
              assessmentCycles.map((cycle, index) => (
                <details key={index} className="mb-4 rounded-lg">
                  <summary className="px-6 py-4 bg-gray-50 flex justify-between items-center cursor-pointer">
                    <span className="font-medium">Cycle {cycle.cycleName}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening/closing details when button is clicked
                          if (cycle.latestSummaryReportUrl) {
                            window.open(cycle.latestSummaryReportUrl, '_blank');
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-sm"
                        style={{ background: 'linear-gradient(90deg, #704180 0%, #8B2D6C 100%)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        Summary
                      </button>
                      {cycle.latestDetailedReportUrl && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent opening/closing details when button is clicked
                            if (cycle.latestDetailedReportUrl) {
                              window.open(cycle.latestDetailedReportUrl, '_blank');
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-sm"
                          style={{ background: 'linear-gradient(90deg, #704180 0%, #8B2D6C 100%)' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                          </svg>
                          Detailed
                        </button>
                      )}
                    </div>
                  </summary>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white">
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Test name</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Score</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Report status</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cycle.tests.map((test) => (
                        <tr 
                          key={test.id} 
                          onClick={() => handleTestRowClick(test)}
                          className={`hover:bg-gray-50 ${
                            test.reportStatus === "AVAILABLE" && test.reportUrl 
                              ? "cursor-pointer" 
                              : "cursor-default"
                          }`}
                        >
                          <td className="px-6 py-4 text-sm">{test.testName}</td>
                          <td className="px-6 py-4 text-sm">
                            {new Date(test.testDate).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm">{test.score}</td>
                          <td className="px-6 py-4 text-sm capitalize">{test.reportStatus.toLowerCase()}</td>
                          <td className="px-6 py-4 text-sm">{test.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}