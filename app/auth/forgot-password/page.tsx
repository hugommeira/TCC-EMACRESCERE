import type { Metadata } from "next";
import Link              from "next/link";
import { Suspense }      from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Logo }          from "@/components/landing/Logo";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-slate-900">
          Esqueceu sua senha?
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Informe seu e-mail e enviaremos um link para você criar uma nova senha.
        </p>

        <div className="mt-8">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-slate-100" />}>
            <ForgotPasswordForm />
          </Suspense>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-800">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
