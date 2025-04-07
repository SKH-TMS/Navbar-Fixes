"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

// Define a type for Member
interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}
export default function UpdateTaskPage() {
  const { projectId, taskId } = useParams();
  const [membersData, setMembersData] = useState<any[]>([]);
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [Title, setTitle] = useState("");
  const [Discription, setDiscription] = useState("");
  const [Member, setMember] = useState<string | undefined>(undefined); // State to store selected member's UserId
  const [selectedDeadlineDate, setSelectedDeadlineDate] = useState<string>(""); // Store the selected date
  const [selectedHour, setSelectedHour] = useState("12"); // For time selection
  const [selectedMinute, setSelectedMinute] = useState("10"); // For minute selection
  const [selectedAmPm, setSelectedAmPm] = useState("AM"); // For AM/PM selection
  const router = useRouter();

  // Function to convert UTC date to AM/PM format
  function convertUTCtoLocalParts(utcDate: string) {
    const date = new Date(utcDate);

    // Extracting date, hour, minute, and AM/PM
    const formattedDate = date.toLocaleDateString("en-US"); // Example format: 3/23/2025
    const hour = date.getHours();
    const minute = date.getMinutes();
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12; // Convert 24-hour to 12-hour format
    // Format hour and minute as two digits
    const hourFormatted = hour12 < 10 ? `0${hour12}` : `${hour12}`;
    const minuteFormatted = minute < 10 ? `0${minute}` : `${minute}`;
    return {
      formattedDate,
      hourFormatted,
      minuteFormatted,
      ampm,
    };
  }

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(
          `/api/projectManagerData/taskManagementData/getTaskDetails/${taskId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          }
        );
        const data = await response.json();
        if (data.success) {
          setMembersData(data.members);
          setTask(data.task);
          setTitle(data.task.title);
          setDiscription(data.task.description);
          // Assuming data.utcDate contains the UTC string
          const { formattedDate, hourFormatted, minuteFormatted, ampm } =
            convertUTCtoLocalParts(data.task.deadline);

          // Store each part in separate states
          setSelectedDeadlineDate(
            new Date(data.task.deadline).toISOString().split("T")[0]
          );
          setSelectedHour(hourFormatted);
          setSelectedMinute(minuteFormatted);
          setSelectedAmPm(ampm);
          // Set the member and other task details if necessary
        } else {
          setError(data.message || "Failed to fetch task details.");
          toast.error(data.message || "Failed to fetch task details.");
          router.push("/teamData/ProfileTeam");
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Failed to fetch task details. Please try again later.");
        toast.error("Failed to fetch task details. Please try again later.");
        router.push("/teamData/ProfileTeam");
      }
      setLoading(false);
    };

    fetchTask();
  }, [taskId]);

  const handleSubmit = async () => {
    // Combine the selected date and time
    const formattedTime = getFormattedTime();
    const combinedDeadline = new Date(
      `${selectedDeadlineDate}T${formattedTime}`
    );

    if (isNaN(combinedDeadline.getTime())) {
      toast.error("Invalid date/time selection.");
      setLoading(false);
      return;
    }

    // Submit the updated task details
    try {
      const response = await fetch(
        "/api/projectManagerData/taskManagementData/updateTask",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: taskId,
            title: Title,
            description: Discription,
            assignedTo: Member ? [Member] : [], // If member is selected
            deadline: combinedDeadline.toISOString(),
            gitHubUrl: task.gitHubUrl,
            context: task.context,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Task updated successfully!");
        router.push(
          `/projectManagerData/taskManagementData/ProjectTasks/${projectId}`
        );
      } else {
        toast.error(data.message || "Failed to update task.");
        router.push("/projectManagerData/ProfileProjectManager");
      }
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error("Failed to update task. Please try again." + err);
      router.push("/projectManagerData/ProfileProjectManager");
    }
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

  const handleChangeMember = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMember(event.target.value); // Update the state with the selected UserId
  };

  if (loading) {
    return <div className="p-4">Loading task details...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-black">
        <h1 className="text-2xl font-bold">Update Task</h1>
        <div className="mt-4 p-4 w-full max-w-md space-y-4">
          {/* Task Title */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Title</h2>
            <input
              type="text"
              value={Title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter task title"
            />
          </div>

          {/* Task Description */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Description</h2>
            <textarea
              value={Discription}
              onChange={(e) => setDiscription(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter task description"
            />
          </div>

          {/* Assign to Member Dropdown */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Assign to</h2>
            <select
              className="w-full p-2 border rounded"
              value={Member}
              onChange={handleChangeMember}
            >
              <option value="">All Members</option>
              {membersData.map((member: Member) => (
                <option key={member.UserId} value={member.UserId}>
                  {member.firstname} {member.lastname} {"---"} {member.email}
                </option>
              ))}
            </select>
          </div>

          {/* Task Deadline */}
          <div className="mb-4">
            <label className="block text-lg font-semibold">Deadline</label>
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
          {task.submittedby !== "Not-submitted" && (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">GitHub URL</h2>
                <input
                  type="text"
                  value={task.gitHubUrl || ""}
                  onChange={(e) =>
                    setTask({ ...task, gitHubUrl: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="GitHub URL"
                />
              </div>

              <div className="mb-4">
                <h2 className="text-lg font-semibold">Explanation</h2>
                <textarea
                  value={task.context || ""}
                  onChange={(e) =>
                    setTask({ ...task, context: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Task explanation"
                />
              </div>
            </>
          )}
          {task.status === "Re Assigned" && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold">feedback</h2>
              <textarea
                value={task.context || ""}
                onChange={(e) => setTask({ ...task, context: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Task explanation"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white p-3 rounded-md"
          >
            Update Task
          </button>
        </div>
      </div>
    </div>
  );
}
