"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Cookies from "js-cookie";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";


interface Student {
  id: string;
  name: string;
  class: string;
  dob: string;
  referralCode: string;
  createdAt: string;
}

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    class: "",
    dob: "",
  });
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/institution/counsellors/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data.data.students || []);
    } catch (err) {
      console.error(err);
      setError("Error fetching students");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value } = e.target;
    setNewStudent((prev) => ({
      ...prev,
      [id]: value,
    }));
  };
  const openEditDialog = (student: Student) => {
    setNewStudent({
      name: student.name || "",
      class: student.class || "",
      dob: formatDobForInput(student.dob) || "",
    });
    setEditStudentId(student.id);
    setIsAddStudentDialogOpen(true);
  };
  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    setSubmitting(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/delete-student?studentId=${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to delete student");
      fetchStudents();
    } catch (err) {
      console.error("Error deleting student:", err);
      setError("Error deleting student");
    } finally {
      setSubmitting(false);
    }
  };

  function formatDobForInput(dob: string) {
    // API returns ISO string, convert to yyyy-mm-dd for input
    if (!dob) return "";
    const d = new Date(dob);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  function formatDobForApi(dob: string) {
    // Convert yyyy-mm-dd to dd-mm-yyyy
    if (!dob) return "";
    const [yyyy, mm, dd] = dob.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }
  function formatDobForDisplay(dob: string) {
    // API returns ISO string, display as dd-mm-yyyy
    if (!dob) return "";
    const d = new Date(dob);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy}`;
  }

  const handleAddOrEditStudentSubmit = async () => {
    setSubmitting(true);
    try {
      const token = Cookies.get("token");
      const body = {
        name: newStudent.name,
        class: newStudent.class,
        dob: formatDobForApi(newStudent.dob),
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/institution/counsellors/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error("Failed to create student");
      setIsAddStudentDialogOpen(false);
      setNewStudent({
        name: "",
        class: "",
        dob: "",
      });
      setEditStudentId(null);
      fetchStudents();
    } catch (err) {
      console.error("Error creating student:", err);
      setError("Error creating student");
    } finally {
      setSubmitting(false);
    }
  };
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);
  return (
    <div className="p-8 bg-gray-100">
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-medium">Student Details</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAddStudentDialogOpen(true)}
                className="px-6 py-2 cursor-pointer rounded-full text-white font-medium flex items-center gap-2"
                style={{
                  background:
                    "linear-gradient(90deg, #704180 0%, #8B2D6C 100%)",
                }}
              >
                <Plus className="h-5 w-5" />
                Add new student
              </button>
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search students..."
                  className="pl-11 h-11 rounded-full bg-[#F1F4F9] border-0 ring-1 ring-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F1F4F9]">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Referral Code</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Student Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">DOB</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Class</th>
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
                ) : currentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">No students found.</td>
                  </tr>
                ) : (
                  currentStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{student.referralCode}</td>
                      <td className="px-6 py-4 text-sm">{student.name}</td>
                      <td className="px-6 py-4 text-sm">{formatDobForDisplay(student.dob)}</td>
                      <td className="px-6 py-4 text-sm">{student.class}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openEditDialog(student)}
                          className="mr-2 text-blue-600 hover:text-blue-800"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {!loading && !error && filteredStudents.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
      <Dialog
        open={isAddStudentDialogOpen}
        onOpenChange={(open) => {
          setIsAddStudentDialogOpen(open);
          if (!open) {
            setEditStudentId(null);
            setNewStudent({
              name: "",
              class: "",
              dob: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] p-6 rounded-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold mb-4">
              {editStudentId ? "Edit student details" : "Add student details"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 py-4">
            {/* Student Name */}
            <div className="col-span-2">
              <Label htmlFor="name" className="text-base font-medium mb-2 block">
                Student Name
              </Label>
              <Input
                id="name"
                value={newStudent.name}
                onChange={handleAddStudentChange}
                placeholder="Full name"
                className="bg-[#F1F4F9] border-0"
              />
            </div>
            {/* DOB */}
            <div>
              <Label htmlFor="dob" className="text-base font-medium mb-2 block">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={newStudent.dob}
                onChange={handleAddStudentChange}
                className="bg-[#F1F4F9] border-0"
              />
            </div>
            {/* Class */}
            <div>
              <Label htmlFor="class" className="text-base font-medium mb-2 block">
                Class
              </Label>
              <Input
                id="class"
                value={newStudent.class}
                onChange={handleAddStudentChange}
                placeholder="Class"
                className="bg-[#F1F4F9] border-0"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddStudentDialogOpen(false)}
              className="px-6 py-2 rounded-full border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleAddOrEditStudentSubmit}
              className="px-6 py-2 rounded-full bg-[#52A300] hover:bg-[#458C00] text-white"
              disabled={submitting}
            >
              {submitting
                ? editStudentId
                  ? "Updating..."
                  : "Adding..."
                : editStudentId
                ? "Update Student"
                : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
