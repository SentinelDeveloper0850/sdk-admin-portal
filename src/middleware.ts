import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { jwtVerify } from "jose";

// Check for the JWT secret in the environment variables
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables.");
}

const JWT_SECRET = process.env.JWT_SECRET;

export function middleware(request: NextRequest) {
  // Define routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/trips",
    "/vehicles",
    "/drivers",
    "/users",
  ];

  // Check if the current route is protected
  if (
    protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  ) {
    const token = request.cookies.get("auth-token")?.value;

    // If no token is present, redirect to the login page
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    try {
      // Verify the token
      jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Invalid token:", err.message);
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  return NextResponse.next(); // Allow the request to proceed
}

export const config = {
  matcher: [
    "/dashboard",
    "/transactions/:path*",
    "/users/:path*",
  ], // Apply middleware to specific routes
};
