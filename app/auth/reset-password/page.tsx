import type { Metadata } from "next";
import { Suspense }      from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthShell }     from "@/components/auth/AuthShell";
import { AUTH_PHOTOS }        from "@/components/landing/photos";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      photo={AUTH_PHOTOS.password}
      headline="Uma senha nova, e você volta para o seu acompanhamento."
      lead="Suas senhas são guardadas como hash, nunca em texto. Nem a equipe consegue vê-las."
      title="Criar nova senha"
      subtitle="Escolha uma senha forte para proteger sua conta."
    >
      <Suspense fallback={<div className="h-56 animate-pulse rounded-xl bg-slate-100" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
