import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import type { Role } from "@prisma/client";
import { ERROS } from "@/lib/error-catalog";

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
  "/api/prescription/validate",
  "/api/health",   // monitoramento: sem login só mostra o estado geral (lib/health.ts)
  "/prescricao",
  "/termos",
  "/privacidade",
  "/app.apk",      // APK do app (QR code da landing)
  "/app",          // app web (Flutter) em /app/: index, .wasm, .bin, fontes, NOTICES
  "/qr-app.svg",
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
    // API sem sessão: 401 em JSON. Redirecionar para o HTML do login fazia o
    // app (Dio) receber uma página no lugar dos dados e travar no carregamento.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: ERROS.AUTH_SESSAO_EXPIRADA.mensagem, code: "AUTH_SESSAO_EXPIRADA", status: 401 },
        { status: 401 },
      );
    }
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
    // A extensão no fim cobre qualquer arquivo de /public. Antes cada asset era
    // listado pelo nome, então um arquivo novo caía no redirect de login (307).
    // Rotas de API não têm extensão, então continuam protegidas.
    "/((?!_next/static|_next/image|public/|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|txt|xml|json|webmanifest|glb)$).*)",
  ],
};
