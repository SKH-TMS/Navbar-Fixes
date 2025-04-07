"use client";

import Link from "next/link";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthContext } from "@/context/AuthContext"; // Adjust path if needed

export default function NavbarUser() {
  const { userStatus, refreshAuth } = useContext(AuthContext);
  const router = useRouter();

  const isAuthenticatedUser =
    userStatus?.success && userStatus?.User ? true : false;
  const isAuthenticatedPM =
    userStatus?.success && userStatus?.ProjectManager ? true : false;

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
    <nav className="bg-blue-900 flex justify-between ">
      <div>
        <Link href="/">Home</Link>
      </div>
      <div>
        {!isAuthenticatedUser && !isAuthenticatedPM ? (
          <>
            <Link href="/userData/RegisterUser">Register</Link>
            <Link href="/userData/LoginUser">Login</Link>
          </>
        ) : (
          <>
            {isAuthenticatedUser && !isAuthenticatedPM && (
              <Link href="/userData/ProfileUser">Profile</Link>
            )}
            {isAuthenticatedPM && !isAuthenticatedUser && (
              <Link href="/projectManagerData/ProfileProjectManager">
                Profile
              </Link>
            )}
            <a className="cursor-pointer" onClick={handleLogout}>
              Logout
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
