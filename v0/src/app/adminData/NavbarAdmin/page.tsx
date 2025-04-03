"use client";

import Link from "next/link";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthContext } from "@/context/AuthContext";

export default function NavbarAdmin() {
  const { userStatus, refreshAuth } = useContext(AuthContext);
  const router = useRouter();

  const isAuthenticated = userStatus?.success && userStatus?.Admin;

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "GET" });
      const data = await response.json();
      if (!data.success) {
        console.error("Error logging out:", data.message);
      }
      toast.success("Logout Successfully");
      await refreshAuth(); // Update the global auth state
    } catch (error) {
      console.error("Error during logout:", error);
    }
    router.push("/adminData/LoginAdmin");
  };

  return (
    <nav className="bg-teal-900 flex justify-between ">
      <div>
        <Link href="/">Home</Link>
      </div>
      <div>
        {!isAuthenticated ? (
          <>
            <Link href="/adminData/RegisterAdmin">Admin Register</Link>
            <Link href="/adminData/LoginAdmin">Admin Login</Link>
          </>
        ) : (
          <>
            <Link href="/adminData/ProfileAdmin">Admin Profile</Link>
            <a className="cursor-pointer" onClick={handleLogout}>
              Logout
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
