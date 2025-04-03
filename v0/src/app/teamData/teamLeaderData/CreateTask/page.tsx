"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import toast from "react-hot-toast";

// Define a type for Member
interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

export default function ManageTeam() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [membersData, setMembersData] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [projectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedDeadlineDate, setSelectedDeadlineDate] = useState<string>(""); // Store the selected date
  const [selectedHour, setSelectedHour] = useState("12"); // For time selection
  const [selectedMinute, setSelectedMinute] = useState("00"); // For minute selection
  const [selectedAmPm, setSelectedAmPm] = useState("AM"); // For AM/PM selection
  const [Title, setTitle] = useState("");
  const [Discription, setDiscription] = useState("");
  const [Member, setMember] = useState<string | undefined>(undefined); // State to store selected member's UserId
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teamData/teamLeaderData/getTeams", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        console.log("Teams data:", data);

        if (data.success) {
          setTeams(data.teams);
          setMembersData(data.membersData);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setErrorMessage(data.message || "Failed to fetch teams");
          router.push("/teamData/ProfileTeam");
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        setErrorMessage("Failed to fetch teams. Please try again later.");
      }
      setLoading(false);
    };

    fetchTeams();
  }, []);

  const handleTeamChange = async (teamId: string) => {
    setSelectedTeam(teamId);
    setSelectedProjectId(null); // Reset project selection when team changes
    try {
      // Fetch projects assigned to the selected team
      const response = await fetch(`/api/teamData/teamLeaderData/getProjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: teamId }),
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      } else {
        router.push("/teamData/ProfileTeam");
        setErrorMessage(data.message || "Failed to fetch projects.");
        toast.error(data.message || "Failed to get teams");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setErrorMessage("Failed to fetch projects.");
      toast.error("Failed to Get teams");
      router.push("/teamData/ProfileTeam");
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId); // Set the selected project
  };
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

  const handleTaskAssign = async () => {
    if (!selectedTeam || !projectId || !selectedDeadlineDate) {
      toast.error("Please select a team, project, and deadline.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    // Combine the selected date and time
    const formattedTime = getFormattedTime();
    const combinedDeadline = new Date(
      `${selectedDeadlineDate}T${formattedTime}`
    );

    if (isNaN(combinedDeadline.getTime())) {
      setErrorMessage("Invalid date/time selection.");
      toast.error("Invalid date/time selection.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/teamData/teamLeaderData/assignTask/${projectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: Title,
            description: Discription,
            assignedTo: Member ? Member : [],
            teamId: selectedTeam,
            deadline: combinedDeadline.toISOString(),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Task assigned successfully!");
        router.push("/teamData/ProfileTeam");
      } else {
        setErrorMessage(data.message);
        toast.error(data.message);
        router.push("/teamData/ProfileTeam");
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      setErrorMessage("Failed to assign task. Please try again.");
      toast.error("Failed to assign task. Please try again.");
      router.push("/teamData/ProfileTeam");
    }

    setLoading(false);
  };
  const handleChangeMember = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMember(event.target.value); // Update the state with the selected UserId
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  if (errorMessage) {
    return (
      <div>
        <h2>Error: {errorMessage}</h2>
        <p>Please log in again.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>No user credentials found</h2>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen p-4  text-black">
        <h1 className="text-2xl font-bold">Create Task</h1>
        <div className="mt-4 p-4 w-full max-w-md space-y-4">
          {/* Team Selection Dropdown */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Select Team</h2>
            <select
              onChange={(e) => handleTeamChange(e.target.value)}
              value={selectedTeam || ""}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Team</option>
              {teams.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>

          {/* Project Selection Dropdown */}
          {selectedTeam && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Select Project</h2>
              <select
                onChange={(e) => handleProjectChange(e.target.value)}
                value={projectId || ""}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.ProjectId} value={project.ProjectId}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Task Assignment Form (only visible when both team and project are selected) */}
          {selectedTeam && projectId && (
            <div className="mt-4 p-4 border rounded-lg shadow-md">
              <h2 className="text-xl font-semibold">Assign Task</h2>
              <form>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Task Title"
                    value={Title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="mb-4">
                  <textarea
                    placeholder="Task Discription"
                    value={Discription}
                    onChange={(e) => setDiscription(e.target.value)}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                {/* Assign to Member Dropdown */}
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Assign to</h2>
                  <select
                    className="w-full p-2 border rounded"
                    value={Member} // Bind the value to the state
                    onChange={handleChangeMember} // Handle change event
                  >
                    <option value="">All Members</option>
                    {membersData
                      .filter((data) => data.teamId === selectedTeam)
                      .flatMap((data) =>
                        data.members.map((member: Member) => (
                          <option key={member.UserId} value={member.UserId}>
                            {member.firstname} {member.lastname} {"---"}{" "}
                            {member.email}
                          </option>
                        ))
                      )}
                  </select>
                </div>
                {/* Date and Time Selection for Deadline */}
                <div className="mb-4">
                  <label className="block text-lg font-semibold">
                    Select Deadline
                  </label>
                  <input
                    type="date"
                    value={selectedDeadlineDate}
                    onChange={(e) => setSelectedDeadlineDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>

                {/* Time Dropdowns for Hour, Minute, AM/PM */}
                <div className="flex space-x-2 text-teal-800">
                  {/* Hours Dropdown */}
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className="w-1/3 p-3 border rounded-md"
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
                    className="w-1/3 p-3 border rounded-md"
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
                    className="w-1/3 p-3 border rounded-md"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleTaskAssign}
                  className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md mt-4"
                  disabled={loading}
                >
                  {loading ? "Assigning..." : "Assigned the  Task"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
