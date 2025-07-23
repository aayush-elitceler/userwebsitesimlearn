"use client"
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  email: string;
  isPaid: boolean;
  createdAt: string;
  // Add other fields from the API response if needed for display
}

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const router = useRouter();

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError("");
      try {
        const token = Cookies.get("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/doctors?page=${currentPage}&limit=${itemsPerPage}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch doctors");
        const data = await res.json();
        
        const paidDoctors = data.data.doctors.filter((doctor: Doctor) => doctor.isPaid);
        setDoctors(paidDoctors);
      } catch (err) {
        console.error(err);
        setError("Error fetching doctors");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [currentPage]); // Re-fetch when currentPage changes

  const filteredDoctors = doctors.filter(
    (doctor) =>
      (doctor.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-medium">Payment details</h2> {/* Reusing Course details title for now */}
            <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search payments here" // Reusing placeholder for now
                className="pl-11 h-11 rounded-full bg-[#F1F4F9] border-0 ring-1 ring-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F1F4F9]"><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Name</th><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Plan</th><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Amount</th><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Date</th><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className="text-center py-8 text-red-500">{error}</td></tr>
                ) : currentDoctors.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No payments found.</td></tr>
                ) : (
                  currentDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm">{doctor.name}</td><td className="px-6 py-4 text-sm">Basic</td>{/*Placeholder*/}<td className="px-6 py-4 text-sm">Rs.10,000</td>{/*Placeholder*/}<td className="px-6 py-4 text-sm">{new Date(doctor.createdAt).toLocaleDateString('en-US', {day: 'numeric',month: 'long',year: 'numeric',})}</td><td className="px-6 py-4 text-sm">Paid</td><td className="px-6 py-4"><button onClick={() => router.push(`/payments/${doctor.id}`)} className="px-8 py-2 rounded-full text-white font-medium cursor-pointer" style={{ background: 'linear-gradient(90deg, #704180 0%, #8B2D6C 100%)' }}>View</button></td></tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !error && filteredDoctors.length > 0 && ( // Changed to filteredDoctors.length
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredDoctors.length)} of {filteredDoctors.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
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
