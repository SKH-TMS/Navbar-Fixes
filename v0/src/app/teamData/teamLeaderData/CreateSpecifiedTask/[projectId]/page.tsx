"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { title } from "process";
interface Task {
  TaskId: string;
  title: string;
  description: string;
  assignedTo: string[]; // Array of user IDs
  deadline: string; // ISO date string
  status: string;
  createdAt: string;
  updatedAt: string;
  gitHubUrl?: string;
  context?: string;
  submittedby?: string;
}

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

export default function CreateSpecifiedTaskPage() {
  const { projectId } = useParams();
  const [selectedDeadlineDate, setSelectedDeadlineDate] = useState<string>(""); // Store the selected date
  const [selectedHour, setSelectedHour] = useState("12"); // For time selection
  const [selectedMinute, setSelectedMinute] = useState("00"); // For minute selection
  const [selectedAmPm, setSelectedAmPm] = useState("AM"); // For AM/PM selection
  const [Title, setTitle] = useState("");
  const [projectname, setprojectname] = useState("");
  const [Discription, setDiscription] = useState("");
  const [Member, setMember] = useState<string | undefined>(undefined); // State to store selected member's UserId
  const [loading, setLoading] = useState(true);
  const [membersData, setMembersData] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          `/api/teamData/teamLeaderData/getTeamMembers/${projectId}`,
          {
            method: "GET",
          }
        );

        const data = await response.json();
        if (data.success) {
          setMembersData(data.membersData);
          setprojectname(data.project.title);
        } else {
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

  // State to store the selected task's additional details (for modal form)
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
    if (!selectedDeadlineDate || !title || !Discription) {
      toast.error("Please fill all the fields.");
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
        `/api/teamData/teamLeaderData/createSpecificTask`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            title: Title,
            description: Discription,
            assignedTo: Member ? Member : [],
            deadline: combinedDeadline.toISOString(),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Task assigned successfully!");
        router.push(`/teamData/teamLeaderData/ProjectTasks/${projectId}`);
      } else {
        setErrorMessage(data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      setErrorMessage("Failed to assign task. Please try again.");
      toast.error("Failed to assign task. Please try again.");
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

  return (
    <div>
      <div className="p-6 relative">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Create Tasks for {projectname}
        </h1>
        <div className="mt-4 p-4 border rounded-lg shadow-md text-black">
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
                <option value="">Select Member</option>
                {membersData.map((member: Member) => (
                  <option key={member.UserId} value={member.UserId}>
                    {member.firstname} {member.lastname} {"---------------"}{" "}
                    {member.email}
                  </option>
                ))}
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
      </div>
    </div>
  );
}
