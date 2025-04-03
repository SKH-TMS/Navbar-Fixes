"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Define interfaces for team and members data
interface Team {
  teamId: string;
  teamName: string;
  teamLeader: string[];
  members: string[]; // Array of user IDs
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
}

interface MembersData {
  teamId: string;
  members: Member[];
}

export default function ShowTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [membersData, setMembersData] = useState<MembersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teamData/teamLeaderData/getTeams", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (data.success) {
          setTeams(data.teams);
          setMembersData(data.membersData);
        } else {
          setError(data.message || "Failed to fetch teams");
          toast.error(data.message || "Failed to fetch teams");
          router.push("/teamData/ProfileTeam");
        }
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("Failed to fetch teams. Please try again later.");
        toast.error("Failed to fetch teams. Please try again later.");
        router.push("/teamData/ProfileTeam");
      }
      setLoading(false);
    };

    fetchTeams();
  }, []);

  // When a team card is clicked, navigate to the team tasks page.
  const handleTeamClick = (teamId: string) => {
    router.push(`/teamData/teamLeaderData/TeamProjects/${teamId}`);
  };
  const handleCreateTask = () => {
    router.push(`/teamData/teamLeaderData/CreateTask`);
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="p-6">
        <div className=" flex justify-items-start justify-start">
          <button
            onClick={handleCreateTask}
            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
              Create Task Directly
            </span>
          </button>
        </div>
        <h1 className="text-3xl font-bold text-center">Teams You lead</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {teams.map((team) => {
            // Get the members for this team from membersData
            const teamMembers = membersData.find(
              (data) => data.teamId === team.teamId
            )?.members;

            return (
              <div
                key={team.teamId}
                className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transform hover:-translate-y-1 transition duration-300 cursor-pointer"
                onClick={() => handleTeamClick(team.teamId)}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {team.teamName}
                </h2>
                <p className="text-sm text-gray-500 mb-1">
                  Team ID: {team.teamId}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Members: {team.members.length}
                </p>
                {teamMembers && teamMembers.length > 0 && (
                  <div className="mt-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Member Details:
                    </h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {teamMembers.map((member) => (
                        <li key={member.UserId}>
                          {member.firstname} {member.lastname} ({member.UserId})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
