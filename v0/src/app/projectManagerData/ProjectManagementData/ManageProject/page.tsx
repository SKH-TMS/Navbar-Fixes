"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
interface Project {
  ProjectId: string;
  title: string;
  description: string;
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  tasksIds?: string[];
  teamIds: string;
  teamName: string;
}

export default function ManageProjectsPage() {
  const router = useRouter();
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [unassignedProjects, setUnassignedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">(
    "all"
  );

  // Separate selection states for assigned and unassigned projects.
  const [selectedAssignedProjectIds, setSelectedAssignedProjectIds] = useState<
    string[]
  >([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedUnassignedProjectIds, setSelectedUnassignedProjectIds] =
    useState<string[]>([]);

  // Fetch projects from the API.
  const fetchProjects = async () => {
    try {
      const response = await fetch(
        "/api/projectManagerData/projectManagementData/getProjects",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAssignedProjects(data.assignedProjects);
        setUnassignedProjects(data.unassignedProjects);
      } else {
        setError(data.message || "Failed to fetch projects.");
        toast.error(data.message || "Failed to fetch projects.");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to fetch projects. Please try again later.");
      toast.error("Failed to fetch projects. Please try again later.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Toggle selection for assigned projects.
  const toggleAssignedProjectSelection = (projectId: string) => {
    setSelectedAssignedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
    setSelectedUnassignedProjectIds([]);
  };

  // Toggle selection for unassigned projects.
  const toggleUnassignedProjectSelection = (projectId: string) => {
    setSelectedUnassignedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
    setSelectedAssignedProjectIds([]);
  };
  const handleAssignedProjectClick = (projectId: string) => {
    if (isSelectMode) {
      toggleAssignedProjectSelection(projectId);
    } else {
      router.push(
        `/projectManagerData/taskManagementData/ProjectTasks/${projectId}`
      );
    }
  };
  const handleUnAssignedProjectClick = (projectId: string) => {
    if (isSelectMode) {
      toggleUnassignedProjectSelection(projectId);
    }
  };
  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedUnassignedProjectIds([]);
      setSelectedAssignedProjectIds([]);
      setIsSelectMode(false);
    } else {
      setIsSelectMode(true);
    }
  };
  // Delete the selected unassigned projects.
  const handleDeleteSelectedUnassignedProjects = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete the selected projects?"
    );
    if (confirmed) {
      try {
        const response = await fetch(
          "/api/projectManagerData/projectManagementData/deleteSelectedProjects",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectIds: selectedUnassignedProjectIds }),
          }
        );
        const data = await response.json();
        if (data.success) {
          toast.success("Selected projects deleted successfully!");
          setUnassignedProjects((prev) =>
            prev.filter(
              (proj) => !selectedUnassignedProjectIds.includes(proj.ProjectId)
            )
          );
          setSelectedUnassignedProjectIds([]);
        } else {
          toast.error(data.message || "Failed to delete projects.");
        }
      } catch (error) {
        console.error("Error deleting projects:", error);
        toast.error("Failed to delete projects. Please try again.");
      }
    }
  };

  // Unassign the selected assigned projects.
  const handleUnassignSelectedProjects = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to unassign the selected projects?  This will also result in deleteing all the tasks and  assosiated to the project "
    );
    if (confirmed) {
      try {
        const response = await fetch(
          "/api/projectManagerData/projectManagementData/unassignSelectedProjects",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectIds: selectedAssignedProjectIds }),
          }
        );
        const data = await response.json();
        if (data.success) {
          toast.success("Selected projects unassigned successfully!");
          // Remove from assigned list and add them to unassigned list.
          const projectsToUnassign = assignedProjects.filter((proj) =>
            selectedAssignedProjectIds.includes(proj.ProjectId)
          );
          setAssignedProjects((prev) =>
            prev.filter(
              (proj) => !selectedAssignedProjectIds.includes(proj.ProjectId)
            )
          );
          setUnassignedProjects((prev) => [...prev, ...projectsToUnassign]);
          setSelectedAssignedProjectIds([]);
        } else {
          toast.error(data.message || "Failed to unassign projects.");
        }
      } catch (error) {
        console.error("Error unassigning projects:", error);
        toast.error("Failed to unassign projects. Please try again.");
      }
    }
  };

  // Get background color for assigned projects.
  const getProjectBgColorsForAssigned = (projectId: string, status: string) => {
    let bgColor = selectedAssignedProjectIds.includes(projectId)
      ? "bg-pink-100"
      : "";
    if (status === "In Progress") {
      bgColor = selectedAssignedProjectIds.includes(projectId)
        ? "bg-pink-200"
        : "bg-[#b3e5fc]";
    } else if (status === "Completed") {
      bgColor = selectedAssignedProjectIds.includes(projectId)
        ? "bg-pink-200"
        : "bg-green-100";
    } else if (status === "Pending") {
      bgColor = selectedAssignedProjectIds.includes(projectId)
        ? "bg-pink-200"
        : "bg-amber-100";
    }
    return bgColor;
  };

  // Get background color for unassigned projects.
  const getProjectBgColorsForUnAssigned = (
    projectId: string,
    status: string
  ) => {
    let bgColor = selectedUnassignedProjectIds.includes(projectId)
      ? "bg-pink-100"
      : "";
    if (status === "Pending") {
      bgColor = selectedUnassignedProjectIds.includes(projectId)
        ? "bg-pink-200"
        : "bg-[#fbe9e7]";
    }
    return bgColor;
  };
  const sortedProjects = assignedProjects.sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      Pending: 1,
      "In Progress": 2,
      Completed: 3,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Navigation functions.
  const handleUpdateProject = (projectId: string) => {
    router.push(
      `/projectManagerData/ProjectManagementData/UpdateProject/${projectId}`
    );
  };

  const handleAsssignSpecificProject = (projectId: string) => {
    router.push(
      `/projectManagerData/ProjectManagementData/AssignSpecificProject/${projectId}`
    );
  };
  const handleAsssignProjects = () => {
    router.push(`/projectManagerData/ProjectManagementData/AssignProject`);
  };
  const handleCreateProject = () => {
    router.push("/projectManagerData/ProjectManagementData/CreateProject");
  };

  if (loading) {
    return <div className="p-4">Loading projects...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="p-6 relative">
        <h1 className="text-3xl font-bold mb-6 text-center ">
          Manage Projects
        </h1>
        <div className="p-4 mb-6">
          {/* Filter buttons within a styled div */}
          <div className="bg-gradient-to-br from-purple-600 to-blue-500 p-4 rounded-lg shadow-lg text-white flex justify-between items-center space-x-6">
            <div>
              <p className="text-2xl"> Filter by :</p>
            </div>
            <div className="flex justify-between items-center space-x-6">
              {/* Assigned Projects Button */}
              <button
                onClick={() => setFilter("assigned")}
                className="px-6 py-3 bg-white text-gray-900 rounded-full transition-all ease-in-out duration-200 hover:bg-purple-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                Assigned Projects
              </button>

              {/* Unassigned Projects Button */}
              <button
                onClick={() => setFilter("unassigned")}
                className="px-6 py-3 bg-white text-gray-900 rounded-full transition-all ease-in-out duration-200 hover:bg-green-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                Unassigned Projects
              </button>

              {/* All Projects Button */}
              <button
                onClick={() => setFilter("all")}
                className="px-6 py-3 bg-white text-gray-900 rounded-full transition-all ease-in-out duration-200 hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                All Projects
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
            onClick={handleCreateProject}
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
              Create New Project
            </span>
          </button>
          <button
            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800"
            onClick={handleAsssignProjects}
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
              Assign Projects to Teams
            </span>
          </button>
          <button
            onClick={handleToggleSelectMode}
            className="relative inline-flex items-center justify-center p-0.5  mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-400 to-pink-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-purple-200"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
              {isSelectMode ? "Cancel Selection" : "Select Projects"}
            </span>
          </button>
          {selectedAssignedProjectIds.length > 0 && (
            <button
              className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800"
              onClick={handleUnassignSelectedProjects}
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                UnAssign Selected Projects
              </span>
            </button>
          )}
          {selectedUnassignedProjectIds.length > 0 && (
            <button
              className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800"
              onClick={handleDeleteSelectedUnassignedProjects}
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                Delete Selected Projects
              </span>
            </button>
          )}
          {selectedUnassignedProjectIds.length == 1 && (
            <button
              className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-red-200 via-red-300 to-yellow-200 group-hover:from-red-200 group-hover:via-red-300 group-hover:to-yellow-200 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-red-100 dark:focus:ring-red-400"
              onClick={(e) => {
                handleAsssignSpecificProject(selectedUnassignedProjectIds[0]);
              }}
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                Assign Project
              </span>
            </button>
          )}
        </div>

        {filter === "assigned" || filter === "all" ? (
          assignedProjects.length === 0 ? (
            <p className="text-center">No assigned projects found.</p>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4">Assigned Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {assignedProjects.map((project) => {
                  const bgColor = getProjectBgColorsForAssigned(
                    project.ProjectId,
                    project.status
                  );
                  return (
                    <div
                      key={project.ProjectId}
                      className={`group ${bgColor} shadow-lg rounded-xl p-6 hover:shadow-2xl transform hover:scale-105 transition duration-300 cursor-pointer relative`}
                      onClick={() =>
                        handleAssignedProjectClick(project.ProjectId)
                      }
                    >
                      <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {project.description}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
                        Project ID: {project.ProjectId}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
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
                      {project.teamIds && (
                        <p className="text-xs text-gray-500">
                          Assigneed to Team: {project.teamName}
                          ---({project.teamIds})
                        </p>
                      )}
                      {project.tasksIds && (
                        <p className="text-xs text-gray-500">
                          Tasks: {project.tasksIds.length}
                        </p>
                      )}

                      <p className="my-5"></p>
                      <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-around opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateProject(project.ProjectId);
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : null}
        {filter === "unassigned" || filter === "all" ? (
          unassignedProjects.length === 0 ? (
            <p className="text-center">No unassigned projects found.</p>
          ) : (
            <div>
              <h2 className="text-2xl font-bold my-4">Unassigned Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {unassignedProjects.map((project) => {
                  const bgColor = getProjectBgColorsForUnAssigned(
                    project.ProjectId,
                    project.status
                  );
                  return (
                    <div
                      key={project.ProjectId}
                      className={`group ${bgColor} shadow-lg rounded-xl p-6 hover:shadow-2xl transform hover:scale-105 transition duration-300 cursor-pointer relative`}
                      onClick={() =>
                        handleUnAssignedProjectClick(project.ProjectId)
                      }
                    >
                      <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {project.description}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
                        Project ID: {project.ProjectId}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
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
                      <p className="my-5"></p>
                      <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-around opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateProject(project.ProjectId);
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
