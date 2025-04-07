"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ITeam } from "@/models/Team"; // Import ITeam interface
import { IProject } from "@/models/Project"; // Import IProject interface
import { IAssignedProjectLog } from "@/models/AssignedProjectLogs"; // Import IAssignedProjectLog interface
import toast from "react-hot-toast";

export default function AssignSpecificProject() {
  const router = useRouter();
  const { projectId } = useParams(); // Get the projectId from the URL parameter
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [project, setProject] = useState<IProject | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<ITeam | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<string>(""); // Store the selected deadline
  const [selectedHour, setSelectedHour] = useState("12"); // For time selection
  const [selectedMinute, setSelectedMinute] = useState("00"); // For minute selection
  const [selectedAmPm, setSelectedAmPm] = useState("AM"); // For AM/PM selection
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch the available teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/projectManagerData/getTeams");
        const data = await response.json();
        if (data.success) {
          setTeams(data.teams);
        } else {
          setError(data.message || "Failed to fetch teams.");
          toast.error(data.message || "Failed to fetch teams.");
          router.push("/userData/LoginUser");
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        setError("Failed to fetch teams. Please try again.");
      }
    };
    fetchTeams();
  }, []);

  // Fetch the project details for the specific projectId
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(
          `/api/projectManagerData/projectManagementData/getProjectForUpdation/${projectId}`
        );
        const data = await response.json();
        if (data.success) {
          setProject(data.project);
        } else {
          setError(data.message || "Failed to fetch project details.");
          toast.error(data.message || "Failed to fetch project details.");
          router.push("/userData/LoginUser");
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
        setError("Failed to fetch project details. Please try again.");
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Convert selected time into 24-hour format
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

  // Handle project assignment
  const handleAssignProject = async () => {
    if (!selectedTeam || !project || !selectedDeadline) {
      toast.error("Please select a project, team, and deadline.");
      return;
    }

    setLoading(true);
    setError("");

    // Combine the deadline date and time to create a full datetime string
    const formattedTime = getFormattedTime(); // Function to format AM/PM time
    const combinedDeadline = new Date(`${selectedDeadline}T${formattedTime}`);

    if (isNaN(combinedDeadline.getTime())) {
      setError("Invalid date/time selection.");
      toast.error("Invalid date/time selection.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/projectManagerData/projectManagementData/assignProject/${project.ProjectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: selectedTeam.teamId,
            deadline: combinedDeadline.toISOString(), // Send the combined deadline with date and time
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Project assigned successfully!");
        router.push("/projectManagerData/ProjectManagementData/ManageProject");
      } else {
        setError(data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error assigning project:", error);
      setError("Failed to assign project. Please try again.");
      toast.error("Failed to assign project. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen p-6 ">
        <div className="formDiv">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Assign Project to a Team
          </h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <div className="flex flex-col gap-4">
            {/* Project Details */}
            {project && (
              <>
                <h2 className="text-xl font-semibold text-gray-800">
                  Project: {project.title}
                </h2>
                <p className="text-gray-600">{project.description}</p>
              </>
            )}

            {/* Select Team */}
            <label className="text-gray-700 font-semibold">
              Select a Team:
            </label>
            <select
              value={selectedTeam?.teamId || ""}
              onChange={(e) => {
                const team = teams.find((t) => t.teamId === e.target.value);
                setSelectedTeam(team || null);
              }}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 text-blue-600"
            >
              <option value="">-- Select a Team --</option>
              {teams.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamName}
                </option>
              ))}
            </select>

            {/* Display Deadline Input only if a team is selected */}
            {selectedTeam && (
              <>
                <label className="text-gray-700 font-semibold">
                  Select Deadline for Project:
                </label>
                <input
                  type="date"
                  value={selectedDeadline}
                  onChange={(e) => setSelectedDeadline(e.target.value)}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />

                {/* Deadline Time Selection */}
                <div className="flex space-x-2 text-teal-800">
                  {/* Hours Dropdown */}
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className="w-1/3 p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h.toString().padStart(2, "0")}>
                        {h}
                      </option>
                    ))}
                  </select>

                  {/* Minutes Dropdown */}
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className="w-1/3 p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {["00", "15", "30", "45"].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  {/* AM/PM Dropdown */}
                  <select
                    value={selectedAmPm}
                    onChange={(e) => setSelectedAmPm(e.target.value)}
                    className="w-1/3 p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </>
            )}

            {/* Assign Project Button */}
            <button
              onClick={handleAssignProject}
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 mt-4"
              disabled={loading}
            >
              {loading ? "Assigning..." : "Assign Project"}
            </button>

            {/* Cancel Button */}
            <button
              onClick={() =>
                router.push(
                  "/projectManagerData/ProjectManagementData/ManageProject"
                )
              }
              className="w-full p-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md transition duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
