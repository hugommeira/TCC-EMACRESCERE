import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import type { Role } from "@prisma/client";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/verify",
  "/auth/error",
  "/auth/unauthorized",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth",
  "/api/webhooks",
  "/api/users/register",
  "/prescricao",
  "/termos",
  "/privacidade",
];

const ROLE_ROUTES: Record<string, Role[]> = {
  "/dashboard/patient":  ["PATIENT"],
  "/dashboard/doctor":   ["DOCTOR"],
  "/dashboard/admin":    ["ADMIN", "SUPER_ADMIN"],
};

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getAllowedRoles(pathname: string): Role[] | null {
  const match = Object.entries(ROLE_ROUTES).find(([route]) =>
    pathname.startsWith(route),
  );
  return match ? match[1] : null;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const session = req.auth;
  if (!session?.user) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoles = getAllowedRoles(pathname);
  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    return NextResponse.redirect(new URL("/auth/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
