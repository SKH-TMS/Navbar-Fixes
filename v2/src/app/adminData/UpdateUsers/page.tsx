"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import toast from "react-hot-toast";

// 1. Update User interface to include an optional password field
interface User {
  UserId: string; // Assuming you have _id, needed for reliable updates if email isn't unique identifier
  email: string;
  firstname: string;
  lastname: string;
  contact: string;
  password?: string; // Optional: Only used to hold the NEW password input
}

// Inner component for logic
function UpdateUsersInner() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  // Use _ids for fetching/updating if available and more reliable than email
  const userIds = searchParams.get("ids")?.split(",") || [];
  // Fallback to emails if ids aren't passed
  const emails = searchParams.get("emails")?.split(",") || [];

  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchUsers = async () => {
      // Prefer fetching by ID if available
      const fetchById = userIds.length > 0;
      const identifiers = fetchById ? userIds : emails;
      const endpoint = fetchById
        ? "../../api/adminData/getUsersById" // You'll need to create this API endpoint
        : "../../api/adminData/getUsersByEmail";

      if (identifiers.length === 0 || hasFetched.current) return;

      setLoading(true); // Set loading true before fetch
      try {
        console.log(
          `📡 Fetching Users by ${fetchById ? "IDs" : "Emails"}:`,
          identifiers
        );
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            fetchById ? { ids: identifiers } : { emails: identifiers }
          ),
        });

        const data = await response.json();

        if (data.success) {
          // Initialize users with empty password field
          const usersWithPasswordField = data.users.map((user: any) => ({
            ...user,
            password: "", // Start with empty password input
          }));
          setUsers(usersWithPasswordField);
          console.log(" Users Fetched:", usersWithPasswordField);
        } else if (response.status === 403) {
          console.log("Unautherized Access");
          router.push("/adminData/LoginAdmin");
        } else {
          setError(data.message || "Failed to fetch users.");
          console.error(" Fetch Users Error:", data.message);
          toast.error(data.message || "Failed to fetch users.");
        }
      } catch (err) {
        const error = err as Error;
        console.error(" Error fetching users:", error);
        setError(`Failed to fetch users: ${error.message}`);
        toast.error(`Failed to fetch users: ${error.message}`);
      } finally {
        setLoading(false);
        hasFetched.current = true;
      }
    };

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Depend on stringified identifiers if needed, or run once

  const handleInputChange = (
    index: number,
    field: keyof Omit<User, "_id">, // Exclude _id from direct input change
    value: string
  ) => {
    setUsers((prevUsers) =>
      prevUsers.map((user, i) =>
        i === index ? { ...user, [field]: value } : user
      )
    );
  };

  const handleUpdate = async () => {
    if (users.length === 0) {
      toast.error("No users selected to update.");
      return;
    }

    // Prepare payload: only send password if it's not empty
    const updatesPayload = users.map((user) => {
      const updateData: Partial<User> & { UserId: string } = {
        // Use _id to identify user on backend
        UserId: user.UserId,
        firstname: user.firstname,
        lastname: user.lastname,
        contact: user.contact,
        // email: user.email // Only include email if it's changeable, otherwise use _id
      };
      // Only include password in payload if it has been entered
      if (user.password && user.password.trim() !== "") {
        updateData.password = user.password;
      }
      return updateData;
    });

    console.log("📡 Sending Update Payload:", updatesPayload);

    try {
      setLoading(true); // Indicate loading state during update
      const response = await fetch("../../api/adminData/updateUsers", {
        // Ensure this API endpoint exists and handles the payload
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: updatesPayload }), // Send filtered payload
      });

      const data = await response.json();

      if (data.success) {
        toast.success(" Users updated successfully!");
        router.push("AllUsers"); // Navigate back or refresh
      } else {
        toast.error(` Failed to update users: ${data.message}`);
        console.error(" Update Users Error:", data.message);
      }
    } catch (err) {
      const error = err as Error;
      console.error(" Error updating users:", error);
      toast.error(` Failed to update users: ${error.message}`);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  if (loading && users.length === 0)
    return (
      <div>
        <div className="p-4">Loading user data...</div>
      </div>
    ); // Show loading only initially
  if (error)
    return (
      <div>
        <div className="p-4 text-red-500">Error: {error}</div>
      </div>
    );

  return (
    <div>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Update Users</h1>

        {users.length === 0 && !loading ? (
          <p className="text-gray-500">No users selected or found.</p>
        ) : (
          users.map((user, index) => (
            <div
              key={user.UserId}
              className="mb-6 p-4 border rounded shadow-sm"
            >
              <h2 className="text-lg font-semibold mb-2">{user.email}</h2>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={user.firstname}
                  onChange={(e) =>
                    handleInputChange(index, "firstname", e.target.value)
                  }
                  className="border p-2 w-full rounded focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="First Name"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={user.lastname}
                  onChange={(e) =>
                    handleInputChange(index, "lastname", e.target.value)
                  }
                  className="border p-2 w-full rounded focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Last Name"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={user.contact}
                  onChange={(e) =>
                    handleInputChange(index, "contact", e.target.value)
                  }
                  className="border p-2 w-full rounded focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Contact Number"
                />
              </div>

              {/* Password Input Field */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={user.password || ""} // Controlled component
                  onChange={(e) =>
                    handleInputChange(index, "password", e.target.value)
                  }
                  className="border p-2 w-full rounded focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password" // Helps password managers
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a new password only if you want to change it.
                </p>
              </div>
            </div>
          ))
        )}

        {users.length > 0 && (
          <button
            onClick={handleUpdate}
            disabled={loading} // Disable button while updating
            className={`px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 ${
              loading ? "cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Updating..." : "Update Selected Users"}
          </button>
        )}
      </div>
    </div>
  );
}

// Wrap the inner component in a Suspense boundary
export default function UpdateUsers() {
  return (
    // Suspense is good practice for components using useSearchParams
    <Suspense
      fallback={
        <div>
          <div className="p-4">Loading...</div>
        </div>
      }
    >
      <UpdateUsersInner />
    </Suspense>
  );
}
