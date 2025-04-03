"use client";

import Link from "next/link";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthContext } from "@/context/AuthContext";

export default function NavbarTeam() {
  const { userStatus, refreshAuth } = useContext(AuthContext);
  const router = useRouter();

  // Determine authentication status from the global state
  const isAuthenticated =
    userStatus?.success &&
    (userStatus?.TeamMember ||
      userStatus?.TeamLeader ||
      userStatus?.TeamMember_and_TeamLeader);
  const isAuthenticatedLeader = userStatus?.TeamLeader;
  const isAuthenticatedMember = userStatus?.TeamMember;
  const isAuthenticatedTML = userStatus?.TeamMember_and_TeamLeader;

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "GET" });
      const data = await response.json();
      if (!data.success) {
        console.error("Error logging out:", data.message);
      }
      toast.success("Logout Successfully");
      await refreshAuth();
    } catch (error) {
      console.error("Error during logout:", error);
    }
    router.push("/userData/LoginUser");
  };

  return (
    <nav className="bg-red-300 flex justify-between ">
      <div>
        <Link href="/">Home</Link>
      </div>
      <div>
        {!isAuthenticated ? (
          <>
            <Link href="/userData/RegisterUser">Register</Link>
            <Link href="/userData/LoginUser">Login</Link>
          </>
        ) : (
          <>
            <Link href="/teamData/ProfileTeam">Profile</Link>
            {isAuthenticatedMember && (
              <Link href="/teamData/teamMemberData/ManageTasks">
                PerformTasks
              </Link>
            )}
            {isAuthenticatedLeader && (
              <Link href="/teamData/teamLeaderData/ShowTeams">ManageTeam</Link>
            )}
            {isAuthenticatedTML && (
              <>
                <Link href="/teamData/teamMemberData/ManageTasks">
                  PerformTasks
                </Link>
                <Link href="/teamData/teamLeaderData/ShowTeams">
                  ManageTeam
                </Link>
              </>
            )}
            <a className="cursor-pointer ml-4" onClick={handleLogout}>
              Logout
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
