"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Project {
  ProjectId: string;
  title: string;
  description: string;
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Extra fields merged from AssignedProjectLogs:
  deadline?: string;
  tasksIds?: string[];
}

export default function TeamProjectsPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for selection mode and selected project IDs
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchTeamProjects = async () => {
      try {
        const response = await fetch(
          `/api/projectManagerData/teamManagementData/getTeamProjects/${teamId}`,
          {
            method: "GET",
          }
        );
        const data = await response.json();
        if (data.success) {
          setProjects(data.projects);
          setTeamName(data.teamName);
        } else {
          setError(data.message || "Failed to fetch projects.");
          toast.error(data.message || "Failed to fetch projects.");
          router.push("/projectManagerData/teamManagementData/ManageTeams");
        }
      } catch (err: any) {
        console.error("Error fetching team projects:", err);
        setError("Failed to fetch team projects. Please try again later.");
        toast.error("Failed to fetch team projects. Please try again later.");
        router.push("/projectManagerData/teamManagementData/ManageTeams");
      }
      setLoading(false);
    };

    if (teamId) {
      fetchTeamProjects();
    }
  }, [teamId, router]);

  // When not in select mode, clicking a project card navigates to its Tasks page.
  // When in select mode, clicking toggles the selection.
  const handleProjectClick = (projectId: string) => {
    if (isSelectMode) {
      toggleProjectSelection(projectId);
    } else {
      router.push(
        `/projectManagerData/taskManagementData/ProjectTasks/${projectId}`
      );
    }
  };

  // Toggle project selection in select mode.
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds((prevSelected) => {
      if (prevSelected.includes(projectId)) {
        return prevSelected.filter((id) => id !== projectId);
      } else {
        return [...prevSelected, projectId];
      }
    });
  };

  // Toggle select mode (and clear any selection when deactivating).
  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedProjectIds([]);
      setIsSelectMode(false);
    } else {
      setIsSelectMode(true);
    }
  };

  // Navigate to the project update page when exactly one project is selected.
  const handleUpdateProject = () => {
    if (selectedProjectIds.length === 1) {
      router.push(
        `/projectManagerData/ProjectManagementData/UpdateProject/${selectedProjectIds[0]}`
      );
    }
  };

  // Call API to unassign the selected projects from the team.
  const handleUnassignProject = async () => {
    if (selectedProjectIds.length > 0) {
      try {
        const response = await fetch(
          "/api/projectManagerData/teamManagementData/unassignProject",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teamId,
              projectIds: selectedProjectIds,
            }),
          }
        );
        const data = await response.json();
        if (data.success) {
          toast.success(data.message);
          // Remove unassigned projects from the UI.
          setProjects((prevProjects) =>
            prevProjects.filter(
              (project) => !selectedProjectIds.includes(project.ProjectId)
            )
          );
          setSelectedProjectIds([]);
          setIsSelectMode(false);
        } else {
          toast.error(data.message);
        }
      } catch (err) {
        console.error("Error unassigning project(s):", err);
        toast.error("Error unassigning project(s). Please try again.");
      }
    }
  };

  // New Button: "Assign Project to team"
  const handleAssignProjectToTeam = () => {
    // Route to the AssignProject page with current teamId as query parameter.
    router.push(
      `/projectManagerData/teamManagementData/AssignProjectToTeam/${teamId}`
    );
  };

  const getProjectBgColors = (projectId: string, status: string) => {
    let bgColor = selectedProjectIds.includes(projectId) ? "bg-pink-100" : "";
    if (status === "In Progress") {
      bgColor = selectedProjectIds.includes(projectId)
        ? "bg-pink-200"
        : "bg-[#b3e5fc]";
    } else if (status === "Completed") {
      bgColor = selectedProjectIds.includes(projectId)
        ? "bg-pink-200"
        : "bg-green-100";
    } else if (status === "Pending") {
      bgColor = selectedProjectIds.includes(projectId)
        ? "bg-pink-200"
        : "bg-amber-100";
    }
    return bgColor;
  };
  const sortedProjects = projects.sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      Pending: 1,
      "In Progress": 2,
      Completed: 3,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  if (loading) {
    return <div className="p-4">Loading projects...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Projects for {teamName}
        </h1>
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-4 py-6">
          <button
            onClick={handleAssignProjectToTeam}
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-green-900 rounded-lg group bg-gradient-to-br from-green-400 to-green-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-green-200"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
              Assign Project to team
            </span>
          </button>

          <button
            onClick={handleToggleSelectMode}
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-400 to-pink-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-purple-200"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
              {isSelectMode ? "Cancel Selection" : "Select Projects"}
            </span>
          </button>

          {isSelectMode && selectedProjectIds.length > 0 && (
            <button
              onClick={handleUnassignProject}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-red-900 rounded-lg group bg-gradient-to-br from-red-400 to-red-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-red-200"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
                Unassign Project
              </span>
            </button>
          )}

          {isSelectMode && selectedProjectIds.length === 1 && (
            <button
              onClick={handleUpdateProject}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-blue-900 rounded-lg group bg-gradient-to-br from-blue-400 to-blue-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-200"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
                Update Project
              </span>
            </button>
          )}
        </div>

        {projects.length === 0 ? (
          <p className="text-center">No projects assigned to this team yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {projects.map((project) => {
              const isSelected =
                isSelectMode && selectedProjectIds.includes(project.ProjectId);
              const bgColor = getProjectBgColors(
                project.ProjectId,
                project.status
              );
              return (
                <div
                  key={project.ProjectId}
                  className={`${bgColor} shadow-lg rounded-xl p-6 hover:shadow-2xl transform hover:-translate-y-2 transition duration-300 cursor-pointer`}
                  onClick={() => handleProjectClick(project.ProjectId)}
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {project.title}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2">
                    {project.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Project ID: {project.ProjectId}
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {project.status}
                  </p>
                  {project.deadline && (
                    <p className="text-xs text-gray-500">
                      Deadline:{" "}
                      {new Date(project.deadline).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                  {project.tasksIds && (
                    <p className="text-xs text-gray-500">
                      Tasks: {project.tasksIds.length}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
