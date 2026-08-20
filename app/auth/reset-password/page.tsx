import type { Metadata } from "next";
import { Suspense }      from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Logo }          from "@/components/landing/Logo";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-slate-900">
          Criar nova senha
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Escolha uma senha forte para proteger sua conta.
        </p>

        <div className="mt-8">
          <Suspense fallback={<div className="h-56 animate-pulse rounded-xl bg-slate-100" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
