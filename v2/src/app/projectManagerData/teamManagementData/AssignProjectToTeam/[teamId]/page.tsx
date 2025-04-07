"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Define types for team and project
interface ITeam {
  teamId: string;
  teamName: string;
}

interface IProject {
  ProjectId: string;
  title: string;
  description: string;
}

export default function AssignProjectToTeam() {
  const { teamId } = useParams();
  const router = useRouter();

  // TEAM DATA
  const [team, setTeam] = useState<ITeam | null>(null);

  // Toggle between assignment modes: "existing" or "new"
  const [assignmentMode, setAssignmentMode] = useState<"existing" | "new">(
    "existing"
  );

  // For "existing" mode: list of unassigned projects and selected project
  const [unassignedProjects, setUnassignedProjects] = useState<IProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);

  // For "new" mode: project creation fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Common deadline fields (for both modes)
  const [deadlineDate, setDeadlineDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAmPm, setSelectedAmPm] = useState("AM");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper: Convert selected time into 24-hour format
  const getFormattedTime = () => {
    let hour = parseInt(selectedHour);
    const minute = selectedMinute;
    if (selectedAmPm === "PM" && hour !== 12) {
      hour += 12;
    }
    if (selectedAmPm === "AM" && hour === 12) {
      hour = 0;
    }
    return `${hour.toString().padStart(2, "0")}:${minute}:00`;
  };

  // Fetch team details using the teamId from route
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch(
          `/api/projectManagerData/teamManagementData/getTeamData/${teamId}`
        );
        const data = await response.json();
        if (data.success) {
          setTeam(data.team);
        } else {
          toast.error(data.message || "Failed to fetch team details");
        }
      } catch (err) {
        console.error("Error fetching team details:", err);
        toast.error("Error fetching team details");
      }
    };
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  // Fetch unassigned projects when in "existing" mode
  useEffect(() => {
    if (assignmentMode === "existing") {
      const fetchUnassignedProjects = async () => {
        try {
          const response = await fetch(
            "/api/projectManagerData/projectManagementData/getUnassignedProjects"
          );
          const data = await response.json();
          if (data.success) {
            setUnassignedProjects(data.projects);
          } else {
            setError(data.message || "Failed to fetch projects.");
            toast.error(data.message || "Failed to fetch projects.");
          }
        } catch (err) {
          console.error("Error fetching unassigned projects:", err);
          toast.error("Error fetching projects.");
        }
      };
      fetchUnassignedProjects();
    }
  }, [assignmentMode]);

  // Handler: Submit assignment for an existing project
  const handleAssignExistingProject = async () => {
    if (!team || !selectedProject || !deadlineDate) {
      toast.error("Please select a project and deadline.");
      return;
    }
    setLoading(true);
    const formattedTime = getFormattedTime();
    const combinedDeadline = new Date(`${deadlineDate}T${formattedTime}`);
    if (isNaN(combinedDeadline.getTime())) {
      toast.error("Invalid date/time selection.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `/api/projectManagerData/projectManagementData/assignProject/${selectedProject.ProjectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: team.teamId,
            deadline: combinedDeadline.toISOString(),
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Project assigned successfully!");
        router.push("/projectManagerData/ProfileProjectManager");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error("Error assigning project:", err);
      toast.error("Failed to assign project.");
    }
    setLoading(false);
  };

  // Handler: Submit new project creation and assign it to team
  const handleCreateAndAssignProject = async () => {
    if (!team || !title || !description) {
      toast.error("Please fill in all project details.");
      return;
    }
    if (!deadlineDate) {
      toast.error("Please select a deadline.");
      return;
    }
    setLoading(true);
    const formattedTime = getFormattedTime();
    const combinedDeadline = new Date(`${deadlineDate}T${formattedTime}`);
    if (isNaN(combinedDeadline.getTime())) {
      toast.error("Invalid date/time selection.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        "/api/projectManagerData/projectManagementData/createProject",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            deadline: combinedDeadline.toISOString(),
            assignedTeam: team, // Send team details to assign the project
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        router.push("/projectManagerData/teamManagementData/ManageTeams");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error("Error creating project:", err);
      toast.error("Failed to create project.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="min-h-screen  py-8">
        <div className="max-w-3xl mx-auto bg-[#ECFBF4] shadow-2xl rounded-lg p-8">
          {/* Toggle between "Existing" and "New" assignment modes */}
          <div className="flex justify-center gap-6 mb-8">
            <button
              onClick={() => setAssignmentMode("existing")}
              className={`px-6 py-2 rounded-md font-medium transition duration-200 hover:bg-blue-600 hover:text-white ${
                assignmentMode === "existing"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              Assign Existing Project
            </button>
            <button
              onClick={() => setAssignmentMode("new")}
              className={`px-6 py-2 rounded-md font-medium transition duration-200 hover:bg-green-600 hover:text-white ${
                assignmentMode === "new"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              Create New Project
            </button>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Assign Project to Team
          </h1>
          {team && (
            <p className="text-center text-lg text-gray-600 mb-6">
              Team: <span className="font-semibold">{team.teamName}</span>
            </p>
          )}

          {/* Existing Project Mode */}
          {assignmentMode === "existing" && (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Select Unassigned Project:
                </label>
                <select
                  value={selectedProject?.ProjectId || ""}
                  onChange={(e) => {
                    const proj = unassignedProjects.find(
                      (p) => p.ProjectId === e.target.value
                    );
                    setSelectedProject(proj || null);
                  }}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a Project --</option>
                  {unassignedProjects.map((proj) => (
                    <option key={proj.ProjectId} value={proj.ProjectId}>
                      {proj.title}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProject && (
                <>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Select Deadline for Project:
                    </label>
                    <input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-2 text-gray-700">
                    <select
                      value={selectedHour}
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h.toString().padStart(2, "0")}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedMinute}
                      onChange={(e) => setSelectedMinute(e.target.value)}
                      className="p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {["00", "15", "30", "45"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedAmPm}
                      onChange={(e) => setSelectedAmPm(e.target.value)}
                      className="p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAssignExistingProject}
                    className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 mt-4"
                    disabled={loading}
                  >
                    {loading ? "Assigning..." : "Assign Project"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* New Project Mode */}
          {assignmentMode === "new" && (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Project Title:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter project title"
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Project Description:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter project description"
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Select Deadline for Project:
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex space-x-2 text-gray-700">
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="p-3 border rounded-md focus:ring-2 focus:ring-green-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h.toString().padStart(2, "0")}>
                      {h}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="p-3 border rounded-md focus:ring-2 focus:ring-green-500"
                >
                  {["00", "15", "30", "45"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedAmPm}
                  onChange={(e) => setSelectedAmPm(e.target.value)}
                  className="p-3 border rounded-md focus:ring-2 focus:ring-green-500"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <button
                onClick={handleCreateAndAssignProject}
                className="w-full p-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition duration-200 mt-4"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create & Assign Project"}
              </button>
            </div>
          )}

          <button
            onClick={() =>
              router.push("/projectManagerData/teamManagementData/ManageTeams")
            }
            className="mt-6 w-full p-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md transition duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
