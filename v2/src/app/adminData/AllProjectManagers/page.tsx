"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  UserGroupIcon,
  TrashIcon,
  PencilIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface User {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
  userType: string;
}

export default function AllProjectManagers() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/adminData/getAllProjectManagers", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          let errorMsg = `Error: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (e) {}
          if (response.status === 401 || response.status === 403) {
            toast.error("Unauthorized access. Redirecting to login.");
            router.push("/adminData/LoginAdmin");
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        if (data.success) {
          setUsers(data.users || []);
        } else {
          throw new Error(data.message || "Failed to fetch Project Managers.");
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching Project Managers:", error);
        const message = `Failed to fetch Project Managers: ${error.message}. Please try again later.`;
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  const handleCheckboxChange = (email: string) => {
    setSelectedUsers((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one Project Manager to delete.");
      return;
    }
    const confirmDelete = confirm(
      `Are you sure you want to delete ${selectedUsers.length} selected Project Manager(s)?\n\n⚠️ WARNING: This action will also delete all associated Projects, Teams, Assignments, and Tasks created by or assigned to them. This action cannot be undone.`
    );
    if (!confirmDelete) return;
    const loadingToastId = toast.loading("Deleting Project Manager(s)...");
    try {
      setLoading(true);
      const response = await fetch("/api/adminData/deleteProjectManagers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: selectedUsers }),
      });
      const data = await response.json();
      toast.dismiss(loadingToastId);
      if (data.success || response.status === 207) {
        toast.success(
          data.message || "Project Manager(s) processed successfully!"
        );
        setUsers((prevUsers) =>
          prevUsers.filter((user) => !selectedUsers.includes(user.email))
        );
        setSelectedUsers([]);
        if (
          response.status === 207 &&
          data.details?.invalidOrSkippedEmails?.length > 0
        ) {
          toast.error(
            `Could not process ${data.details.invalidOrSkippedEmails.length} email(s). Check console.`
          );
          console.error(
            "Deletion Skipped/Failures:",
            data.details.invalidOrSkippedEmails
          );
        }
      } else {
        throw new Error(data.message || "Failed to delete Project Managers.");
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      const error = err as Error;
      console.error("Error deleting Project Managers:", error);
      toast.error(`Deletion failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one Project Manager to update.");
      return;
    }
    router.push(`/adminData/UpdatePMs?emails=${selectedUsers.join(",")}`);
  };

  const handleGoToDetails = (UserId: string) => {
    const encodedUserId = encodeURIComponent(UserId);
    router.push(`/adminData/ProjectManagerDetails/${encodedUserId}`);
  };

  if (loading && users.length === 0) {
    return (
      <div>
        {" "}
        <div className="p-6 text-center">Loading Project Managers...</div>{" "}
      </div>
    );
  }
  if (error) {
    return (
      <div>
        {" "}
        <div className="p-6 text-center text-red-600">Error: {error}</div>{" "}
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 flex items-center">
          <UserGroupIcon className="w-7 h-7 mr-2 text-indigo-600" /> All Project
          Managers
        </h1>

        {users.length === 0 ? (
          <p className="text-gray-500 italic text-center mt-10">
            No Project Managers found.
          </p>
        ) : (
          <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
            <table className="min-w-full border-collapse border border-gray-300 bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="border px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile Pic
                  </th>
                  <th className="border px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="border px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="border px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.email}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="border px-4 py-2 text-center align-middle">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out border-gray-300 rounded focus:ring-indigo-500"
                        onChange={() => handleCheckboxChange(user.email)}
                        checked={selectedUsers.includes(user.email)}
                        aria-label={`Select ${user.firstname} ${user.lastname}`}
                      />
                    </td>
                    <td className="border px-4 py-2 align-middle">
                      <Image
                        src={user.profilepic || "/default-avatar.png"}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    </td>
                    <td className="border px-4 py-2 whitespace-nowrap align-middle font-medium text-gray-900">
                      {user.firstname} {user.lastname}
                    </td>
                    <td
                      className="border px-4 py-2 whitespace-nowrap align-middle text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={() => handleGoToDetails(user.UserId)}
                      title={`View details for ${user.email}`}
                    >
                      {user.email}
                    </td>
                    <td className="border px-4 py-2 whitespace-nowrap align-middle">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {user.userType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {users.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3 border-t pt-6">
            <button
              onClick={handleDelete}
              disabled={selectedUsers.length === 0 || loading}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete Selected ({selectedUsers.length})
            </button>
            <button
              onClick={handleUpdate}
              disabled={selectedUsers.length === 0 || loading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Update Selected ({selectedUsers.length})
            </button>
            <button
              onClick={() => router.push("/adminData/ProfileAdmin")}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
