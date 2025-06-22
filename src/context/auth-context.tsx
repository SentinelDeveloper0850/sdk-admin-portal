/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";



import axios from "axios";



import type { IUser } from "@/app/models/user.schema";


/* eslint-disable @typescript-eslint/no-explicit-any */


/* eslint-disable @typescript-eslint/no-explicit-any */

// Define the shape of the context
interface AuthContextType {
  user: IUser | null;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  userId?: string;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth-token="))
          ?.split("=")[1];

        if (!token) {
          setLoading(false);
          return;
        }

        // Only fetch if user is not already set (prevents overwrite after login)
        if (!user) {
          const response = await axios.get("/api/auth/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          setUser(response.data.user);
        }
      } catch (error: any) {
        console.error("Error fetching user details:", error);
        if (error.response?.status === 401) {
          document.cookie =
            "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
          setUser(null);
          router.push("/auth/signin");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [user, router]);
  

  // Show loading spinner until user details are fetched
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, userId: user?._id?.toString() }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};