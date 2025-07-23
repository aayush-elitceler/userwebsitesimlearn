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


interface Councillor {
  id: string;
  name: string;
  age: number;
  mobileNumber: string;
  email: string;
  experience: number;
  position: string;
  photoUrl?: string;
  createdAt?: string;
}

export default function Councillors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [councillors, setCouncillors] = useState<Councillor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [isAddCouncillorDialogOpen, setIsAddCouncillorDialogOpen] =
    useState(false);
  const [newCouncillor, setNewCouncillor] = useState({
    name: "",
    age: "",
    experience: "",
    mobileNumber: "+91",
    email: "",
    password: "",
    position: "",
    photo: undefined as File | undefined,
  });
  const [editCouncillorId, setEditCouncillorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCouncillors = async () => {
    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/institution/counsellors`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch councillors");
      const data = await res.json();
      setCouncillors(data.data.counsellors || []);
    } catch (err) {
      console.error(err);
      setError("Error fetching councillors");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCouncillors();
  }, []);

  const handleAddCouncillorChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value, type, files } = e.target;
    if (id === "mobileNumber") {
      // Only allow numbers, and always prefix with +91
      const digits = value.replace(/\D/g, "");
      setNewCouncillor((prev) => ({
        ...prev,
        mobileNumber: "+91" + digits,
      }));
      return;
    }
    setNewCouncillor((prev) => ({
      ...prev,
      [id]: type === "file"
        ? (files && files[0])
        : (id === "age" || id === "experience"
            ? value.replace(/^0+/, "")
            : value),
    }));
  };
  // const handleSelectChange = (field: string, value: string) => {
  //   setNewCouncillor((prev) => ({
  //     ...prev,
  //     [field]: value,
  //   }));
  // };
  const openEditDialog = (councillor: Councillor) => {
    setNewCouncillor({
      name: councillor.name || "",
      age: councillor.age?.toString() || "",
      experience: councillor.experience?.toString() || "",
      mobileNumber: councillor.mobileNumber || "",
      email: councillor.email || "",
      position: councillor.position || "",
      password: "",
      photo: undefined,
    });
    setEditCouncillorId(councillor.id);
    setIsAddCouncillorDialogOpen(true);
  };
  const handleDeleteCouncillor = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this councillor?"))
      return;
    setSubmitting(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/delete-councillor?councillorId=${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to delete councillor");
      fetchCouncillors();
    } catch (err) {
      console.error("Error deleting councillor:", err);
      setError("Error deleting councillor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOrEditCouncillorSubmit = async () => {
    setSubmitting(true);
    try {
      const token = Cookies.get("token");
      const formData = new FormData();
      formData.append("name", newCouncillor.name);
      formData.append("age", String(newCouncillor.age));
      formData.append("mobileNumber", newCouncillor.mobileNumber);
      formData.append("email", newCouncillor.email);
      formData.append("password", newCouncillor.password);
      formData.append("experience", String(newCouncillor.experience));
      formData.append("position", newCouncillor.position);
      if (newCouncillor.photo) {
        formData.append("photo", newCouncillor.photo);
      }
      let url = "";
      let method = "POST";
      if (editCouncillorId) {
        url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/edit-councillor?councillorId=${editCouncillorId}`;
        method = "PUT";
      } else {
        url = `${process.env.NEXT_PUBLIC_BASE_URL}/institution/counsellors/register`;
        method = "POST";
      }
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error(editCouncillorId ? "Failed to update councillor" : "Failed to create councillor");
      setIsAddCouncillorDialogOpen(false);
      setNewCouncillor({
        name: "",
        age: "",
        experience: "",
        mobileNumber: "+91",
        email: "",
        password: "",
        position: "",
        photo: undefined,
      });
      setEditCouncillorId(null);
      fetchCouncillors();
    } catch (err) {
      console.error(
        editCouncillorId
          ? "Error updating councillor:"
          : "Error creating councillor:",
        err
      );
      setError(
        editCouncillorId
          ? "Error updating councillor"
          : "Error creating councillor"
      );
    } finally {
      setSubmitting(false);
    }
  };
  const filteredCouncillors = councillors.filter(
    (councillor) =>
      councillor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      councillor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Pagination
  const totalPages = Math.ceil(filteredCouncillors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCouncillors = filteredCouncillors.slice(startIndex, endIndex);
  return (
    <div className="p-8 bg-gray-100">
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-medium">Councillor Details</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAddCouncillorDialogOpen(true)}
                className="px-6 py-2 cursor-pointer rounded-full text-white font-medium flex items-center gap-2"
                style={{
                  background:
                    "linear-gradient(90deg, #704180 0%, #8B2D6C 100%)",
                }}
              >
                <Plus className="h-5 w-5" />
                Add new councillor
              </button>
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search councillors..."
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
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Age
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Experience
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Mobile
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Photo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : currentCouncillors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      No councillors found.
                    </td>
                  </tr>
                ) : (
                  currentCouncillors.map((councillor) => (
                    <tr key={councillor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{councillor.name}</td>
                      <td className="px-6 py-4 text-sm">{councillor.age}</td>
                      <td className="px-6 py-4 text-sm">{councillor.experience}</td>
                      <td className="px-6 py-4 text-sm">{councillor.mobileNumber}</td>
                      <td className="px-6 py-4 text-sm">{councillor.email}</td>
                      <td className="px-6 py-4 text-sm">{councillor.position}</td>
                      <td className="px-6 py-4 text-sm">
                        {councillor.photoUrl ? (
                          <img
                            src={councillor.photoUrl}
                            alt={councillor.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openEditDialog(councillor)}
                          className="mr-2 text-blue-600 hover:text-blue-800"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCouncillor(councillor.id)}
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

          {!loading && !error && filteredCouncillors.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredCouncillors.length)} of{" "}
                {filteredCouncillors.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
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
        open={isAddCouncillorDialogOpen}
        onOpenChange={(open) => {
          setIsAddCouncillorDialogOpen(open);
          if (!open) {
            setEditCouncillorId(null);
            setNewCouncillor({
              name: "",
              age: "",
              experience: "",
              mobileNumber: "+91",
              email: "",
              position: "",
              password: "",
              photo: undefined,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px] p-6 rounded-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold mb-4">
              {editCouncillorId
                ? "Edit councillor details"
                : "Add councillor details"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 py-4">
            <div>
              <Label
                htmlFor="name"
                className="text-base font-medium mb-2 block"
              >
                Name
              </Label>
              <Input
                id="name"
                value={newCouncillor.name}
                onChange={handleAddCouncillorChange}
                placeholder="Full name"
                className="bg-[#F1F4F9] border-0"
              />
            </div>
            <div>
              <Label
                htmlFor="age"
                className="text-base font-medium mb-2 block"
              >
                Age
              </Label>
              <Input
                id="age"
                type="number"
                value={newCouncillor.age}
                onChange={handleAddCouncillorChange}
                placeholder="Age"
                className="bg-[#F1F4F9] border-0"
              />
            </div>
            <div>
              <Label
                htmlFor="experience"
                className="text-base font-medium mb-2 block"
              >
                Experience (years)
              </Label>
              <Input
                id="experience"
                type="number"
                value={newCouncillor.experience}
                onChange={handleAddCouncillorChange}
                placeholder="Years of experience"
                className="bg-[#F1F4F9] border-0"
              />
            </div>
            <div>
              <Label
                htmlFor="mobileNumber"
                className="text-base font-medium mb-2 block"
              >
                Mobile Number
              </Label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-200 rounded-l-md border border-r-0 border-gray-300 text-gray-600 select-none">+91</span>
                <Input
                  id="mobileNumber"
                  type="tel"
                  value={newCouncillor.mobileNumber.replace(/^\+91/, "")}
                  onChange={handleAddCouncillorChange}
                  placeholder="Enter mobile number"
                  className="bg-[#F1F4F9] border-0 rounded-l-none"
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="email"
                className="text-base font-medium mb-2 block"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newCouncillor.email}
                onChange={handleAddCouncillorChange}
                placeholder="Email address"
                className="bg-[#F1F4F9] border-0"
              />
            </div>
            <div>
              <Label
                htmlFor="password"
                className="text-base font-medium mb-2 block"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={newCouncillor.password}
                onChange={handleAddCouncillorChange}
                placeholder="Password"
                className="bg-[#F1F4F9] border-0"
              />
            </div>
            <div>
              <Label
                htmlFor="position"
                className="text-base font-medium mb-2 block"
              >
                Position
              </Label>
              <Input
                id="position"
                value={newCouncillor.position}
                onChange={handleAddCouncillorChange}
                placeholder="Position"
                className="bg-[#F1F4F9] border-0"
              />
            </div>
            <div>
              <Label
                htmlFor="photo"
                className="text-base font-medium mb-2 block"
              >
                Photo
              </Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleAddCouncillorChange}
                className="bg-[#F1F4F9] border-0"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddCouncillorDialogOpen(false)}
              className="px-6 py-2 rounded-full border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleAddOrEditCouncillorSubmit}
              className="px-6 py-2 rounded-full bg-[#52A300] hover:bg-[#458C00] text-white"
              disabled={submitting}
            >
              {submitting
                ? editCouncillorId
                  ? "Updating..."
                  : "Adding..."
                : editCouncillorId
                ? "Update Councillor"
                : "Add Councillor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
