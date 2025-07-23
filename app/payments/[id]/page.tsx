"use client"
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Edit, ChevronLeft } from "lucide-react";

interface User {
  id: string;
  referralCode: string;
  name: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  gender: string;
  dob: string;
  noOfTests: number;
  createdAt: string;
}

interface ReferralCode {
  id: string;
  code: string;
  doctorId: string;
  userId: string | null;
  isFree: boolean;
  expiresAt: string;
  stripePaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: User | null;
}

interface DoctorDetails {
  id: string;
  name: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  profilePicture: string;
  gender: string;
  qualification: string;
  additionalQualifications: string[];
  workLocation: string;
  specialization: string;
  medicalLicenseNumber: string;
  experience: number;
  photoUrl: string;
  licenseUrl: string;
  govtIdUrl: string;
  profileStatus: string;
  consultationFee: number;
  stripeCustomerId: string;
  isPaid: boolean;
  fcmToken: string;
  freeReferralsGenerated: number;
  paidReferralsGenerated: number;
  createdAt: string;
  updatedAt: string;
  referralCodes: ReferralCode[];
}

export default function DoctorDetailsPage() {
  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (!id) return;

    const fetchDoctorDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const token = Cookies.get("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/doctor-by-id?doctorId=${id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch doctor details");
        }
        const data = await res.json();
        setDoctor(data.data);
      } catch (err) {
        console.error(err);
        setError("Error fetching doctor details");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorDetails();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading doctor details...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!doctor) {
    return <div className="p-8 text-center">No doctor details found.</div>;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 mr-2">
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <h2 className="text-2xl font-medium">Doctor details</h2>
          </div>
          <Edit className="h-5 w-5 text-gray-500 cursor-pointer" />
        </div>
        <div className="flex items-center space-x-6 mb-8">
          <Image
            src={'/images/imageprofile.png'}
            alt="Doctor Profile"
            width={80}
            height={80}
            className="rounded-full object-cover"
          />
          <div className="grid grid-cols-3 gap-y-4 gap-x-12 w-full">
            <div>
              <p className="text-gray-500 text-sm">Name</p>
              <p className="font-medium">{doctor.name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Email Id</p>
              <p className="font-medium">{doctor.email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Gender</p>
              <p className="font-medium">{doctor.gender}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Mobile no.</p>
              <p className="font-medium">{doctor.countryCode} {doctor.phoneNumber}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Consultation Fees</p>
              <p className="font-medium">INR {doctor.consultationFee} Hour</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Location</p>
              <p className="font-medium">{doctor.workLocation}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medium">Payment details</h2>
          <Edit className="h-5 w-5 text-gray-500 cursor-pointer" />
        </div>
        <div className="grid grid-cols-3 gap-y-4 gap-x-12 w-full">
          <div>
            <p className="text-gray-500 text-sm">Amount Paid</p>
            <p className="font-medium">INR {doctor.consultationFee}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Transaction Id</p>
            <p className="font-medium">Jane@okicic</p> {/* Placeholder */}
          </div>
          <div>
            <p className="text-gray-500 text-sm">UPI/Card used</p>
            <p className="font-medium">Credit Card</p> {/* Placeholder */}
          </div>
          <div>
            <p className="text-gray-500 text-sm">Status</p>
            <p className="font-medium">{doctor.isPaid ? "Paid" : "Unpaid"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Referral usage</p>
            <p className="font-medium">{doctor.freeReferralsGenerated} free {doctor.paidReferralsGenerated} paid</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-medium mb-6">Referral Tracking</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F1F4F9]"><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Sr.no</th><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Referral Code</th><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Number of patients used</th><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Referral cap</th><th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Next billing date</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctor.referralCodes.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No referral codes found.</td></tr>
              ) : (
                doctor.referralCodes.map((referral, index) => (
                  <tr key={referral.id} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm">{index + 1}.</td><td className="px-6 py-4 text-sm">{referral.code}</td><td className="px-6 py-4 text-sm">{referral.user ? 1 : 0}</td> {/* Placeholder, assuming 1 if user exists, 0 otherwise */}<td className="px-6 py-4 text-sm">5 free 2 paid</td> {/* Placeholder */}<td className="px-6 py-4 text-sm">
                      {new Date(referral.expiresAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 