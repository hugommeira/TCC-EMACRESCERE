import type { Metadata } from "next";
import { Suspense }      from "react";
import { AuthErrorContent } from "@/components/auth/AuthErrorContent";

export const metadata: Metadata = { title: "Erro de autenticação" };

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="h-48 w-full max-w-md animate-pulse rounded-xl bg-gray-100" />}>
        <AuthErrorContent />
      </Suspense>
    </main>
  );
}
