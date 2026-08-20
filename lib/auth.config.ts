import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

// ─── Configuração base (edge-safe, sem Prisma) ────────────────────────────────
// O adapter completo fica em lib/auth.ts (Node.js only)

export const authConfig = {
  pages: {
    signIn:  "/auth/login",
    signOut: "/auth/login",
    error:   "/auth/error",
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const path       = nextUrl.pathname;

      const publicPaths = [
        "/auth/login", "/auth/register", "/auth/error",
        "/auth/verify", "/auth/unauthorized",
        "/auth/forgot-password", "/auth/reset-password",
        "/landing", "/api/webhooks", "/api/prescription/validate",
      ];

      const isPublic =
        path === "/" ||
        publicPaths.some((p) => path === p || path.startsWith(p + "/")) ||
        path.startsWith("/api/auth");

      if (isPublic) return true;
      if (!isLoggedIn) return false;
      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token["id"]   = user.id;
        token["role"] = (user as { role: Role }).role;
      }
      return token;
    },

    session({ session, token }) {
      if (token && session.user) {
        session.user.id   = token["id"] as string;
        (session.user as { role: Role }).role = token["role"] as Role;
      }
      return session;
    },
  },

  providers: [], // providers reais em lib/auth.ts
} satisfies NextAuthConfig;
