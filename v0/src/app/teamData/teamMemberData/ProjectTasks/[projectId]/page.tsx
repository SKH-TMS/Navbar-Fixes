"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
  submittedby?: string; // Now this will be a user ID (if submitted)
}

interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

interface CurrentUser {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
}

export default function ProjectTasksPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const [Projectname, setProjectname] = useState<string>("");
  const [taskColour, settaskColour] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reassignedtask, setreassignedtask] = useState<Task | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [submitters, setSubmitters] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // State to store the selected task's additional details (for modal display)
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(
    null
  );
  // Modal state and inputs
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [gitHubUrl, setGitHubUrl] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("GitHub URL copied to clipboard!");
    });
  };

  const fetchProjectTasks = async () => {
    try {
      const response = await fetch(
        `/api/teamData/teamMemberData/getProjectTasks/${projectId}`,
        {
          method: "GET",
        }
      );
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
        setMembers(data.members);
        setSubmitters(data.submitters); // New: Set submitter details
        setCurrentUser(data.currentUser);
        setProjectname(data.title);
      } else {
        setError(data.message || "Failed to fetch tasks.");
        toast.error(data.message || "Failed to fetch tasks.");
        router.push("/teamData/ProfileTeam");
      }
    } catch (err) {
      console.error("Error fetching project tasks:", err);
      setError("Failed to fetch project tasks. Please try again later.");
      toast.error("Failed to fetch project tasks. Please try again later.");
      router.push("/teamData/ProfileTeam");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectTasks();
    }
  }, [projectId]);

  const handleCardClick = (task: Task) => {
    if (task.status === "Completed") return;
    if (task.status === "In Progress") {
      const confirmProceed = window.confirm(
        "This Task has already been performed. This action will result in overriding the current implementation. Do you want to proceed?"
      );
      if (!confirmProceed) return;
    }
    setSelectedTask(task);
    setGitHubUrl("");
    setExplanation("");
  };

  const handleSubmitTask = async () => {
    if (!selectedTask) return;
    if (selectedTask.status === "In Progress") {
      const confirmSubmit = window.confirm(
        "This Task has already been performed. Updating it will override the current implementation. Are you sure you want to update it?"
      );
      if (!confirmSubmit) return;
    }
    try {
      const response = await fetch("/api/teamData/teamMemberData/submitTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TaskId: selectedTask.TaskId,
          gitHubUrl,
          context: explanation,
          submittedby: currentUser?.UserId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Task updated successfully!");
        setSelectedTask(null);
        fetchProjectTasks();
      } else {
        toast.error(data.message || "Failed to update task.");
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error("Failed to update task. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setreassignedtask(null);
    setSelectedTaskDetails(null);
    setSelectedTask(null);
  };

  const sortedTasks = tasks.sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      "Re Assigned": 1,
      Pending: 2,
      "In Progress": 3,
      Completed: 4,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const handleViewExplanationClick = (task: Task, colour: string) => {
    settaskColour(colour);
    setSelectedTaskDetails(task);
  };

  const handleViewReassigned = (task: Task, colour: string) => {
    settaskColour(colour);
    setreassignedtask(task);
  };

  // Helper to get submitter details from the "submitters" array.
  const getSubmitterDetails = (submittedby?: string) => {
    if (!submittedby) return "Not submitted";
    const submitter = submitters.find((s) => s.UserId === submittedby);
    return submitter
      ? `${submitter.firstname} ${submitter.lastname} (${submitter.email})`
      : submittedby;
  };

  if (loading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Tasks for {Projectname}
        </h1>
        {tasks.length === 0 ? (
          <p className="text-center">No tasks assigned for this project yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {sortedTasks.map((task) => {
              const isAssignedToYou =
                currentUser && task.assignedTo.includes(currentUser.UserId);
              let cardBg = "bg-white";
              if (task.status === "In Progress") cardBg = "bg-blue-200";
              if (task.status === "Re Assigned") cardBg = "bg-yellow-100";
              if (task.status === "Completed") cardBg = "bg-green-100";

              return (
                <div
                  key={task.TaskId}
                  className={`${cardBg} shadow-lg rounded-xl p-6 transition duration-300 ${
                    isAssignedToYou && task.status !== "Completed"
                      ? "hover:shadow-2xl transform hover:-translate-y-1 cursor-pointer"
                      : "cursor-default"
                  }`}
                  onClick={() => isAssignedToYou && handleCardClick(task)}
                >
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">
                    {task.title}
                  </h4>
                  <p className="text-black text-sm mb-3">Details</p>
                  <p className="text-gray-600 text-sm mb-3">
                    {task.description}
                  </p>
                  <p className="text-xs font-bold text-green-900 mb-1">
                    Deadline:
                  </p>
                  <p className="text-xs text-stone-950 mb-1 px-12">
                    {new Date(task.deadline).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-xs font-bold text-black mb-3">Status:</p>
                  <p className="text-xs font-semibold text-orange-400 mb-3 px-8">
                    {task.status}
                  </p>
                  <div className="mb-3">
                    <p className="font-semibold text-sm mb-1 text-gray-700">
                      Assigned To:
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-700">
                      {task.assignedTo.map((userId) => {
                        const member = members.find((m) => m.UserId === userId);
                        return (
                          <ol key={userId}>
                            {member
                              ? `${member.firstname} ${member.lastname} (${member.email})`
                              : userId}
                          </ol>
                        );
                      })}
                    </ul>
                  </div>
                  {(task.status === "Pending" ||
                    task.status === "In Progress" ||
                    task.status === "Completed" ||
                    task.status === "Re Assigned") && (
                    <div className="mt-2">
                      {isAssignedToYou ? (
                        <div>
                          {task.status === "Pending" && (
                            <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-200 rounded-full">
                              Assigned to you
                            </span>
                          )}
                          {task.status === "In Progress" && (
                            <>
                              <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-200 rounded-full">
                                Was Assigned to you
                              </span>
                              <p className="my-2"></p>
                              <p
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewExplanationClick(
                                    task,
                                    "bg-blue-50"
                                  );
                                }}
                                className="text-blue-500 text-sm text-center underline hover:text-blue-700 cursor-pointer"
                              >
                                View Implementation
                              </p>
                            </>
                          )}
                          {task.status === "Completed" && (
                            <p
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewExplanationClick(task, "bg-green-50");
                              }}
                              className="text-blue-500 text-sm text-center underline hover:text-blue-700 cursor-pointer"
                            >
                              View Implementation
                            </p>
                          )}
                          {task.status === "Re Assigned" && (
                            <p
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewReassigned(task, "bg-blue-50");
                              }}
                              className="text-green-400 text-sm text-center underline hover:text-green-500 cursor-pointer"
                            >
                              View Feedback
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          {(task.status === "In Progress" ||
                            task.status === "Completed") && (
                            <p
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewExplanationClick(task, "bg-blue-50");
                              }}
                              className="text-blue-500 text-sm text-center underline hover:text-blue-700 cursor-pointer"
                            >
                              View Implementation
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form for submitting task update */}
      {selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Submit Task Update for {selectedTask.title}
            </h2>
            {selectedTask.status === "In Progress" && (
              <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded">
                This task has already been performed. You are trying to update
                it. This action will override the current implementation.
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub URL
              </label>
              <input
                type="text"
                value={gitHubUrl}
                onChange={(e) => setGitHubUrl(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter GitHub repository URL"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Provide your explanation..."
              ></textarea>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Upload Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form for viewing Feedback */}
      {reassignedtask && (
        <div className="fixed inset-0 flex items-center justify-center text-black z-50">
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={handleCloseModal}
          ></div>
          <div className="bg-yellow-50 rounded-lg shadow-lg p-6 z-10 max-w-lg w-full mx-4">
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-1">Feedback:</h3>
              <textarea
                value={reassignedtask.context || "No Feedback"}
                readOnly
                rows={5}
                className="w-full p-4 border rounded-md bg-yellow-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Form for viewing task details */}
      {selectedTaskDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center text-black">
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={handleCloseModal}
          ></div>
          <div
            className={`${taskColour} rounded-lg shadow-lg p-6 z-10 max-w-lg w-full mx-4`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Task Explanation</h2>
              <button
                onClick={handleCloseModal}
                className="text-white bg-red-900 text-2xl leading-none hover:bg-red-500"
              >
                &times;
              </button>
            </div>

            {/* Display Submitted By using the new submitters data */}
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-1">Submitted By:</h3>
              <p>
                {selectedTaskDetails.submittedby
                  ? (() => {
                      const submitter = submitters.find(
                        (s) => s.UserId === selectedTaskDetails.submittedby
                      );
                      return submitter
                        ? `${submitter.firstname} ${submitter.lastname} (${submitter.email})`
                        : selectedTaskDetails.submittedby;
                    })()
                  : "Not submitted"}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-1">GitHub URL:</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={selectedTaskDetails.gitHubUrl || ""}
                  readOnly
                  className="p-2 border rounded-md w-full"
                />
                <button
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(selectedTaskDetails.gitHubUrl || "");
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-1">Explanation:</h3>
              <textarea
                value={selectedTaskDetails.context || "No explanation provided"}
                readOnly
                rows={5}
                className="w-full p-4 border rounded-md bg-gray-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
