"use client"; // Mark this as a Client Component

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation"; // Use useParams for client components
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  UsersIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon, // Icon for the link
} from "@heroicons/react/24/outline";

// --- Interface Definitions ---
interface UserProfile {
  UserId: string;
  email: string;
  firstname: string;
  lastname: string;
  contact?: string;
  profilepic: string;
  userType: string;
}

interface TeamDetails {
  _id: string;
  teamId: string;
  teamName: string;
  members?: string[];
  teamLeader?: string[];
}

// --- Enhanced Helper Components ---

// Skeleton Loader for Profile Card
const ProfileSkeleton: React.FC = () => (
  <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border border-gray-200 animate-pulse">
    <div className="flex flex-col items-center sm:flex-row sm:items-start">
      <div className="mb-4 sm:mb-0 sm:mr-6">
        <div className="w-32 h-32 bg-gray-300 rounded-full"></div>
      </div>
      <div className="flex-1 w-full">
        <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-2/5"></div>
      </div>
    </div>
  </div>
);

// Skeleton Loader for Team Card
const TeamCardSkeleton: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 animate-pulse">
    <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
  </div>
);

// Enhanced User Profile Card - WITH EDIT BUTTON FUNCTIONALITY
const UserProfileCard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const router = useRouter();

  const handleEditClick = () => {
    const encodedUserId = encodeURIComponent(user.UserId);
    router.push(`/adminData/EditUserProfile/${encodedUserId}`);
  };

  return (
    <div className="bg-gradient-to-r from-white to-gray-200 shadow-xl rounded-lg p-6 md:p-8 mb-10 border border-gray-200 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center md:items-start">
        <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8 relative">
          <Image
            src={user.profilepic || "/default-avatar.png"}
            alt={`${user.firstname} ${user.lastname}'s profile`}
            width={150}
            height={150}
            className="rounded-full object-cover border-4 border-indigo-200 shadow-md"
            priority
          />
          <span className="absolute bottom-1 right-1 bg-green-500 border-2 border-white rounded-full p-1.5"></span>
        </div>
        <div className="text-center md:text-left flex-grow">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-1">
            {user.firstname} {user.lastname}
          </h1>
          <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
            {user.userType}
          </span>
          <div className="space-y-3 text-gray-600">
            <div className="flex items-center justify-center md:justify-start">
              <EnvelopeIcon className="w-5 h-5 mr-2 text-gray-400" />
              <a
                href={`mailto:${user.email}`}
                className="hover:text-indigo-600"
              >
                {user.email}
              </a>
            </div>
            <div className="flex items-center justify-center md:justify-start">
              <IdentificationIcon className="w-5 h-5 mr-2 text-gray-400" />
              <span>User ID: {user.UserId}</span>
            </div>
            {user.contact && (
              <div className="flex items-center justify-center md:justify-start">
                <PhoneIcon className="w-5 h-5 mr-2 text-gray-400" />
                <span>{user.contact}</span>
              </div>
            )}
          </div>
          <div className="mt-6 text-center md:text-left">
            <button
              onClick={handleEditClick}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm transition duration-150 ease-in-out"
            >
              <PencilSquareIcon className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Team Card - WITH NAVIGATION
const TeamCard: React.FC<{ team: TeamDetails }> = ({ team }) => {
  const router = useRouter(); // Initialize router inside TeamCard
  const memberCount = team.members?.length ?? "?";
  const leaderCount = team.teamLeader?.length ?? "?";

  // Function to handle navigation to the specific team details page
  const handleViewTeamDetails = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click if link is clicked directly
    const encodedTeamId = encodeURIComponent(team.teamId);
    // Navigate to the new dynamic route
    router.push(`/adminData/TeamDetails/${encodedTeamId}`);
  };

  // Optional: Handle click on the whole card
  const handleCardClick = () => {
    handleViewTeamDetails({ stopPropagation: () => {} } as React.MouseEvent); // Simulate event or just call directly
  };

  return (
    <div
      className="bg-gradient-to-r from-blue-100 to-blue-50 border-gray-200 rounded-lg shadow-md p-5 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between cursor-pointer group"
      onClick={handleCardClick} // Make the whole card clickable
      title={`View details for ${team.teamName}`}
    >
      <div>
        <h3 className="text-xl font-semibold text-indigo-700 mb-2 group-hover:text-indigo-800 transition-colors">
          {team.teamName}
        </h3>
        <p className="text-sm text-gray-500 mb-4">ID: {team.teamId}</p>
        <div className="text-sm text-gray-600 space-y-1 border-t pt-3 mt-3">
          <div className="flex items-center">
            <UsersIcon className="w-4 h-4 mr-1.5 text-gray-400" />
            <span>Members: {memberCount}</span>
          </div>
          <div className="flex items-center">
            <UserCircleIcon className="w-4 h-4 mr-1.5 text-gray-400" />
            <span>Leaders: {leaderCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Team Grid
const TeamGrid: React.FC<{
  title: string;
  teams: TeamDetails[] | null;
  isLoading: boolean;
}> = ({ title, teams, isLoading }) => {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-5 border-b-2 border-indigo-200 pb-2">
        {title}
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      ) : teams && teams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => (
            // TeamCard now handles its own navigation
            <TeamCard key={team.teamId || team._id} team={team} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 px-4 bg-gray-100 rounded-lg border border-dashed border-gray-300">
          <BriefcaseIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500 italic">
            No teams found in this category for this user.
          </p>
        </div>
      )}
    </div>
  );
};

// Enhanced Error Message Component
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="container mx-auto p-4 md:p-6 lg:p-8">
    <div
      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative shadow"
      role="alert"
    >
      <div className="flex items-center">
        <ExclamationTriangleIcon className="w-6 h-6 mr-3 text-red-500" />
        <div>
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-1">{message}</span>
        </div>
      </div>
    </div>
  </div>
);

// --- Main Page Component (Client Component) ---

function ParticipantDetailsContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [teamsLed, setTeamsLed] = useState<TeamDetails[] | null>(null);
  const [teamsMemberOf, setTeamsMemberOf] = useState<TeamDetails[] | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const UserIdParam = params?.UserId;
  const UserId = Array.isArray(UserIdParam) ? UserIdParam[0] : UserIdParam;

  // useEffect remains the same - fetches user and their associated team lists
  useEffect(() => {
    if (!UserId) {
      setError("User ID parameter is missing from URL.");
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedUserId = encodeURIComponent(UserId);
        const response = await fetch(
          `/api/adminData/ParticipantDetails/${encodedUserId}`
        );
        if (!response.ok) {
          /* ... error handling ... */
          let errorMsg = `API Error (${response.status}): ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
            if (response.status === 404) {
              errorMsg = `User with ID ${decodeURIComponent(
                UserId
              )} not found.`;
            } else if (response.status === 403) {
              errorMsg = "Unautherized Access";
              router.push("/adminData/LoginAdmin");
            }
          } catch (e) {
            /* Ignore */
          }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setTeamsLed(data.teamsLed || []);
          setTeamsMemberOf(data.teamsMemberOf || []);
        } else {
          throw new Error(
            data.message || "Failed to fetch participant details."
          );
        }
      } catch (err) {
        /* ... error handling ... */
        console.error("Fetch Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [UserId]);

  // --- Render Logic ---
  if (loading) {
    /* ... Skeleton rendering ... */
    return (
      <div>
        <div className="py-9">
          {/* Back Button */}

          <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <button
              onClick={() => router.back()}
              className="bg-slate-200 mb-6 inline-flex items-center text-lg font-medium text-black hover:bg-slate-300 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Participant Details
            </h1>
            <ProfileSkeleton />
            <TeamGrid title="Teams Leader of" teams={null} isLoading={true} />
            <TeamGrid title="Member of" teams={null} isLoading={true} />
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    /* ... Error rendering ... */
    return (
      <div>
        <ErrorMessage message={error} />
      </div>
    );
  }
  if (!user) {
    /* ... No user rendering ... */
    return (
      <div>
        <ErrorMessage message="Participant data could not be loaded or user not found." />
      </div>
    );
  }

  return (
    <div>
      <div className="py-9">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen shadow-2xl">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="bg-slate-200 mb-6 inline-flex items-center text-lg font-medium text-black hover:bg-slate-300 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Participant Details
          </h1>
          <UserProfileCard user={user} />
          {/* TeamGrids now contain TeamCards that handle their own navigation */}
          <TeamGrid
            title="Teams Leader of"
            teams={teamsLed}
            isLoading={false}
          />
          <TeamGrid title="Member of" teams={teamsMemberOf} isLoading={false} />
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense
export default function ParticipantDetailsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="flex justify-center items-center min-h-screen">
            Loading page...
          </div>
        </div>
      }
    >
      <ParticipantDetailsContent />
    </Suspense>
  );
}
