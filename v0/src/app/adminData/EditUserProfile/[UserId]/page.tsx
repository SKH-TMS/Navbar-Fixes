"use client";

import React, { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowLeftIcon,
  IdentificationIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

// Interface for the form data state - add newPassword
interface ProfileFormData {
  firstname: string;
  lastname: string;
  contact: string;
  newPassword?: string; // Optional field for the new password input
}

// Interface for the user data fetched from API
interface UserProfileData {
  UserId: string;
  email: string;
  firstname: string;
  lastname: string;
  contact?: string;
  profilepic: string;
  userType: string;
}

function EditUserProfileContent() {
  const router = useRouter();
  const params = useParams();
  const UserIdParam = params?.UserId;
  const targetUserId = Array.isArray(UserIdParam)
    ? UserIdParam[0]
    : UserIdParam;

  const [formData, setFormData] = useState<ProfileFormData>({
    firstname: "",
    lastname: "",
    contact: "",
    newPassword: "", // Initialize newPassword
  });
  const [currentUserData, setCurrentUserData] =
    useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newPasswordVisible, setNewPasswordVisible] = useState<boolean>(false); // State for password visibility

  // Fetch specific user data
  useEffect(() => {
    if (!targetUserId) {
      setError("User ID not found in URL.");
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/adminData/editUser/${encodeURIComponent(targetUserId)}`
        );
        if (!response.ok) {
          let errorMsg = "Failed to fetch user data.";
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Unauthorized access.";
            toast.error(errorMsg);
            router.push("/admin/AllUsers");
          } else if (response.status === 404) {
            errorMsg = `User with ID ${targetUserId} not found.`;
          } else {
            try {
              const errorData = await response.json();
              errorMsg = errorData.message || errorMsg;
            } catch (e) {
              /* ignore */
            }
          }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        if (data.success && data.user) {
          setCurrentUserData(data.user);
          setFormData({
            firstname: data.user.firstname || "",
            lastname: data.user.lastname || "",
            contact: data.user.contact || "",
            newPassword: "", // Ensure password field starts empty
          });
        } else {
          throw new Error(data.message || "Could not retrieve user data.");
        }
      } catch (err) {
        const error = err as Error;
        console.error("Fetch User Profile Error:", error);
        setError(error.message);
        toast.error(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [targetUserId, router]);

  // Handle input changes (including newPassword)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Toggle new password visibility
  const toggleNewPasswordVisibility = () => {
    setNewPasswordVisible(!newPasswordVisible);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!targetUserId) return;

    setIsSubmitting(true);
    setError(null);
    const loadingToastId = toast.loading(
      `Updating profile for ${targetUserId}...`
    );

    // Prepare payload, conditionally adding password
    const payload: Partial<ProfileFormData> & { password?: string } = {
      firstname: formData.firstname,
      lastname: formData.lastname,
      contact: formData.contact,
    };

    if (formData.newPassword && formData.newPassword.trim() !== "") {
      payload.password = formData.newPassword;
    } else {
      delete payload.password;
    }

    try {
      const response = await fetch(
        `/api/adminData/editUser/${encodeURIComponent(targetUserId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      toast.dismiss(loadingToastId);

      if (data.success) {
        toast.success(`Profile for ${targetUserId} updated successfully!`);
        setCurrentUserData(data.user);
        // Clear the password field after successful submission
        setFormData((prev) => ({ ...prev, newPassword: "" }));
        setNewPasswordVisible(false); // Hide password field again
        router.back();
      } else {
        throw new Error(data.message || "Failed to update profile.");
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      const error = err as Error;
      console.error("Update Profile Error:", error);
      setError(error.message);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading user profile...
      </div>
    );
  }

  // Return early if there's an error and no user data
  if (error && !currentUserData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600">
        Error: {error}
      </div>
    );
  }

  // Return early if currentUserData is still null
  if (!currentUserData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        No user data available.
      </div>
    );
  }

  // Now TypeScript knows that currentUserData is not null
  return (
    <div>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="bg-slate-200 mb-6 inline-flex items-center text-lg font-medium text-black hover:bg-slate-300 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back .
            </button>
            <div className="flex flex-col items-center mb-8">
              <Image
                src={currentUserData.profilepic || "/default-avatar.png"}
                alt="Profile Picture"
                width={120}
                height={120}
                className="rounded-full object-cover border-4 border-gray-200 shadow-md mb-4"
              />
              <h2 className="text-2xl font-semibold text-gray-800">
                {currentUserData.firstname} {currentUserData.lastname}
              </h2>
              <p className="text-sm text-gray-500">
                ({currentUserData.UserId})
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Read-only Info */}
              <div className="p-4 bg-gray-50 rounded border border-gray-200 space-y-2">
                <div className="flex items-center text-gray-700">
                  <EnvelopeIcon
                    className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium mr-2">Email:</span>
                  <span className="truncate">{currentUserData.email}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <IdentificationIcon
                    className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium mr-2">User Type:</span>
                  <span>{currentUserData.userType}</span>
                </div>
                <p className="text-xs text-gray-500 pt-1">
                  Email cannot be changed.
                </p>
              </div>

              {/* Editable Fields */}
              <div>
                <label
                  htmlFor="firstname"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="lastname"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="contact"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contact Number{" "}
                  <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className="w-full block pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., +1 555-123-4567"
                  />
                </div>
              </div>

              {/* New Password Field */}
              <div className="border-t pt-6 mt-6 border-gray-200">
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Set New Password{" "}
                  <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    type={newPasswordVisible ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword || ""}
                    onChange={handleChange}
                    className="w-full block pl-10 pr-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter new password to change"
                    autoComplete="new-password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={toggleNewPasswordVisibility}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label={
                        newPasswordVisible ? "Hide password" : "Show password"
                      }
                    >
                      {newPasswordVisible ? (
                        <EyeSlashIcon className="h-5 w-5 bg-white" />
                      ) : (
                        <EyeIcon className="h-5 w-5 bg-white" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to keep the current password.
                </p>
              </div>

              {/* Display Submission Error */}
              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense
export default function EditUserProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          Loading...
        </div>
      }
    >
      <EditUserProfileContent />
    </Suspense>
  );
}
