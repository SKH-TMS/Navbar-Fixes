"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isAuthenticatedPM, setIsAuthenticatedPM] = useState(false);
  const [isAuthenticatedTML, setIsAuthenticatedTML] = useState(false);

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const response = await fetch("/api/auth/UserStatus", {
          method: "POST",
        });

        const data = await response.json();
        console.log("User data:", data);

        if (data.success) {
          if (data.TML) {
            setIsAuthenticatedTML(true);
          } else if (data.ProjectManager) {
            setIsAuthenticatedPM(true);
          } else {
            setIsAuthenticatedTML(false);
            setIsAuthenticatedPM(false);
          }
        } else {
          console.error("Error authenticating User");
        }
      } catch (error) {
        console.error("Error occured authenticating User:", error);
      }
    };

    fetchUserStatus();
  }, []);

  return (
    <nav className="flex justify-between">
      <div>
        <Link href="/">Home</Link>
      </div>
      <div>
        {!isAuthenticatedPM ? (
          <>
            {!isAuthenticatedTML ? (
              <>
                <Link href="/userData/ProfileUser">User</Link>
              </>
            ) : (
              <>
                <Link href="/teamData/ProfileTeam">User</Link>
              </>
            )}
          </>
        ) : (
          <>
            <Link href="/projectManagerData/ProfileProjectManager">User</Link>
          </>
        )}
        <Link href="/adminData/ProfileAdmin">Admin</Link>
      </div>
    </nav>
  );
}
