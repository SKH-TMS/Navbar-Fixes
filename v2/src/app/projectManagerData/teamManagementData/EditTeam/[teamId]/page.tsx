"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

import { IUser } from "@/models/User";

interface TeamData {
  teamId: string;
  teamName: string;
  teamLeader: string[]; // from DB, we use the first element
  members: string[]; // Array of userIds
}

export default function EditTeam() {
  const router = useRouter();
  const params = useParams() as { teamId: string };
  const { teamId } = params;

  const [teamName, setTeamName] = useState("");
  // Selected team members as objects with email and userId.
  const [selectedMembers, setSelectedMembers] = useState<
    { email: string; userId: string }[]
  >([]);
  const [teamLeader, setTeamLeader] = useState<{
    email: string;
    userId: string;
  } | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all available users.
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          "/api/projectManagerData/teamManagementData/getAllUsers"
        );
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        } else {
          setError(data.message || "Failed to fetch users.");
          toast.error(data.message || "Failed to fetch users.");
          router.push("/userData/LoginUser");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to fetch users. Please try again later.");
        toast.error("Failed to fetch users. Please try again later.");
      }
    };

    fetchUsers();
  }, [router]);

  // Fetch team details (once users are available).
  useEffect(() => {
    if (!teamId || users.length === 0) return;

    const fetchTeamData = async () => {
      try {
        const response = await fetch(
          `/api/projectManagerData/teamManagementData/getTeamData/${teamId}`
        );
        const data = await response.json();
        if (data.success) {
          const team: TeamData = data.team;
          setTeamName(team.teamName);

          // Get the team leader id.
          const leaderId =
            (Array.isArray(team.teamLeader)
              ? team.teamLeader[0]
              : team.teamLeader) || "";

          // Find the leader in the users list.
          const leaderUser = users.find((u) => u.UserId === leaderId);
          if (leaderUser) {
            setTeamLeader({
              email: leaderUser.email,
              userId: leaderUser.UserId,
            });
          }

          // Build the selected members list from team.members.
          const membersList = team.members
            .map((memId) => {
              const userObj = users.find((u) => u.UserId === memId);
              return userObj
                ? { email: userObj.email, userId: userObj.UserId }
                : null;
            })
            .filter(Boolean) as { email: string; userId: string }[];

          // If the team leader is not already included, add the leader.
          if (
            leaderUser &&
            !membersList.some((member) => member.userId === leaderUser.UserId)
          ) {
            membersList.push({
              email: leaderUser.email,
              userId: leaderUser.UserId,
            });
          }

          setSelectedMembers(membersList);
        } else {
          setError(data.message || "Failed to fetch team data.");
          toast.error(data.message || "Failed to fetch team data.");
        }
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError("Failed to fetch team data. Please try again later.");
        toast.error("Failed to fetch team data. Please try again later.");
      }
      setLoading(false);
    };

    fetchTeamData();
  }, [teamId, users]);

  // Handle checkbox toggling for team members.
  const handleCheckboxChange = (email: string, userId: string) => {
    setSelectedMembers((prev) =>
      prev.some((member) => member.email === email)
        ? prev.filter((member) => member.email !== email)
        : [...prev, { email, userId }]
    );
  };

  // Handle form submission to save updated team details.
  const handleEditTeam = async () => {
    if (!teamName || selectedMembers.length === 0 || !teamLeader) {
      toast.error(
        "Please fill in all fields and select at least one member and a leader."
      );
      return;
    }

    // Exclude team leader from members list for backend submission.
    const filteredMembers = selectedMembers.filter(
      (member) => member.email !== teamLeader.email
    );

    try {
      const response = await fetch(
        `/api/projectManagerData/teamManagementData/editTeam/${teamId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamName,
            teamLeader,
            members: filteredMembers,
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
      console.error("Error updating team:", err);
      toast.error("Failed to update team. Please try again.");
    }
  };

  if (loading) {
    return <div className="p-4">Loading team data...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="formDiv w-full max-w-xl">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Edit Team
          </h1>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <div className="flex flex-col gap-4">
            {/* Team Name Input */}
            <label className="text-gray-700 font-semibold">Team Name</label>
            <input
              type="text"
              placeholder="Enter Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />

            {/* Select Team Members */}
            <h2 className="text-lg font-semibold text-gray-700 mt-4">
              Select Team Members:
            </h2>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
              {users.map((user) => (
                <label
                  key={user.email}
                  className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    onChange={() =>
                      handleCheckboxChange(user.email, user.UserId)
                    }
                    checked={selectedMembers.some(
                      (member) => member.email === user.email
                    )}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-gray-800 font-medium">
                    {user.firstname} {user.lastname} ({user.email})
                  </span>
                </label>
              ))}
            </div>

            {/* Select Team Leader */}
            <h2 className="text-lg font-semibold text-gray-700 mt-4">
              Select Team Leader:
            </h2>
            <select
              onChange={(e) => {
                const selected = users.find(
                  (user) => user.email === e.target.value
                );
                if (selected)
                  setTeamLeader({
                    email: selected.email,
                    userId: selected.UserId,
                  });
              }}
              value={teamLeader?.email || ""}
              disabled={selectedMembers.length === 0}
              className={`w-full p-3 border rounded-md focus:ring-2 ${
                selectedMembers.length === 0
                  ? "bg-gray-300 cursor-not-allowed text-red-500"
                  : "border-gray-600 focus:ring-blue-500 text-teal-600"
              }`}
            >
              <option value="">-- Select Team Leader --</option>
              {selectedMembers.map((member) => (
                <option key={member.email} value={member.email}>
                  {member.email} (User ID: {member.userId})
                </option>
              ))}
            </select>

            {/* Save Changes Button */}
            <button
              onClick={handleEditTeam}
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 mt-4"
            >
              Save Changes
            </button>

            {/* Cancel Button */}
            <button
              onClick={() =>
                router.push(
                  "/projectManagerData/teamManagementData/ManageTeams"
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
