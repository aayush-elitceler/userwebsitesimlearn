"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { useToast } from "@/hooks/use-toast";


interface Doctor {
  id: string;
  name: string;
  email: string;
  gender: string;
  countryCode: string;
  phoneNumber: string;
  photoUrl: string;
  consultationFee: number;
  workLocation: string;
  qualification: string;
  additionalQualifications: string[];
  specialization: string;
  experience: number;
  medicalLicenseNumber: string;
  licenseUrl: string;
  govtIdUrl?: string;
  profileStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  gender: string;
  referralCode?: string;
}

export default function DoctorDetails() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast(); // Initialize Shadcn's toast


  


  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      setError("");
      try {
        const token = Cookies.get("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/doctor-by-id?doctorId=${id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch doctor details");
        const data = await res.json();
        setDoctor(data.data);
        console.log(data.data);
        
        setPatients(
          (data.data.referralCodes || [])
            .filter((ref: { user?: Patient }) => ref.user)
            .map((ref: { user: Patient; code?: string }) => ({
              ...ref.user,
              referralCode: ref.code,
            }))
        );
      } catch (err) {
        console.log(err);
        setError("Error fetching doctor details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDoctor();
  }, [id]);

  const handleVerify = async (status: "APPROVED" | "REJECTED") => {
    if (!doctor) return;
    setActionLoading(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/verify-doctor?doctorId=${doctor.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok){
        throw new Error("Failed to update doctor status");
      }else{
          toast({
            title: "Success",
            description: "Doctor status updated successfully!",
            variant: "default", // Use 'default' for success
            className: "bg-green-500 text-white",
          });
      }
      // Optionally, refetch doctor details or update status locally
      setDoctor({ ...doctor, profileStatus: status });
      window.location.reload();
    //   router.push('/doctors');
    } catch (err) {
        console.log(err);
        
      alert("Failed to update doctor status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 bg-[#F1F4F9] min-h-screen">
      {/* Doctor details card */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start p-6 pb-2 gap-6">
          <h2 className="text-xl font-medium">Doctor details</h2>
          <button className="text-gray-400 hover:text-[#8B2D6C]">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 2 21l1.5-5L16.5 3.5Z" /></svg>
          </button>
        </div>
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : error ? (
          <div className="p-6 text-red-500">{error}</div>
        ) : doctor ? (
          <div className="flex gap-8 p-6 pt-0">
            <div className="flex-shrink-0">
              <img src={doctor.photoUrl} alt={doctor.name} className="w-28 h-28 rounded-full object-cover border-4 border-[#F1F4F9]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 w-full font-[poppins]">
              <div>
                <div className="text-gray-500 text-sm mb-1">Name</div>
                <div className="font-medium text-lg">{doctor.name}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Email Id</div>
                <div className="font-medium text-lg break-words">{doctor.email}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Gender</div>
                <div className="font-medium text-lg capitalize">{doctor.gender.toLowerCase()}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Mobile no.</div>
                <div className="font-medium text-lg">{doctor.countryCode} {doctor.phoneNumber}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Consultation Fees</div>
                <div className="font-medium text-lg">INR {doctor.consultationFee} Hour</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Location</div>
                <div className="font-medium text-lg">{doctor.workLocation || "-"}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Professional details card */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start p-6 pb-2 gap-6">
          <h2 className="text-xl font-semibold">Professional details</h2>
          <button className="text-gray-400 hover:text-[#8B2D6C]">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 2 21l1.5-5L16.5 3.5Z" /></svg>
          </button>
        </div>
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : error ? (
          <div className="p-6 text-red-500">{error}</div>
        ) : doctor ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 p-6 pt-0 font-[poppins] font-medium">
            <div>
              <div className="text-gray-500 text-sm mb-1">Qualification</div>
              <div className="font-medium text-lg">{doctor.qualification}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm mb-1">Additional Qualification</div>
              <div className="font-medium text-lg">{doctor.additionalQualifications?.join(", ") || "None"}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm mb-1">Area of Specialization</div>
              <div className="font-medium text-lg ">{doctor.specialization}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm mb-1">Experience</div>
              <div className="font-medium text-lg">{doctor.experience} years</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm mb-1">Medical license number</div>
              <div className="font-medium text-lg">{doctor.medicalLicenseNumber}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm mb-1">Medical license number</div>
              {doctor.licenseUrl ? (
                <a
                  href={doctor.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6F6F6F12] font-medium"
                >
                    <img src="/images/pdfDoc.png" className="w-5 h-6" alt="" />
                  Document.pdf
                </a>
              ) : (
                <span className="text-gray-400">No document</span>
              )}
            </div>
            <div>
              <div className="text-gray-500 text-sm mb-1">Govt ID</div>
              {doctor.govtIdUrl ? (
                <a
                  href={doctor.govtIdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6F6F6F12] font-medium"
                >
                    <img src="/images/pdfDoc.png" className="w-5 h-6" alt="" />
                  Document.pdf
                </a>
              ) : (
                <span className="text-gray-400">No document</span>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Approve/Reject buttons if status is PENDING */}
      {doctor && doctor.profileStatus === "PENDING" && (
        <div className="flex justify-end gap-4 mb-8">
          <button
            onClick={() => handleVerify("REJECTED")}
            disabled={actionLoading}
            className="px-14 py-2 rounded-full bg-[#CF0000] text-white font-medium text-lg hover:bg-[#a93226] transition disabled:opacity-60"
          >
            Reject
          </button>
          <button
            onClick={() => handleVerify("APPROVED")}
            disabled={actionLoading}
            className="px-12 py-2 rounded-full bg-[#448800] text-white font-medium text-lg hover:bg-[#27641a] transition disabled:opacity-60"
          >
            Approve
          </button>
        </div>
      )}

      {/* Patients treated table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 pb-2">
          <h2 className="text-xl font-semibold">Patients treated</h2>
        </div>
        <div className="overflow-x-auto p-6 pt-0">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-[#F1F4F9]">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Sr.no</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Email Id</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Mobile no.</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Gender</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Referral Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((patient, idx) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{idx + 1}.</td>
                  <td className="px-6 py-4 text-sm">{patient.name}</td>
                  <td className="px-6 py-4 text-sm break-words">{patient.email}</td>
                  <td className="px-6 py-4 text-sm">{patient.countryCode} {patient.phoneNumber}</td>
                  <td className="px-6 py-4 text-sm">{patient.gender}</td>
                  <td className="px-6 py-4 text-sm">{patient.referralCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}