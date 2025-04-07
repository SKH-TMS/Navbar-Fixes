"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import toast from "react-hot-toast";
import Image from "next/image"; // Import next/image

// Define User Type
interface User {
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
  userType: string; // Corrected type to string
  UserRole: string;
  UserId: string;
}

export default function AllTeamParticipants() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true); // Ensure loading is true at the start
      setError(""); // Reset error
      try {
        const response = await fetch("/api/adminData/getAllTeamParticipants", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store", // Prevent caching if data needs to be fresh
        });

        if (!response.ok) {
          // Handle non-2xx responses
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
          setUsers(data.participants || []); // Default to empty array
        } else {
          throw new Error(data.message || "Failed to fetch Team Participants.");
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching Team Participants:", error);
        setError(
          `Failed to fetch Team Participants: ${error.message}. Please try again later.`
        );
        toast.error(`Failed to fetch Team Participants: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed router from dependencies unless needed for re-fetch on route change

  // Handle checkbox selection
  const handleCheckboxChange = (email: string) => {
    setSelectedUsers((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  // Handle delete function
  const handleDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one participant to delete.");
      return;
    }

    const confirmDelete = confirm(
      `Are you sure you want to delete ${selectedUsers.length} selected participant(s)? This action may be irreversible.`
    );
    if (!confirmDelete) return;

    const deleteEndpoint = "../../api/adminData/deleteUsers";

    try {
      setLoading(true); // Indicate loading state
      const response = await fetch(deleteEndpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: selectedUsers }), // Sending emails
      });

      const data = await response.json();
      if (data.success || response.status === 207) {
        // Handle success and multi-status
        toast.success(data.message || "Selected participant(s) processed.");
        // Refresh the user list by filtering out deleted ones
        setUsers((prevUsers) =>
          prevUsers.filter((user) => !selectedUsers.includes(user.email))
        );
        setSelectedUsers([]); // Reset selection
        // Handle partial failures if status is 207
        if (response.status === 207 && data.details?.failedCount > 0) {
          toast.error(
            `Failed to delete ${data.details.failedCount} participant(s). Check console.`
          );
          console.error(
            "Deletion Failures:",
            data.details.invalidOrSkippedEmails || data.details
          );
        }
      } else {
        throw new Error(data.message || "Failed to delete participants.");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error deleting participants:", error);
      toast.error(`Failed to delete participants: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle update function - Navigates to update page with selected emails
  const handleUpdate = () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one participant to update.");
      return;
    }
    // Navigate to the update page, passing emails as query params
    // Ensure the target page 'UpdateParticipants' exists and handles the 'emails' param
    router.push(`UpdateParticipants?emails=${selectedUsers.join(",")}`);
  };

  // --- Updated: Navigate directly to details page on email click ---
  const handleGoToDetails = (email: string) => {
    // No need to check selectedUsers here, navigate directly
    const encodedEmail = encodeURIComponent(email); // Ensure email is URL-safe
    router.push(`ParticipantDetails/${encodedEmail}`);
  };
  // --- End Update ---

  if (loading)
    return <div className="p-4 text-center">Loading participants...</div>;
  if (error)
    return <div className="p-4 text-red-500 text-center">Error: {error}</div>;

  return (
    <div>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Team Participants
        </h1>

        {users.length === 0 ? (
          <p className="text-gray-500 italic">No team participants found.</p>
        ) : (
          <div className="overflow-x-auto shadow-md rounded-lg">
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
                    Role(s)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.email} className="hover:bg-gray-50">
                    <td className="border px-4 py-2 text-center align-middle">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                        onChange={() => handleCheckboxChange(user.email)}
                        checked={selectedUsers.includes(user.email)}
                        aria-label={`Select user ${user.firstname} ${user.lastname}`}
                      />
                    </td>
                    <td className="border px-4 py-2 align-middle">
                      {/* Use next/image for optimization */}
                      <Image
                        src={user.profilepic || "/default-avatar.png"} // Provide fallback
                        alt={`${user.firstname} ${user.lastname}'s profile`}
                        width={40} // Smaller size for table
                        height={40}
                        className="rounded-full object-cover"
                      />
                    </td>
                    <td className="border px-4 py-2 whitespace-nowrap align-middle">
                      {user.firstname} {user.lastname}
                    </td>
                    {/* --- Updated Email Cell --- */}
                    <td
                      className="border px-4 py-2 whitespace-nowrap align-middle text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={() => handleGoToDetails(user.UserId)} // Use updated handler
                      title={`View details for ${user.email}`} // Add tooltip
                    >
                      {user.email}
                    </td>
                    {/* --- End Update --- */}
                    <td className="border px-4 py-2 whitespace-nowrap align-middle">
                      {user.UserRole}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Buttons */}
        {users.length > 0 && ( // Show buttons only if there are users
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleDelete}
              disabled={selectedUsers.length === 0 || loading} // Disable if no selection or loading
              className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Selected ({selectedUsers.length})
            </button>

            <button
              onClick={handleUpdate}
              disabled={selectedUsers.length === 0 || loading} // Disable if no selection or loading
              className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Selected ({selectedUsers.length})
            </button>

            <button
              onClick={() => router.push("ProfileAdmin")} // Adjust path if needed
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded shadow hover:bg-gray-600 disabled:opacity-50"
            >
              Back to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
