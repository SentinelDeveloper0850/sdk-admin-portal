import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;
const JWT_ISSUER = "sdk-admin-portal";
const JWT_AUDIENCE = "sdk-admin-portal-web";

export async function middleware(request: NextRequest) {
  const protectedRoutes = [
    "/account",
    "/calendar",
    "/cash-up",
    "/claims",
    "/communication",
    "/configurations",
    "/daily-activity",
    "/dashboard",
    "/funerals",
    "/knowledge-hub",
    "/news",
    "/policies",
    "/reports",
    "/shifts",
    "/societies",
    "/status",
    "/transactions",
    "/users",
  ];

  const pathname = request.nextUrl.pathname;

  // Only run if the route is protected
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // If the server is misconfigured, fail closed for protected routes.
    if (!JWT_SECRET) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
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
    "/account/:path*",
    "/calendar/:path*",
    "/cash/:path*-up",
    "/claims/:path*",
    "/communication/:path*",
    "/configurations/:path*",
    "/daily/:path*-activity",
    "/dashboard",
    "/funerals/:path*",
    "/knowledge/:path*-hub",
    "/news/:path*",
    "/policies/:path*",
    "/reports/:path*",
    "/shifts/:path*",
    "/societies/:path*",
    "/status",
    "/transactions/:path*",
    "/users/:path*",
  ],
};
