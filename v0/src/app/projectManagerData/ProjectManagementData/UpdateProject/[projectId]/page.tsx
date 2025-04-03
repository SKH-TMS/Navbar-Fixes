"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function UpdateProject() {
  const router = useRouter();
  const { projectId } = useParams(); // Extract the projectId from the URL
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch the existing project details for editing
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(
          `/api/projectManagerData/projectManagementData/getProjectForUpdation/${projectId}`
        );
        const data = await response.json();

        if (data.success) {
          const project = data.project;
          setTitle(project.title);
          setDescription(project.description);
        } else {
          toast.error(data.message || "Failed to fetch project details");
          router.push("/projectManagerData/ProfileProjectManager");
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
        toast.error("Failed to fetch project details.");
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!title || !description) {
      setError("Please fill in all fields.");
      toast.error("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/projectManagerData/projectManagementData/updateProject/${projectId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Project updated successfully!");
        router.push(`/projectManagerData/ProfileProjectManager`);
      } else {
        setError(data.message || "Failed to update project.");
        toast.error(data.message || "Failed to update project.");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      setError("Failed to update project. Please try again.");
      toast.error("Failed to update project. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="formDiv">
          <h1 className="text-2xl font-bold text-center mb-6">
            Update Project
          </h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Project Title */}
            <input
              type="text"
              placeholder="Project Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
            />

            {/* Project Description */}
            <textarea
              placeholder="Project Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
              rows={4}
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Project"}
            </button>
          </form>

          {/* Cancel Button */}
          <button
            onClick={() =>
              router.push("/projectManagerData/ProfileProjectManager")
            }
            className="mt-4 w-full p-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md transition duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
