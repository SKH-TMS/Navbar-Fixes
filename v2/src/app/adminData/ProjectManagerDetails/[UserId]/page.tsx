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
  UsersIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
  CalendarDaysIcon,
  StarIcon, // Added back
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

interface TeamSummary {
  _id: string;
  teamId: string;
  teamName: string;
  members?: string[]; // Array of UserIds (for count)
  teamLeader?: string[]; // Array of UserIds (for count)
}

interface ProjectSummary {
  _id: string;
  ProjectId: string;
  title: string;
  description: string;
  status: string;
  createdAt: string; // Or Date
}

interface PMDetailsResponse {
  success: boolean;
  pmDetails?: UserProfile;
  createdTeams?: TeamSummary[];
  unassignedProjects?: ProjectSummary[];
  message?: string;
}

// --- Helper Components (Defined within the Client Component file) ---

// Skeleton Loader
const PMDetailsSkeleton: React.FC = () => (
  <div className="animate-pulse">
    {/* Profile Skeleton */}
    <div className="bg-white shadow-lg rounded-lg p-6 mb-10 border border-gray-200">
      <div className="flex flex-col md:flex-row items-center md:items-start">
        <div className="w-36 h-36 bg-gray-300 rounded-full mb-6 md:mb-0 md:mr-8"></div>
        <div className="flex-1 w-full">
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-5 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-2/5"></div>
          </div>
          <div className="h-9 bg-gray-300 rounded w-1/4 mt-6"></div>{" "}
          {/* Edit button placeholder */}
        </div>
      </div>
    </div>
    {/* Teams Skeleton */}
    <div className="h-7 bg-gray-200 rounded w-1/3 mb-5"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-lg shadow border border-gray-200 h-[120px]"
        >
          {" "}
          {/* Fixed height */}
          <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4 ml-auto"></div>{" "}
          {/* Link placeholder */}
        </div>
      ))}
    </div>
    {/* Projects Skeleton */}
    <div className="h-7 bg-gray-200 rounded w-1/3 mb-5"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-lg shadow border border-gray-200"
        >
          <div className="h-6 bg-gray-300 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6 mb-4"></div>
          <div className="h-5 bg-gray-300 rounded w-1/4"></div>{" "}
          {/* Status placeholder */}
        </div>
      ))}
    </div>
  </div>
);

// PM Profile Card - Needs useRouter
const PMProfileCard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const router = useRouter(); // Use router hook here
  const handleEditClick = () => {
    const encodedUserId = encodeURIComponent(user.UserId);
    router.push(`/adminData/EditUserProfile/${encodedUserId}`);
  };
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-200 shadow-xl rounded-lg p-6 md:p-8 mb-10 border border-gray-200 overflow-hidden">
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
              <PencilSquareIcon className="w-4 h-4 mr-2" /> Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Team Card - Needs useRouter
const TeamSummaryCard: React.FC<{ team: TeamSummary }> = ({ team }) => {
  const router = useRouter(); // Use router hook here
  const memberCount = team.members?.length ?? 0;
  const leaderCount = team.teamLeader?.length ?? 0;

  const handleViewTeamDetails = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const encodedTeamId = encodeURIComponent(team.teamId);
    router.push(`/adminData/TeamDetails/${encodedTeamId}`);
  };

  return (
    <div
      className="bg-gradient-to-r from-slate-200 to-slate-50 border-gray-200 rounded-lg shadow-md p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
      onClick={() => handleViewTeamDetails()}
      title={`View details for ${team.teamName}`}
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">
          {team.teamName}
        </h3>
        <p className="text-xs text-gray-500 mb-3">ID: {team.teamId}</p>
        <div className="text-sm text-gray-600 space-y-1 border-t border-gray-100 pt-2 mt-2">
          <div className="flex items-center">
            <UsersIcon className="w-4 h-4 mr-1.5 text-gray-400" />
            <span>Members: {memberCount}</span>
          </div>
          <div className="flex items-center">
            <StarIcon className="w-4 h-4 mr-1.5 text-gray-400" />
            <span>Leaders: {leaderCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Unassigned Project Card - Needs useRouter if clickable
const UnassignedProjectCard: React.FC<{ project: ProjectSummary }> = ({
  project,
}) => {
  const router = useRouter(); // Use router hook here if needed
  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          color: "bg-green-100 text-green-800",
          icon: <CheckCircleIcon className="w-4 h-4 mr-1" />,
        };
      case "in progress":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: <ClockIcon className="w-4 h-4 mr-1" />,
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: <ClockIcon className="w-4 h-4 mr-1" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: <PaperClipIcon className="w-4 h-4 mr-1" />,
        };
    }
  };
  const statusBadge = getStatusBadge(project.status);
  const createdDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString()
    : "N/A";

  // const handleProjectClick = () => {
  //   console.log(`Clicked unassigned project: ${project.ProjectId}`);
  //   // Example Navigation: Uncomment and adjust if needed
  //   // const encodedProjectId = encodeURIComponent(project.ProjectId);
  //   // router.push(`/adminData/ProjectTasksDetails/${encodedProjectId}`);
  // };

  return (
    <div
      className="bg-gradient-to-r from-yellow-50 to-slate-50 p-5 rounded-lg shadow border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 ease-in-out cursor-pointer" // Added cursor-pointer if clickable
      //onClick={handleProjectClick} // Add onClick if clickable
      //title={`View details for ${project.title}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
          {project.title}
        </h3>
        <span
          className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBadge.color}`}
        >
          {statusBadge.icon}
          {project.status || "N/A"}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">ID: {project.ProjectId}</p>
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {project.description}
      </p>
      <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-2 flex items-center">
        <CalendarDaysIcon className="w-4 h-4 mr-1 text-gray-400" />
        <span>Created: {createdDate}</span>
      </div>
    </div>
  );
};

// Error Message Component (can remain separate or be included)
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

// --- Main Page Component ---

function ProjectManagerDetailsContent() {
  // Reintroduce state variables
  const [pmDetails, setPmDetails] = useState<UserProfile | null>(null);
  const [createdTeams, setCreatedTeams] = useState<TeamSummary[] | null>(null);
  const [unassignedProjects, setUnassignedProjects] = useState<
    ProjectSummary[] | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter(); // Use router hook here
  const params = useParams(); // Use params hook here
  const UserIdParam = params?.UserId;
  console.log(UserIdParam);
  const targetUserId = Array.isArray(UserIdParam)
    ? UserIdParam[0]
    : UserIdParam;

  // Reintroduce useEffect for data fetching
  useEffect(() => {
    if (!targetUserId) {
      setError("User ID not found in URL.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedUserId = encodeURIComponent(targetUserId);
        // Use relative path for client-side fetch
        const response = await fetch(
          `/api/adminData/ProjectManagerDetails/${encodedUserId}`
        );

        if (!response.ok) {
          let errorMsg = "Failed to fetch details.";
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Unauthorized access.";
            router.push("/adminData/LoginAdmin");
          } else if (response.status === 404) {
            errorMsg = `Project Manager with ID ${targetUserId} not found.`;
          } else {
            try {
              const d = await response.json();
              errorMsg = d.message || errorMsg;
            } catch (e) {}
          }
          throw new Error(errorMsg);
        }

        const data: PMDetailsResponse = await response.json();
        if (data.success) {
          setPmDetails(data.pmDetails || null);
          setCreatedTeams(data.createdTeams || []);
          setUnassignedProjects(data.unassignedProjects || []);
        } else {
          throw new Error(data.message || "Could not retrieve details.");
        }
      } catch (err) {
        console.error("Fetch PM Details Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUserId, router]); // Add router to dependency array if used in error handling redirect

  // --- Render Logic (using state) ---

  if (loading) {
    return (
      <div>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <PMDetailsSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <ErrorMessage message={error} />
        {/* Add a back button for errors */}
        <div className="text-center mt-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!pmDetails) {
    // This case handles successful fetch but no data (e.g., user wasn't a PM)
    return (
      <div>
        <ErrorMessage message="Project Manager data could not be loaded or user not found." />
        <div className="text-center mt-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="bg-slate-200 mb-6 inline-flex items-center text-lg font-medium text-black hover:bg-slate-300 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
          </button>
        </div>
      </div>
    );
  }

  // Render main content when data is available
  return (
    <div>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="bg-slate-200 mb-6 inline-flex items-center text-lg font-medium text-black hover:bg-slate-300 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
        </button>

        {/* PM Profile Section */}
        <PMProfileCard user={pmDetails} />

        {/* Created Teams Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center border-b pb-2">
            <UsersIcon className="w-6 h-6 mr-2 text-blue-600 flex-shrink-0" />{" "}
            Teams Created
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({createdTeams?.length ?? 0})
            </span>
          </h2>
          {createdTeams && createdTeams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {createdTeams.map((team) => (
                <TeamSummaryCard key={team.teamId} team={team} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-gray-100 rounded-lg border border-dashed border-gray-300">
              <UsersIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 italic">
                This Project Manager has not created any teams.
              </p>
            </div>
          )}
        </section>

        {/* Unassigned Projects Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center border-b pb-2">
            <BriefcaseIcon className="w-6 h-6 mr-2 text-green-600 flex-shrink-0" />{" "}
            Unassigned Projects Created
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({unassignedProjects?.length ?? 0})
            </span>
          </h2>
          {unassignedProjects && unassignedProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {unassignedProjects.map((project) => (
                <UnassignedProjectCard
                  key={project.ProjectId}
                  project={project}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-gray-100 rounded-lg border border-dashed border-gray-300">
              <BriefcaseIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 italic">
                No unassigned projects created by this Project Manager found.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Wrap in Suspense for useParams
export default function ProjectManagerDetailsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="flex justify-center items-center min-h-screen">
            Loading Project Manager Details...
          </div>
        </div>
      }
    >
      <ProjectManagerDetailsContent />
    </Suspense>
  );
}
