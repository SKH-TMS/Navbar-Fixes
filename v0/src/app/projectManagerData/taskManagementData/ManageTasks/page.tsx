"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Task {
  TaskId: string;
  title: string;
  description: string;
  assignedTo: string[];
  deadline: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  gitHubUrl?: string;
  context?: string;
  submittedby?: string;
  // Flattened assignment details:
  projectId: string;
  projectName: string;
  teamId: string;
  teamName: string;
}
interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

export default function ManageTasksPage() {
  const [markpending, setmarkpending] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feedback, setfeedback] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]); // Track selected task IDs
  const [taskColour, settaskColour] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitters, setSubmitters] = useState<Member[]>([]);
  const router = useRouter();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(
    null
  );
  const fetchTasks = async () => {
    try {
      const response = await fetch(
        "/api/projectManagerData/taskManagementData/getTasks",
        { method: "GET" }
      );
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
        setMembers(data.members);
        setSubmitters(data.submitters);
      } else {
        setError(data.message || "Failed to fetch tasks.");
        toast.error(data.message || "Failed to fetch tasks.");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to fetch tasks. Please try again later.");
      toast.error("Failed to fetch tasks. Please try again later.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("GitHub URL copied to clipboard!");
    });
  };

  // When a task's "Click to view" is clicked, show the task's additional details in a form
  const handleViewExplanationClick = (task: Task, colour: string) => {
    settaskColour(colour);
    setSelectedTaskDetails(task); // Show the task's additional details in a form
  };

  // Close the modal when clicking the close button or background
  const handleCloseModal = () => {
    setSelectedTaskDetails(null);
    setmarkpending(false);
  };
  const handleMarkPending = async () => {
    if (!selectedTaskDetails) return;
    const confirmSubmit = window.confirm(
      "Are you sure about marking this Task pending this will result in deletion of the submittion data of the task"
    );
    if (!confirmSubmit) return;
    if (feedback === "") {
      toast.error("Please enter feedback ");
      return;
    }
    try {
      // Send a request to update the task status to "Completed"
      const response = await fetch(
        `/api/projectManagerData/taskManagementData/markTaskPending/${selectedTaskDetails.TaskId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback }),
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Task marked as completed!");
        // Update the local task state to reflect the change
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.TaskId === selectedTaskDetails.TaskId
              ? { ...task, status: "Completed" }
              : task
          )
        );
        setSelectedTaskDetails(null); // Close the modal after update
      } else {
        toast.error(data.message || "Failed to mark task as completed.");
        router.push("/projectManagerData/ProfileProjectManager");
      }
    } catch (error) {
      console.error("Error marking task as completed:", error);
      toast.error("Failed to mark task as completed.");
      router.push("/projectManagerData/ProfileProjectManager");
    }
  };

  // Mark the task as completed by updating the status in the backend
  const handleMarkCompleted = async () => {
    if (!selectedTaskDetails) return;
    const confirmSubmit = window.confirm(
      "Are you sure about marking this Task as Completed"
    );
    if (!confirmSubmit) return;
    try {
      // Send a request to update the task status to "Completed"
      const response = await fetch(
        `/api/projectManagerData/taskManagementData/markTaskCompleted/${selectedTaskDetails.TaskId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Task marked as completed!");
        // Update the local task state to reflect the change
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.TaskId === selectedTaskDetails.TaskId
              ? { ...task, status: "Completed" }
              : task
          )
        );
        setSelectedTaskDetails(null); // Close the modal after update
      } else {
        toast.error(data.message || "Failed to mark task as completed.");
      }
    } catch (error) {
      console.error("Error marking task as completed:", error);
      toast.error("Failed to mark task as completed.");
    }
  };

  const getTaskBgColors = (taskId: string, status: string) => {
    // Check if the task is selected
    let bgColor = selectedTaskIds.includes(taskId) ? "bg-pink-100" : "";

    // Update color based on status
    if (status === "In Progress") {
      bgColor = selectedTaskIds.includes(taskId)
        ? "bg-pink-200"
        : "bg-blue-100";
    } else if (status === "Completed") {
      bgColor = selectedTaskIds.includes(taskId)
        ? "bg-pink-200"
        : "bg-green-100";
    } else if (status === "Pending") {
      bgColor = selectedTaskIds.includes(taskId)
        ? "bg-pink-200"
        : "bg-gray-100";
    } else if (status === "Re Assigned") {
      bgColor = selectedTaskIds.includes(taskId)
        ? "bg-pink-200"
        : "bg-amber-50";
    }

    return bgColor;
  };

  // Handle "Update" button click
  const handleUpdateTask = (
    taskId: string,
    status: string,
    projectId: string
  ) => {
    if (!status) return;
    if (status === "Completed") {
      const confirmSubmit = window.confirm(
        "This Task has already been Completed. Updating it will override the current implementation. Are you sure you want to update it?"
      );
      if (!confirmSubmit) return;
    }
    if (!status) return;
    if (status === "In Progress") {
      const confirmSubmit = window.confirm(
        "This Task has already been Performed by the user . Updating it will override the current implementation. Are you sure you want to update it?"
      );
      if (!confirmSubmit) return;
    }
    // Redirect to the update task page, passing the task ID as a parameter
    router.push(
      `/projectManagerData/taskManagementData/ManageTasks/updateTask/${projectId}/${taskId}`
    );
  };

  // Function to handle deleting selected tasks
  const handleDeleteSelectedTasks = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete the selected tasks?"
    );
    if (confirmed) {
      try {
        const response = await fetch(
          "/api/projectManagerData/taskManagementData/deleteSelectedTasks",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskIds: selectedTaskIds }),
          }
        );
        const data = await response.json();
        if (data.success) {
          toast.success("Selected tasks deleted successfully!");
          // Optionally, remove deleted tasks from the state
          setTasks((prevTasks) =>
            prevTasks.filter((task) => !selectedTaskIds.includes(task.TaskId))
          );
          setSelectedTaskIds([]); // Clear selected tasks
        } else {
          toast.error(data.message || "Failed to delete tasks.");
        }
      } catch (error) {
        toast.error("Failed to delete tasks. Please try again.");
      }
    }
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

  const handleMarkPendingstate = () => {
    setmarkpending(true);
  };

  const handleTaskClick = (projectId: string) => {
    if (isSelectMode) {
      toggleTaskSelection(projectId);
    }
  };

  // Function to toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(
      (prevSelectedIds) =>
        prevSelectedIds.includes(taskId)
          ? prevSelectedIds.filter((id) => id !== taskId) // Deselect
          : [...prevSelectedIds, taskId] // Select
    );
  };

  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedTaskIds([]);
      setIsSelectMode(false);
    } else {
      setIsSelectMode(true);
    }
  };
  const handleCreateTask = () => {
    router.push("/projectManagerData/taskManagementData/CreateTask");
  };

  if (loading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="p-6 relative">
        <div className="flex justify-start my-5 mx-2">
          <div>
            <button
              onClick={handleToggleSelectMode}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-400 to-pink-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-purple-200"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
                {isSelectMode ? "Cancel " : "Select "}
              </span>
            </button>
          </div>
          <div className="mx-3">
            <button
              className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
              onClick={handleCreateTask}
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                Create Task
              </span>
            </button>
          </div>
          {/* Display "Delete Selected Tasks" button only if any task is selected */}
          {selectedTaskIds.length > 0 && (
            <div className="mx-3">
              <button
                className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800"
                onClick={handleDeleteSelectedTasks}
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                  Delete selected Task
                </span>
              </button>
            </div>
          )}
        </div>

        {tasks.length === 0 ? (
          <p className="text-center">No tasks assigned for this project yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {sortedTasks.map((task) => {
              const bgColor = getTaskBgColors(task.TaskId, task.status);

              return (
                <div
                  key={task.TaskId}
                  className={`${getTaskBgColors(
                    task.TaskId,
                    task.status
                  )}   group ${bgColor} shadow-lg rounded-xl p-6 hover:shadow-2xl transform hover:scale-105 transition duration-300 cursor-pointer relative`}
                  onClick={(e) => handleTaskClick(task.TaskId)} // Handle task click to select
                >
                  <h4 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                    {task.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3">
                    Discription:{} {task.description}
                  </p>

                  <p className="text-xs text-gray-500 mb-1">
                    Deadline:{" "}
                    {new Date(task.deadline).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Status: {task.status}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">
                    Project:{} {task.projectId} ({task.projectName})
                  </p>
                  <p className="text-gray-600 text-sm mb-3">
                    Team:{} {task.teamId} ({task.teamName})
                  </p>

                  {/* Display the "Assigned To" list */}
                  <div>
                    <p className="font-semibold text-sm  text-black">
                      Assigned To:
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-700">
                      {task.assignedTo.map((userId) => {
                        const member = members.find((m) => m.UserId === userId);
                        return (
                          <li key={userId}>
                            {member
                              ? `${member.firstname}${member.lastname}---(${member.email})`
                              : userId}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {/* Only show the "Click to view" link if the task is "In Progress and Completed" */}
                  {(task.status === "In Progress" ||
                    task.status === "Completed") && (
                    <div>
                      {task.status === "In Progress" && (
                        <div>
                          <p
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewExplanationClick(task, "bg-blue-50");
                            }}
                            className="text-blue-500 text-sm text-center underline hover hover:text-blue-700"
                          >
                            View Implementaion
                          </p>
                          {/* Hover buttons:"Update" */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-around opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent task click handler from being triggered
                                handleUpdateTask(
                                  task.TaskId,
                                  "In Progress",
                                  task.projectId
                                ); // Implement the update logic
                              }}
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      )}
                      {task.status === "Completed" && (
                        <div>
                          <p
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewExplanationClick(task, "bg-green-50");
                            }}
                            className="text-blue-500 text-center text-sm underline  hover hover:text-blue-700"
                          >
                            View Implementation
                          </p>
                          {/* Hover buttons:"Update" */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-around opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent task click handler from being triggered
                                handleUpdateTask(
                                  task.TaskId,
                                  "Completed",
                                  task.projectId
                                ); // Implement the update logic
                              }}
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {task.status === "Pending" && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-around opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent task click handler from being triggered
                          handleUpdateTask(
                            task.TaskId,
                            "Pending",
                            task.projectId
                          ); // Implement the update logic
                        }}
                      >
                        Update
                      </button>
                    </div>
                  )}
                  {task.status === "Re Assigned" && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-around opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent task click handler from being triggered
                          handleUpdateTask(
                            task.TaskId,
                            "Re Assigned",
                            task.projectId
                          ); // Implement the update logic
                        }}
                      >
                        Update
                      </button>
                    </div>
                  )}
                  <p className="my-7"></p>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal form for viewing task details */}
        {selectedTaskDetails && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center text-black`}
          >
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

              {/* Form with additional task details */}
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
              {markpending ? (
                <>
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg mb-1">Feedback:</h3>
                    <textarea
                      value={feedback || ""}
                      onChange={(e) => setfeedback(e.target.value)}
                      className="w-full p-4 border rounded-md bg-gray-100"
                      placeholder="Provide your feedback"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg mb-1">Explanation:</h3>
                    <textarea
                      value={
                        selectedTaskDetails.context || "No explanation provided"
                      }
                      readOnly
                      rows={4}
                      className="w-full p-4 border rounded-md bg-gray-100"
                    />
                  </div>
                </>
              )}
              {/* Mark Completed Button */}
              {selectedTaskDetails.status === "In Progress" && (
                <div className="mt-4 text-center flex justify-around">
                  <div>
                    <button
                      onClick={handleMarkCompleted}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Mark Completed
                    </button>
                  </div>
                  <div>
                    {markpending ? (
                      <>
                        <button
                          onClick={handleMarkPending}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Confirm
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleMarkPendingstate}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400"
                        >
                          Mark Pending
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              {/* Mark Completed Button */}
              {selectedTaskDetails.status === "Completed" && (
                <div className="mt-4 text-center">
                  {markpending ? (
                    <>
                      <button
                        onClick={handleMarkPending}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Confirm
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleMarkPendingstate}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400"
                      >
                        Mark Pending
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
