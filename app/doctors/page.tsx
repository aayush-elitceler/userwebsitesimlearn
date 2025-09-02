"use client";
import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const STATUS_TABS = [
  { label: "All", value: "ALL", color: "#8B2D6C" },
  { label: "Approved", value: "APPROVED", color: "#25BB00" },
  { label: "Pending", value: "PENDING", color: "#F1C40F" },
  { label: "Rejected", value: "REJECTED", color: "#8B2D2F" },
];

interface Doctor {
  id: string;
  name: string;
  email: string;
  gender: string;
  countryCode: string;
  phoneNumber: string;
  profileStatus: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalDoctors: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function Doctors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState("ALL");
  const router = useRouter();

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError("");
      try {
        const token = Cookies.get("token");
        let url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/doctors?page=${currentPage}&limit=9`;
        if (status !== "ALL") url += `&status=${status}`;
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch doctors");
        const data = await res.json();
        setDoctors(data.data.doctors);
        setPagination(data.data.pagination);
      } catch (err) {
        console.log(err);
        
        setError("Error fetching doctors");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [currentPage, status]);

  // Filter by search
  const filteredDoctors = doctors
    .filter((doctor) =>
      status === "ALL" ? true : doctor.profileStatus === status
    )
    .filter((doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.countryCode + doctor.phoneNumber).includes(searchQuery)
    );

  // Tab counts (mocked for now, can be replaced with real API counts)
  const tabCounts = {
    ALL: doctors.length,
    APPROVED: doctors.filter(d => d.profileStatus === "APPROVED").length,
    PENDING: doctors.filter(d => d.profileStatus === "PENDING").length,
    REJECTED: doctors.filter(d => d.profileStatus === "REJECTED").length,
  };

  return (
    <div className="p-8 bg-[#F1F4F9] min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-medium">Doctor details</h2>
            <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search doctors here"
                className="pl-11 h-11 rounded-full bg-[#F1F4F9] border-0 ring-1 ring-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-[#F1F4F9] mb-2">
            {STATUS_TABS.map((tab) => {
              const isSelected = status === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatus(tab.value);
                    setCurrentPage(1);
                  }}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    isSelected ? "text-[#8B2D6C]" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isSelected
                        ? "bg-[#8B2D2F0F] text-[#8B2D6C]"
                        : tab.value === "APPROVED"
                        ? "bg-[#25BB000F] text-[#25BB00]"
                        : tab.value === "REJECTED"
                        ? "bg-[#8B2D2F0F] text-[#8B2D6C]"
                        : tab.value === "PENDING"
                        ? "bg-[#F1C40F1A] text-[#F1C40F]"
                        : "bg-[#F1F4F9] text-[#8B2D6C]"
                    }`}
                  >
                    {tabCounts[tab.value as keyof typeof tabCounts]}
                  </span>
                  {isSelected && (
                    <span className="absolute left-0 -bottom-px w-full h-1 rounded bg-[#8B2D6C]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F1F4F9]">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Gender</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Mobile no.</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-red-500">{error}</td>
                  </tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">No doctors found.</td>
                  </tr>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">Dr.{doctor.name}</td>
                      <td className="px-6 py-4 text-sm">{doctor.email}</td>
                      <td className="px-6 py-4 text-sm capitalize">{doctor.gender.toLowerCase()}</td>
                      <td className="px-6 py-4 text-sm">{doctor.countryCode} {doctor.phoneNumber}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/doctors/${doctor.id}`)}
                          className="px-8 py-2 rounded-full text-white font-medium"
                          style={{ background: 'linear-gradient(90deg, #704180 0%, #8B2D6C 100%)' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !error && pagination && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1}-
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalDoctors)} of {pagination.totalDoctors}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPreviousPage}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
