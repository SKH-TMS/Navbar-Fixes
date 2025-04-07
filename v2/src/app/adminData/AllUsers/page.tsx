"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Adjust path if needed
import toast from "react-hot-toast";
import Image from "next/image"; // Import next/image
import {
  UsersIcon as PageIcon, // Alias for clarity
  TrashIcon,
  PencilIcon,
  ArrowLeftIcon,
  UserPlusIcon, // Icon for assigning role
} from "@heroicons/react/24/outline";

// Define User Type - Assuming UserId is returned by the API
interface User {
  UserId: string; // Use UserId as primary identifier
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
  userType: string; // Use lowercase string
}

export default function AllUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]); // Store UserIds for selection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Fetch users function (remains the same)
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/adminData/getAllUsers", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        /* ... error handling ... */
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
        const validUsers = (data.users || []).filter((u: any) => u && u.UserId);
        setUsers(validUsers);
        if (validUsers.length !== (data.users || []).length) {
          console.warn("Some user records were missing a UserId.");
        }
      } else {
        throw new Error(data.message || "Failed to fetch users.");
      }
    } catch (err) {
      /* ... error handling ... */
      const error = err as Error;
      console.error("Error fetching users:", error);
      const message = `Failed to fetch users: ${error.message}. Please try again later.`;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle checkbox selection using UserId (remains the same)
  const handleCheckboxChange = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle delete function using UserIds (remains the same)
  const handleDelete = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user to delete.");
      return;
    }
    const confirmDelete = confirm(
      `Are you sure you want to delete ${selectedUserIds.length} selected user(s)?`
    );
    if (!confirmDelete) return;
    const loadingToastId = toast.loading("Deleting user(s)...");
    try {
      setLoading(true);
      const response = await fetch("/api/adminData/deleteUsers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      const data = await response.json();
      toast.dismiss(loadingToastId);
      if (data.success || response.status === 207) {
        /* ... success/partial success handling ... */
        toast.success(data.message || "Selected user(s) processed.");
        setUsers((prevUsers) =>
          prevUsers.filter((user) => !selectedUserIds.includes(user.UserId))
        );
        setSelectedUserIds([]);
        if (response.status === 207 && data.details?.failedCount > 0) {
          toast.error(
            `Failed to delete ${data.details.failedCount} user(s). Check console.`
          );
          console.error("Deletion Failures:", data.details);
        }
      } else {
        throw new Error(data.message || "Failed to delete users.");
      }
    } catch (err) {
      /* ... error handling ... */
      toast.dismiss(loadingToastId);
      const error = err as Error;
      console.error("Error deleting users:", error);
      toast.error(`Deletion failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle update function using UserIds (remains the same)
  const handleUpdate = () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user to update.");
      return;
    }
    router.push(`/adminData/UpdateUsers?ids=${selectedUserIds.join(",")}`);
  };

  // Assign Project Manager Role using UserIds (remains the same)
  const handleAssignProjectManager = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select user(s) to assign as Project Manager.");
      return;
    }
    const confirmAssign = confirm(
      `Assign Project Manager role to ${selectedUserIds.length} selected user(s)?`
    );
    if (!confirmAssign) return;
    const loadingToastId = toast.loading("Assigning role...");
    try {
      setLoading(true);
      const response = await fetch("/api/adminData/assignProjectManager", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      const data = await response.json();
      toast.dismiss(loadingToastId);
      if (data.success || response.status === 207) {
        /* ... success/partial success handling ... */
        toast.success(data.message || "Role assignment processed!");
        fetchUsers(); // Re-fetch data
        setSelectedUserIds([]);
        if (response.status === 207 && data.details?.failedCount > 0) {
          toast.error(
            `Failed to assign role for ${data.details.failedCount} user(s). Check console.`
          );
          console.error("Assignment Failures:", data.details);
        }
      } else {
        throw new Error(data.message || "Failed to assign role.");
      }
    } catch (err) {
      /* ... error handling ... */
      toast.dismiss(loadingToastId);
      const error = err as Error;
      console.error("Error assigning role:", error);
      toast.error(`Assignment failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to User Details Page using UserId (remains the same)
  const handleGoToDetails = (userId: string) => {
    const encodedUserId = encodeURIComponent(userId);
    router.push(`/adminData/UserDetails/${encodedUserId}`); // Adjust path if needed
  };

  // --- Render Logic ---

  if (loading && users.length === 0) {
    /* ... loading ... */
  }
  if (error) {
    /* ... error ... */
  }

  return (
    <div>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 flex items-center">
          <PageIcon className="w-7 h-7 mr-2 text-indigo-600" /> All Users Not in
          a Team
        </h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {users.length === 0 && !loading ? (
          <p className="text-gray-500 italic text-center mt-10">
            No users found matching the criteria.
          </p>
        ) : (
          // --- Apply Styling from AllTeamParticipants ---
          <div className="overflow-x-auto shadow-md rounded-lg">
            {/* Use border-collapse and specific border */}
            <table className="min-w-full border-collapse border border-gray-300 bg-white">
              {/* Use specific thead styling */}
              <thead className="bg-gray-100">
                <tr>
                  {/* Use specific th styling */}
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
              {/* Use specific tbody styling */}
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  // Use specific tr styling
                  <tr key={user.UserId} className="hover:bg-gray-50">
                    {" "}
                    {/* Key uses UserId */}
                    {/* Use specific td styling */}
                    <td className="border px-4 py-2 text-center align-middle">
                      <input
                        type="checkbox"
                        // Use specific checkbox styling
                        className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out border-gray-300 rounded focus:ring-indigo-500"
                        onChange={() => handleCheckboxChange(user.UserId)} // Use UserId
                        checked={selectedUserIds.includes(user.UserId)} // Use UserId
                        aria-label={`Select ${user.firstname} ${user.lastname}`}
                      />
                    </td>
                    <td className="border px-4 py-2 align-middle">
                      {/* Use specific image styling */}
                      <Image
                        src={user.profilepic || "/default-avatar.png"}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    </td>
                    <td className="border px-4 py-2 whitespace-nowrap align-middle">
                      {user.firstname} {user.lastname}
                    </td>
                    <td
                      // Use specific email cell styling and functionality
                      className="border px-4 py-2 whitespace-nowrap align-middle text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={() => handleGoToDetails(user.UserId)} // Use UserId
                      title={`View details for ${user.email}`}
                    >
                      {user.email}
                    </td>
                    <td className="border px-4 py-2 whitespace-nowrap align-middle">
                      {/* Use specific role badge styling */}
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {user.userType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          // --- End Apply Styling ---
        )}

        {/* Action Buttons (styling remains the same) */}
        {users.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3 border-t pt-6">
            <button
              onClick={handleDelete}
              disabled={selectedUserIds.length === 0 || loading}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              <TrashIcon className="w-4 h-4 mr-2" /> Delete (
              {selectedUserIds.length}){" "}
            </button>
            <button
              onClick={handleUpdate}
              disabled={selectedUserIds.length === 0 || loading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              <PencilIcon className="w-4 h-4 mr-2" /> Update (
              {selectedUserIds.length}){" "}
            </button>
            <button
              onClick={handleAssignProjectManager}
              disabled={selectedUserIds.length === 0 || loading}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              <UserPlusIcon className="w-4 h-4 mr-2" /> Assign PM Role (
              {selectedUserIds.length}){" "}
            </button>
            <button
              onClick={() => router.push("/adminData/ProfileAdmin")}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {" "}
              <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Profile{" "}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
