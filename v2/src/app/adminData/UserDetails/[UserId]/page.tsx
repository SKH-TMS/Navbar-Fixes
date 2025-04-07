"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import toast from "react-hot-toast"; // Import toast for potential feedback

// --- Interface Definitions ---
interface UserProfile {
  UserId: string;
  email: string;
  firstname: string;
  lastname: string;
  contact?: string;
  profilepic: string;
  userType: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface UserDetailsResponse {
  success: boolean;
  user?: UserProfile;
  message?: string;
}

// --- Helper Components (Defined within the Client Component file) ---

// Skeleton Loader for Profile Card
const ProfileSkeleton: React.FC = () => (
  <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 animate-pulse">
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 md:p-8 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row items-center">
        <div className="w-24 h-24 bg-gray-300 rounded-full mb-4 sm:mb-0 sm:mr-6"></div>
        <div className="flex-1 w-full">
          <div className="h-7 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-5 bg-gray-300 rounded w-1/2 mb-4"></div>
        </div>
        <div className="h-9 bg-gray-300 rounded w-1/4 mt-4 sm:mt-0 sm:ml-auto"></div>{" "}
        {/* Edit button placeholder */}
      </div>
    </div>
    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
      {[...Array(5)].map(
        (
          _,
          i // Simulate 5 detail lines
        ) => (
          <div key={i} className="flex items-center">
            <div className="w-5 h-5 bg-gray-300 rounded mr-3"></div>
            <div className="h-4 bg-gray-300 rounded w-3/5"></div>
          </div>
        )
      )}
    </div>
  </div>
);

// User Detail Card Component - Now a regular component within the Client Component
// It receives the router instance via props if needed, or uses the one from the parent scope.
const UserDetailCard: React.FC<{
  user: UserProfile;
  onEditClick: () => void;
}> = ({ user, onEditClick }) => {
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 md:p-8 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-center">
          <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6 relative">
            <Image
              src={user.profilepic || "/default-avatar.png"}
              alt={`${user.firstname} ${user.lastname}'s profile`}
              width={100}
              height={100}
              className="rounded-full object-cover border-4 border-white shadow-md"
              priority
            />
            <span
              className="absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full p-1.5"
              title="Online Status (Placeholder)"
            ></span>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              {user.firstname} {user.lastname}
            </h1>
            <p className="text-sm text-gray-500">{user.userType}</p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-auto">
            <button
              onClick={onEditClick}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm transition duration-150 ease-in-out"
            >
              <PencilSquareIcon className="w-4 h-4 mr-2" /> Edit Profile
            </button>
          </div>
        </div>
      </div>
      {/* Body Section - Details */}
      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm">
        <div className="flex items-center text-gray-700">
          {" "}
          <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />{" "}
          <span className="font-medium mr-2">Email:</span>{" "}
          <a
            href={`mailto:${user.email}`}
            className="text-blue-600 hover:underline truncate"
            title={user.email}
          >
            {user.email}
          </a>{" "}
        </div>
        <div className="flex items-center text-gray-700">
          {" "}
          <IdentificationIcon className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />{" "}
          <span className="font-medium mr-2">User ID:</span>{" "}
          <span className="text-gray-600">{user.UserId}</span>{" "}
        </div>
        <div className="flex items-center text-gray-700">
          {" "}
          <PhoneIcon className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />{" "}
          <span className="font-medium mr-2">Contact:</span>{" "}
          <span className="text-gray-600">
            {user.contact || (
              <span className="italic text-gray-400">Not Provided</span>
            )}
          </span>{" "}
        </div>
        <div className="flex items-center text-gray-700">
          {" "}
          <CalendarDaysIcon className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />{" "}
          <span className="font-medium mr-2">Joined:</span>{" "}
          <span className="text-gray-600">{formatDate(user.createdAt)}</span>{" "}
        </div>
        <div className="flex items-center text-gray-700 md:col-span-2">
          {" "}
          <CalendarDaysIcon className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />{" "}
          <span className="font-medium mr-2">Last Updated:</span>{" "}
          <span className="text-gray-600">{formatDate(user.updatedAt)}</span>{" "}
        </div>
      </div>
    </div>
  );
};

// Error Message Component
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="container mx-auto p-4 md:p-6 lg:p-8">
    <div
      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative shadow"
      role="alert"
    >
      <div className="flex items-center">
        {" "}
        <ExclamationTriangleIcon className="w-6 h-6 mr-3 text-red-500" />{" "}
        <div>
          {" "}
          <strong className="font-bold">Error!</strong>{" "}
          <span className="block sm:inline ml-1">{message}</span>{" "}
        </div>{" "}
      </div>
    </div>
  </div>
);

// --- Main Page Component (Client Component) ---

function UserDetailsContent() {
  // State variables
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter(); // Use router hook here
  const params = useParams(); // Use params hook here
  const UserIdParam = params?.UserId;
  const targetUserId = Array.isArray(UserIdParam)
    ? UserIdParam[0]
    : UserIdParam;

  // useEffect hook to fetch data on component mount
  useEffect(() => {
    if (!targetUserId) {
      setError("User ID not found in URL.");
      setLoading(false);
      return; // Exit if no UserId
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null); // Reset error before fetch

      try {
        const encodedUserId = encodeURIComponent(targetUserId);
        // Fetch from the relative API path
        const response = await fetch(
          `/api/adminData/UserDetails/${encodedUserId}`
        );

        if (!response.ok) {
          let errorMsg = `API Error: ${response.statusText}`;
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Unauthorized access.";
            toast.error(errorMsg + " Redirecting...");
            router.push("/adminData/LoginAdmin");
          } else if (response.status === 404) {
            errorMsg = `User with ID ${targetUserId} not found.`;
          } else {
            try {
              const errorData = await response.json();
              errorMsg = errorData.message || errorMsg;
            } catch (e) {
              /* Ignore */
            }
          }
          throw new Error(errorMsg);
        }

        const data: UserDetailsResponse = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
        } else {
          throw new Error(data.message || "Failed to fetch user details.");
        }
      } catch (err) {
        console.error("Fetch User Details Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
        // Optional: Show toast on fetch error
        // toast.error(`Error loading details: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false); // Ensure loading is set to false in all cases
      }
    };

    fetchData();
  }, [targetUserId, router]); // Add router to dependencies if used in error handling

  // Handler for the edit button click (passed down to UserDetailCard)
  const handleEditClick = () => {
    if (!user) return; // Should not happen if button is visible
    const encodedUserId = encodeURIComponent(user.UserId);
    router.push(`/adminData/EditUserProfile/${encodedUserId}`);
  };

  // --- Render Logic based on state ---

  if (loading) {
    return (
      <div>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <ErrorMessage message={error} />
        <div className="text-center mt-4">
          <button
            onClick={() => router.back()}
            className="bg-slate-200 mb-6 inline-flex items-center text-lg font-medium text-black hover:bg-slate-300 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back .
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    // Fallback if user data is null after loading without error
    return (
      <div>
        <ErrorMessage message="User data could not be loaded or user not found." />
        <div className="text-center mt-4">
          <button
            onClick={() => router.back()}
            className="bg-slate-200 mb-6 inline-flex items-center text-lg font-medium text-black hover:bg-slate-300 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back .
          </button>
        </div>
      </div>
    );
  }

  // Render content when data is loaded successfully
  return (
    <div>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <button
          onClick={() => router.back()}
          className="bg-slate-200 mb-6 inline-flex items-center text-lg font-medium text-black hover:bg-slate-300 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back .
        </button>

        {/* Render the UserDetailCard, passing the fetched user and the edit handler */}
        <UserDetailCard user={user} onEditClick={handleEditClick} />

        {/* Placeholder for other sections if needed */}
        {/* <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Other Details</h2>
            </div> */}
      </div>
    </div>
  );
}

// Wrap the client component in Suspense for better UX with useParams
export default function UserDetailsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="flex justify-center items-center min-h-screen">
            Loading User Details...
          </div>
        </div>
      }
    >
      <UserDetailsContent />
    </Suspense>
  );
}
