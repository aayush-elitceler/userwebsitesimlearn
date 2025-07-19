"use client"
import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, Upload, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Cookies from "js-cookie";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Blog {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  blogWrittenBy: string;
  position: string;
  createdAt: string;
  updatedAt: string;
}

export default function Blogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [isAddBlogDialogOpen, setIsAddBlogDialogOpen] = useState(false);
  const [newBlog, setNewBlog] = useState({
    title: "",
    description: "",
    blogWrittenBy: "",
    position: "",
    image: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [editBlogId, setEditBlogId] = useState<string | null>(null);

  const fetchBlogs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/get-all-blogs`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch blogs");
      const data = await res.json();
      setBlogs(data.data || []);
    } catch (err) {
        console.log(err);
        
      setError("Error fetching blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter(
    (blog) =>
      (blog.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.blogWrittenBy || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.position || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBlogs = filteredBlogs.slice(startIndex, endIndex);

  const handleAddBlogChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewBlog((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewBlog((prev) => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const openEditDialog = (blog: Blog) => {
    setNewBlog({
      title: blog.title,
      description: blog.description,
      blogWrittenBy: blog.blogWrittenBy,
      position: blog.position,
      image: null, // User can upload a new image if desired
    });
    setEditBlogId(blog.id);
    setIsAddBlogDialogOpen(true);
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      const token = Cookies.get("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/delete-blog?id=${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete blog");
      fetchBlogs();
    } catch (err) {
        console.log(err);
        
      setError("Error deleting blog");
    }
  };

  const handleAddOrEditBlogSubmit = async () => {
    setSubmitting(true);
    try {
      const token = Cookies.get("token");
      const formData = new FormData();
      formData.append("title", newBlog.title);
      formData.append("description", newBlog.description);
      formData.append("blogWrittenBy", newBlog.blogWrittenBy);
      formData.append("position", newBlog.position);
      if (newBlog.image) formData.append("image", newBlog.image);
      let url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/create-blog`;
      let method: "POST" | "PUT" = "POST";
      if (editBlogId) {
        url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/update-blog?id=${editBlogId}`;
        method = "PUT";
      }
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error(editBlogId ? "Failed to update blog" : "Failed to create blog");
      setIsAddBlogDialogOpen(false);
      setNewBlog({ title: "", description: "", blogWrittenBy: "", position: "", image: null });
      setEditBlogId(null);
      fetchBlogs();
    } catch (err) {
        console.log(err);
        
      setError(editBlogId ? "Error updating blog" : "Error creating blog");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-gray-100">
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-medium">Blog details</h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsAddBlogDialogOpen(true)}
                className="px-6 py-2 cursor-pointer rounded-full text-white font-medium flex items-center gap-2"
                style={{ background: 'linear-gradient(90deg, #704180 0%, #8B2D6C 100%)' }}
              >
                <Plus className="h-5 w-5" />
                Add new blog
              </button>
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search blogs here"
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
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Image</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Written By</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Created At</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-red-500">{error}</td>
                  </tr>
                ) : currentBlogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">No blogs found.</td>
                  </tr>
                ) : (
                  currentBlogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <img src={blog.imageUrl} alt={blog.title} className="w-16 h-16 object-cover rounded" />
                      </td>
                      <td className="px-6 py-4 text-sm">{blog.title}</td>
                      <td className="px-6 py-4 text-sm">{blog.blogWrittenBy}</td>
                      <td className="px-6 py-4 text-sm">{blog.position}</td>
                      <td className="px-6 py-4 text-sm">{new Date(blog.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => openEditDialog(blog)} className="mr-2 text-blue-600 hover:text-blue-800"><Pencil className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteBlog(blog.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !error && filteredBlogs.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredBlogs.length)} of {filteredBlogs.length}
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

      <Dialog open={isAddBlogDialogOpen} onOpenChange={setIsAddBlogDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-6 rounded-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold mb-4">Add blog details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-y-6 py-4">
            <div>
              <Label htmlFor="title" className="text-base font-medium mb-2 block">Title</Label>
              <Input id="title" value={newBlog.title} onChange={handleAddBlogChange} placeholder="Blog title" className="bg-[#F1F4F9] border-0" />
            </div>
            <div>
              <Label htmlFor="description" className="text-base font-medium mb-2 block">Description</Label>
              <textarea id="description" value={newBlog.description} onChange={handleAddBlogChange} placeholder="Blog description" className="bg-[#F1F4F9] border-0 w-full rounded-xl px-4 py-2 min-h-[80px]" />
            </div>
            <div>
              <Label htmlFor="blogWrittenBy" className="text-base font-medium mb-2 block">Written By</Label>
              <Input id="blogWrittenBy" value={newBlog.blogWrittenBy} onChange={handleAddBlogChange} placeholder="Author name" className="bg-[#F1F4F9] border-0" />
            </div>
            <div>
              <Label htmlFor="position" className="text-base font-medium mb-2 block">Position</Label>
              <Input id="position" value={newBlog.position} onChange={handleAddBlogChange} placeholder="Author position" className="bg-[#F1F4F9] border-0" />
            </div>
            <div>
              <Label htmlFor="image" className="text-base font-medium mb-2 block">Image</Label>
              <div className="relative">
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="pr-10 bg-[#F1F4F9] border-0" />
                <Upload className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
              {newBlog.image && <div className="mt-2 text-xs text-gray-500">{newBlog.image.name}</div>}
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-4 mt-8">
            <Button type="button" variant="outline" onClick={() => setIsAddBlogDialogOpen(false)} className="px-6 py-2 rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</Button>
            <Button type="submit" onClick={handleAddOrEditBlogSubmit} className="px-6 py-2 rounded-full bg-[#52A300] hover:bg-[#458C00] text-white" disabled={submitting}>{submitting ? (editBlogId ? "Updating..." : "Adding...") : (editBlogId ? "Update Blog" : "Add Blog")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
