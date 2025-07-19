"use client"
import { useState } from 'react';

import { useRouter } from 'next/navigation';

const mockInstitution = {
  name: "Harmony Public School",
  type: "School",
  affiliatedBoard: "CBSE",
  address: {
    street: "123 Main Street",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110001"
  },
  email: "info@harmonyps.edu.in",
  phone: "+91 9876543210",
  website: "https://harmonyps.edu.in",
  yearOfEstablishment: "2005",
  totalStudents: 1200,
};

export default function InstitutionProfile() {
  const [institution] = useState(mockInstitution);
  const router = useRouter();

  const handleLogout = () => {
    // Remove token/cookie logic here if needed
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans">
      <div className="w-full max-w-5xl min-h-[80vh] bg-white rounded-2xl shadow-lg flex overflow-hidden border border-[#F2EAF6]">
        {/* Sidebar */}
        <aside className="w-72 border-r border-[#F2EAF6] flex flex-col py-8 px-6">
          <div className="text-xl font-semibold mb-8">My profile</div>
          <nav className="flex-1 flex flex-col gap-2">
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#F8F2F9] text-[#8B2D6C] font-medium border-l-4 border-[#8B2D6C]">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><circle cx="10" cy="10" r="8" /></svg>
               Information
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#F8F2F9] transition">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><circle cx="10" cy="10" r="8" /></svg>
              About Us
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#F8F2F9] transition">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><circle cx="10" cy="10" r="8" /></svg>
              Terms & Conditions
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#F8F2F9] transition">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><circle cx="10" cy="10" r="8" /></svg>
              My plans
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#F8F2F9] transition">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><circle cx="10" cy="10" r="8" /></svg>
              Privacy Policy
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#F8F2F9] transition">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><circle cx="10" cy="10" r="8" /></svg>
              Report an issue
            </button>
          </nav>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 mt-8 text-[#E11D48] font-medium hover:underline"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className=""><path d="M15 12l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
            Logout
          </button>
        </aside>
        {/* Main Card */}
        <main className="flex-1 flex flex-col items-center justify-center py-12 px-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#8B2D6C] to-[#C6426E] flex items-center justify-center text-white text-3xl font-bold mb-2">
              {institution.name.charAt(0)}
            </div>
            <div className="text-2xl font-bold text-[#1A2343] mt-2">{institution.name}</div>
            <div className="text-gray-500 text-base">{institution.email}</div>
          </div>
          <div className="w-full max-w-2xl grid grid-cols-2 gap-x-12 gap-y-6 bg-[#F8F2F9] rounded-2xl p-8">
            <div>
              <div className="text-gray-500">Institution Type</div>
              <div className="font-semibold text-lg">{institution.type}</div>
            </div>
            <div>
              <div className="text-gray-500">Affiliated Board/University</div>
              <div className="font-semibold text-lg">{institution.affiliatedBoard}</div>
            </div>
            <div>
              <div className="text-gray-500">Street Address</div>
              <div className="font-semibold text-lg">{institution.address.street}</div>
            </div>
            <div>
              <div className="text-gray-500">City</div>
              <div className="font-semibold text-lg">{institution.address.city}</div>
            </div>
            <div>
              <div className="text-gray-500">State</div>
              <div className="font-semibold text-lg">{institution.address.state}</div>
            </div>
            <div>
              <div className="text-gray-500">Pincode</div>
              <div className="font-semibold text-lg">{institution.address.pincode}</div>
            </div>
            <div>
              <div className="text-gray-500">Official Phone</div>
              <div className="font-semibold text-lg">{institution.phone}</div>
            </div>
            <div>
              <div className="text-gray-500">Website</div>
              <div className="font-semibold text-lg">
                <a href={institution.website} target="_blank" rel="noopener noreferrer" className="text-[#8B2D6C] underline">{institution.website}</a>
              </div>
            </div>
            <div>
              <div className="text-gray-500">Year of Establishment</div>
              <div className="font-semibold text-lg">{institution.yearOfEstablishment}</div>
            </div>
            <div>
              <div className="text-gray-500">Total Student Strength</div>
              <div className="font-semibold text-lg">{institution.totalStudents}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}