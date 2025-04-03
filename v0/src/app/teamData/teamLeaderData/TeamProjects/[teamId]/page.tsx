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
  // Extra fields from the AssignedProjectLog merge:
  deadline?: string;
  tasksIds?: string[];
}

export default function TeamProjectsPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamname, setteamname] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  useEffect(() => {
    const fetchTeamProjects = async () => {
      try {
        const response = await fetch(
          `/api/teamData/teamLeaderData/getTeamProjects/${teamId}`,
          {
            method: "GET",
          }
        );
        const data = await response.json();
        if (data.success) {
          setProjects(data.projects);
          setteamname(data.teamName);
        } else {
          setError(data.message || "Failed to fetch projects.");
          toast.error(data.message || "Failed to fetch projects.");
          router.push("/teamData/ProfileTeam");
        }
      } catch (err) {
        console.error("Error fetching team projects:", err);
        setError("Failed to fetch team projects. Please try again later.");
        toast.error("Failed to fetch team projects. Please try again later.");
        router.push("/teamData/ProfileTeam");
      }
      setLoading(false);
    };

    if (teamId) {
      fetchTeamProjects();
    }
  }, [teamId]);

  const handleProjectClick = (projectId: string) => {
    // Navigate to the page that shows tasks for the selected project
    router.push(`/teamData/teamLeaderData/ProjectTasks/${projectId}`);
  };
  const getProjectBgColors = (projectId: string, status: string) => {
    // If the project is selected, use a pink shade
    if (selectedProjectIds.includes(projectId)) {
      return "bg-pink-200";
    }
    // Otherwise, assign a background color based on the status
    if (status === "In Progress") {
      return "bg-blue-100";
    } else if (status === "Completed") {
      return "bg-green-100";
    } else if (status === "Pending") {
      return "bg-amber-50";
    }
    return "bg-white";
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
          Projects for {teamname}
        </h1>
        {projects.length === 0 ? (
          <p className="text-center">No projects assigned to this team yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {sortedProjects.map((project) => (
              <div
                key={project.ProjectId}
                className={`${getProjectBgColors(
                  project.ProjectId,
                  project.status
                )} shadow-lg rounded-xl p-6 hover:shadow-2xl transform hover:-translate-y-1 transition duration-300 cursor-pointer`}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
