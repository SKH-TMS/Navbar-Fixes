"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";
import toast from "react-hot-toast";
export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { refreshAuth } = useContext(AuthContext);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Both email and password are required!");
      return;
    }

    try {
      const response = await fetch("../../api/adminData/login_admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await response.json();

      if (data.success) {
        await refreshAuth();
        toast.success("Admin Login successful!");
        router.push("ProfileAdmin");
      } else {
        setError(data.message || "Invalid email or password");
        toast.error(data.message || "Invalid email or password");
      }
    } catch (error) {
      setError("An error occurred during login. Please try again.");
      toast.error("An error occurred during login. Please try again.");
    }
  };

  return (
    <div>
      <div className="screenMiddleDiv">
        <div className="formDiv">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-center">Login as Admin</h2>

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}

            <div>
              <label htmlFor="email" className="formLabel">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="my-6">
              <label htmlFor="password" className="formLabel">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="formButton">
              Login
            </button>

            <div className="text-center mt-4">
              <a href="#" className="text-sm hover:underline">
                Forgot your password?
              </a>
            </div>
            <div className="text-center mt-4">
              <Link
                href="/adminData/LoginAdmin"
                className="buttonTiny text-white"
              >
                Register as Admin
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
