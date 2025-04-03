"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Define interfaces for team, member, as well as members data and team leaders data
interface Team {
  teamId: string;
  teamName: string;
  teamLeader: string[]; // array of team leader userIds
  members: string[]; // array of member userIds
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

interface MembersData {
  teamId: string;
  members: Member[];
}

interface TeamLeadersData {
  teamId: string;
  teamLeaders: Member[];
}

export default function ShowTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [membersData, setMembersData] = useState<MembersData[]>([]);
  const [teamLeadersData, setTeamLeadersData] = useState<TeamLeadersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          "/api/projectManagerData/teamManagementData/getTeamsData",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await response.json();
        if (data.success) {
          setTeams(data.teams);
          setMembersData(data.membersData);
          setTeamLeadersData(data.teamLeadersData);
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
  }, [router]);

  // When a team card is clicked (and not in select mode), navigate to its projects page.
  const handleTeamClick = (teamId: string) => {
    router.push(
      `/projectManagerData/teamManagementData/TeamProjects/${teamId}`
    );
  };

  // Toggle team selection if in select mode.
  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeamIds((prevSelected) => {
      if (prevSelected.includes(teamId)) {
        return prevSelected.filter((id) => id !== teamId);
      } else {
        return [...prevSelected, teamId];
      }
    });
  };

  // Toggle select mode (and clear selection when disabling select mode)
  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedTeamIds([]);
      setIsSelectMode(false);
    } else {
      setIsSelectMode(true);
    }
  };

  // Handle deletion of selected teams.
  const handleDeleteSelectedTeams = async () => {
    try {
      const response = await fetch(
        "/api/projectManagerData/teamManagementData/deleteTeams",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamIds: selectedTeamIds }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Selected teams deleted successfully");
        setTeams((prevTeams) =>
          prevTeams.filter((team) => !selectedTeamIds.includes(team.teamId))
        );
        setSelectedTeamIds([]);
        setIsSelectMode(false);
      } else {
        toast.error(data.message || "Failed to delete teams");
      }
    } catch (err) {
      console.error("Error deleting teams:", err);
      toast.error("Failed to delete teams. Please try again later.");
    }
  };

  // Handler to route to the Edit Team page (only available when exactly one team is selected)
  const handleEditTeam = () => {
    if (selectedTeamIds.length === 1) {
      router.push(
        `/projectManagerData/teamManagementData/EditTeam/${selectedTeamIds[0]}`
      );
    }
  };

  const handleCreateTeam = () => {
    router.push(`/projectManagerData/teamManagementData/CreateTeam`);
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
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button
            onClick={handleCreateTeam}
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-green-200"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
              Create Team
            </span>
          </button>

          <button
            onClick={handleToggleSelectMode}
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-400 to-pink-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-purple-200"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
              {isSelectMode ? "Cancel Selection" : "Select Teams"}
            </span>
          </button>

          {isSelectMode && selectedTeamIds.length > 0 && (
            <button
              onClick={handleDeleteSelectedTeams}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-red-900 rounded-lg group bg-gradient-to-br from-red-400 to-red-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-red-200"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
                Delete Selected Teams
              </span>
            </button>
          )}

          {isSelectMode && selectedTeamIds.length === 1 && (
            <button
              onClick={handleEditTeam}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-blue-900 rounded-lg group bg-gradient-to-br from-blue-400 to-blue-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-200"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
                Edit Team
              </span>
            </button>
          )}
        </div>

        <h1 className="text-3xl font-bold text-center">
          Teams You Have Created
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
          {teams.map((team) => {
            // Find member details for this team
            const teamMembers = membersData.find(
              (data) => data.teamId === team.teamId
            )?.members;
            // Find team leader details for this team
            const teamLeaderInfo = teamLeadersData.find(
              (data) => data.teamId === team.teamId
            )?.teamLeaders;
            // Apply a pink background if the team is selected in select mode.
            const cardBgClass =
              isSelectMode && selectedTeamIds.includes(team.teamId)
                ? "bg-pink-300"
                : "bg-white";

            return (
              <div
                key={team.teamId}
                className={`${cardBgClass} shadow-lg rounded-xl p-6 hover:shadow-2xl transform hover:-translate-y-2 transition duration-300 cursor-pointer`}
                onClick={() =>
                  isSelectMode
                    ? toggleTeamSelection(team.teamId)
                    : handleTeamClick(team.teamId)
                }
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {team.teamName}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  Members: {team.members.length}
                </p>

                {teamLeaderInfo && teamLeaderInfo.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">
                      Team Leader:
                    </h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {teamLeaderInfo.map((leader) => (
                        <li key={leader.UserId}>
                          {leader.firstname} {leader.lastname} ----(
                          {leader.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {teamMembers && teamMembers.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">
                      Member Details:
                    </h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {teamMembers.map((member) => (
                        <li key={member.UserId}>
                          {member.firstname} {member.lastname} ---- (
                          {member.email})
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
