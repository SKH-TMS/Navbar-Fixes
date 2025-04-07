"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation"; // Import useRouter here as well
import Image from "next/image";
import {
  ArrowLeftIcon,
  UserGroupIcon,
  UserCircleIcon,
  HashtagIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  StarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon, // Added for mailto links
  IdentificationIcon, // Added for consistency
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

// --- Interface Definitions ---
interface MemberProfile {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  profilepic: string;
}

interface ProjectDetails {
  ProjectId: string;
  title: string;
  description: string;
  status: string;
  createdAt: string; // Or Date
}

interface AssignedProject {
  _id: string; // Assignment Log ID
  AssignProjectId: string;
  projectId: ProjectDetails; // Populated project details
  assignedBy: string | { UserId: string; firstname: string; lastname: string };
  deadline: string; // Or Date
  createdAt: string; // Or Date
}

interface PopulatedTeamDetails {
  _id: string;
  teamId: string;
  teamName: string;
  members: MemberProfile[];
  teamLeader: MemberProfile[];
  createdBy?: string | { UserId: string; firstname: string; lastname: string };
  createdAt: string;
  updatedAt: string;
}

interface TeamDetailsResponse {
  success: boolean;
  teamDetails?: PopulatedTeamDetails;
  assignedProjects?: AssignedProject[];
  message?: string;
}

// --- Enhanced Helper Components ---

// Skeleton Loader for Team Details Page
const TeamDetailsSkeleton: React.FC = () => (
  <div className="animate-pulse">
    {/* Title Skeleton */}
    <div className="h-9 bg-gray-200 rounded w-3/5 mb-4"></div>
    <div className="h-5 bg-gray-200 rounded w-1/3 mb-8"></div>

    {/* Leader Skeleton */}
    <div className="h-7 bg-gray-200 rounded w-1/4 mb-5"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center space-x-3 h-[100px]">
        {" "}
        {/* Adjusted height */}
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/3"></div>{" "}
          {/* Placeholder for ID */}
        </div>
      </div>
    </div>

    {/* Members Skeleton */}
    <div className="h-7 bg-gray-200 rounded w-1/3 mb-5"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center space-x-3 h-[100px]"
        >
          {" "}
          {/* Adjusted height */}
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/3"></div>{" "}
            {/* Placeholder for ID */}
          </div>
        </div>
      ))}
    </div>

    {/* Projects Skeleton */}
    <div className="h-7 bg-gray-200 rounded w-1/3 mb-5"></div>
    <div className="space-y-5">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-lg shadow border border-gray-200"
        >
          <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="flex justify-between border-t pt-3 mt-3">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Enhanced Member Card Component - WITH NAVIGATION
const MemberCard: React.FC<{ member: MemberProfile }> = ({ member }) => {
  const router = useRouter(); // Initialize router

  const handleNavigateToDetails = () => {
    const encodedUserId = encodeURIComponent(member.UserId);
    // Navigate to the participant details page using UserId
    router.push(`/adminData/ParticipantDetails/${encodedUserId}`);
  };

  return (
    <div
      className="bg-gradient-to-r from-blue-100 to-white p-4 rounded-lg shadow border border-gray-200 flex items-center space-x-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200 ease-in-out cursor-pointer" // Added cursor-pointer
      onClick={handleNavigateToDetails} // Add onClick handler
      title={`View details for ${member.firstname} ${member.lastname}`}
    >
      <Image
        src={member.profilepic || "/default-avatar.png"}
        alt={`${member.firstname} ${member.lastname}`}
        width={52} // Slightly larger
        height={52}
        className="rounded-full object-cover flex-shrink-0 border border-gray-200"
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-base font-semibold text-gray-800 truncate"
          title={`${member.firstname} ${member.lastname}`}
        >
          {member.firstname} {member.lastname}
        </p>
        {/* Email is still clickable for mailto: */}
        <a
          href={`mailto:${member.email}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 hover:underline truncate block"
          title={member.email}
        >
          {member.email}
        </a>
        <p className="text-xs text-gray-400 truncate mt-1">
          ID: {member.UserId}
        </p>
      </div>
    </div>
  );
};

// Enhanced Leader Card Component - WITH NAVIGATION
const LeaderCard: React.FC<{ leader: MemberProfile }> = ({ leader }) => {
  const router = useRouter(); // Initialize router

  const handleNavigateToDetails = () => {
    const encodedUserId = encodeURIComponent(leader.UserId);
    // Navigate to the participant details page using UserId
    router.push(`/adminData/ParticipantDetails/${encodedUserId}`);
  };

  return (
    <div
      className="bg-gradient-to-r from-yellow-50 to-white p-4 rounded-lg shadow-md border-l-4 border-yellow-400 flex items-center space-x-4 hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer" // Added cursor-pointer
      onClick={handleNavigateToDetails} // Add onClick handler
      title={`View details for ${leader.firstname} ${leader.lastname}`}
    >
      <Image
        src={leader.profilepic || "/default-avatar.png"}
        alt={`${leader.firstname} ${leader.lastname} (Leader)`}
        width={52}
        height={52}
        className="rounded-full object-cover flex-shrink-0 border-2 border-yellow-300"
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-base font-semibold text-gray-900 truncate"
          title={`${leader.firstname} ${leader.lastname}`}
        >
          {leader.firstname} {leader.lastname}
        </p>
        {/* Email is still clickable for mailto: */}
        <a
          href={`mailto:${leader.email}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 hover:underline truncate block"
          title={leader.email}
        >
          {leader.email}
        </a>
        <p className="text-xs text-gray-500 truncate mt-1">
          ID: {leader.UserId}
        </p>
      </div>
      <StarIcon
        className="w-6 h-6 text-yellow-500 flex-shrink-0"
        title="Team Leader"
      />
    </div>
  );
};

// Enhanced Assigned Project Card Component
const ProjectCard: React.FC<{ assignment: AssignedProject }> = ({
  assignment,
}) => {
  const router = useRouter();
  const handleNavigateToDetails = () => {
    const encodedProjectId = encodeURIComponent(assignment.projectId.ProjectId);
    // Navigate to the participant details page using UserId
    router.push(`/adminData/ProjectTasksDetails/${encodedProjectId}`);
  };
  const project = assignment.projectId;
  const deadlineDate = assignment.deadline
    ? new Date(assignment.deadline).toLocaleDateString()
    : "N/A";
  const assignedDate = assignment.createdAt
    ? new Date(assignment.createdAt).toLocaleDateString()
    : "N/A";

  // Helper to get status color and icon
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
          icon: <BriefcaseIcon className="w-4 h-4 mr-1" />,
        };
    }
  };
  const statusBadge = getStatusBadge(project?.status);

  return (
    <div
      className="bg-gradient-to-r from-slate-200 to-white p-5 rounded-lg shadow border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 ease-in-out cursor-pointer "
      onClick={handleNavigateToDetails}
      title={`View details for ${assignment.projectId.title}`}
    >
      <h4 className="text-lg font-semibold text-indigo-700 mb-1">
        {project?.title || "Project Title Missing"}
      </h4>
      <p className="text-xs text-gray-500 mb-3">
        Project ID: {project?.ProjectId || "N/A"}
      </p>
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
        {project?.description || "No description."}
      </p>
      <div className="text-sm text-gray-600 space-y-2 border-t border-gray-100 pt-4 mt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span
            className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBadge.color}`}
          >
            {statusBadge.icon}
            {project?.status || "N/A"}
          </span>
          <div className="flex items-center text-xs text-gray-500">
            <CalendarDaysIcon className="w-4 h-4 mr-1 text-gray-400" />
            <span className="font-medium mr-1">Deadline:</span> {deadlineDate}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <CalendarDaysIcon className="w-4 h-4 mr-1 text-gray-400" />
            <span className="font-medium mr-1">Assigned:</span> {assignedDate}
          </div>
        </div>
      </div>
    </div>
  );
};

// Error Message Component (reusable)
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

function ParticipantTeamDetailsContent() {
  const [teamDetails, setTeamDetails] = useState<PopulatedTeamDetails | null>(
    null
  );
  const [assignedProjects, setAssignedProjects] = useState<
    AssignedProject[] | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const teamIdParam = params?.teamId;
  const targetTeamId = Array.isArray(teamIdParam)
    ? teamIdParam[0]
    : teamIdParam;

  useEffect(() => {
    if (!targetTeamId) {
      setError("Team ID not found in URL.");
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedTeamId = encodeURIComponent(targetTeamId);
        const response = await fetch(
          `/api/adminData/teamDetails/${encodedTeamId}`
        );
        if (!response.ok) {
          let errorMsg = "Failed to fetch team details.";
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Unauthorized access.";
            router.push("/adminData/LoginAdmin");
          } else if (response.status === 404)
            errorMsg = `Team with ID ${targetTeamId} not found.`;
          else {
            try {
              const d = await response.json();
              errorMsg = d.message || errorMsg;
            } catch (e) {}
          }
          throw new Error(errorMsg);
        }
        const data: TeamDetailsResponse = await response.json();
        if (data.success) {
          setTeamDetails(data.teamDetails || null);
          setAssignedProjects(data.assignedProjects || []);
        } else {
          throw new Error(data.message || "Could not retrieve team details.");
        }
      } catch (err) {
        console.error("Fetch Team Details Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetTeamId]);

  // --- Render Logic ---

  if (loading) {
    return (
      <div>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <TeamDetailsSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!teamDetails) {
    return (
      <div>
        <ErrorMessage message="Team data could not be loaded or team not found." />
      </div>
    );
  }

  // Filter out leaders from the main members list for display purposes
  const leaderIds = new Set(
    teamDetails.teamLeader?.map((leader) => leader.UserId) || []
  );
  const regularMembers =
    teamDetails.members?.filter((member) => !leaderIds.has(member.UserId)) ||
    [];

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

        {/* Team Header Card */}
        <header className="mb-10 p-6 bg-gradient-to-r from-gray-50 to-gray-200  rounded-xl shadow-lg border border-gray-200">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {teamDetails.teamName}
          </h1>
          <p className="text-base text-gray-500 mb-3">
            Team ID: {teamDetails.teamId}
          </p>
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 mt-3 flex items-center justify-between flex-wrap gap-2">
            <span>
              Created: {new Date(teamDetails.createdAt).toLocaleDateString()}
            </span>
            <span>
              Last Updated:{" "}
              {new Date(teamDetails.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </header>

        {/* Team Leaders Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center border-b pb-2">
            <StarIcon className="w-6 h-6 mr-2 text-yellow-500 flex-shrink-0" />{" "}
            Team Leader(s)
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({teamDetails.teamLeader?.length ?? 0})
            </span>
          </h2>
          {teamDetails.teamLeader && teamDetails.teamLeader.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* LeaderCard now handles navigation */}
              {teamDetails.teamLeader.map((leader) => (
                <LeaderCard key={leader.UserId} leader={leader} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-yellow-50 rounded-lg border border-dashed border-yellow-200 text-yellow-700">
              <UserCircleIcon className="w-10 h-10 mx-auto text-yellow-400 mb-2" />
              <p className="italic">No designated leader found.</p>
            </div>
          )}
        </section>

        {/* Team Members Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center border-b pb-2">
            <UsersIcon className="w-6 h-6 mr-2 text-indigo-600 flex-shrink-0" />{" "}
            Team Members
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({regularMembers.length})
            </span>
          </h2>
          {regularMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* MemberCard now handles navigation */}
              {regularMembers.map((member) => (
                <MemberCard key={member.UserId} member={member} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-gray-100 rounded-lg border border-dashed border-gray-300">
              <UsersIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 italic">
                No other members in this team.
              </p>
            </div>
          )}
        </section>

        {/* Assigned Projects Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center border-b pb-2">
            <ClipboardDocumentListIcon className="w-6 h-6 mr-2 text-indigo-600 flex-shrink-0" />{" "}
            Assigned Projects
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({assignedProjects?.length ?? 0})
            </span>
          </h2>
          {assignedProjects && assignedProjects.length > 0 ? (
            <div className="space-y-5">
              {assignedProjects.map((assignment) =>
                // Add null check for projectId before accessing its properties
                assignment.projectId ? (
                  <ProjectCard key={assignment._id} assignment={assignment} />
                ) : (
                  <div
                    key={assignment._id}
                    className="text-sm text-red-500 italic p-4 bg-red-50 border border-red-200 rounded"
                  >
                    Error: Project data missing for assignment{" "}
                    {assignment.AssignProjectId}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-gray-100 rounded-lg border border-dashed border-gray-300">
              <BriefcaseIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 italic">
                No projects currently assigned.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Wrap in Suspense
export default function ParticipantTeamDetailsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="flex justify-center items-center min-h-screen">
            Loading Team Details...
          </div>
        </div>
      }
    >
      <ParticipantTeamDetailsContent />
    </Suspense>
  );
}
