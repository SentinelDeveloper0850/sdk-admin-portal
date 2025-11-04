import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables.");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_ISSUER = "sdk-admin-portal";
const JWT_AUDIENCE = "sdk-admin-portal-web";

export async function middleware(request: NextRequest) {
  const protectedRoutes = [
    "/dashboard",
    "/calendar",
    "/funerals",
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
