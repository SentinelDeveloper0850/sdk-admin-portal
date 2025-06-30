import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables.");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const protectedRoutes = [
    "/dashboard",
    "/transactions",
    "/policies",
    "/prepaid-societies",
    "/daily-activity",
    "/claims",
    "/users",
    "/account",
  ];

  const pathname = request.nextUrl.pathname;

  // Only run if the route is protected
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next(); // Token valid, proceed
    } catch (err) {
      console.error("JWT verification failed:", err);
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  // For non-protected routes, just continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/transactions/:path*",
    "/policies/:path*",
    "/prepaid-societies/:path*",
    "/daily-activity/:path*",
    "/claims/:path*",
    "/users/:path*",
    "/account/:path*",
  ],
};
