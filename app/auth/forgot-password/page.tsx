import type { Metadata } from "next";
import { Suspense }      from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthShell }     from "@/components/auth/AuthShell";
import { PHOTOS }        from "@/components/landing/photos";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      photo={PHOTOS.activity}
      headline="Recupere o acesso em poucos passos."
      lead="Enviamos um link para o e-mail cadastrado. Ele vale por 15 minutos e só funciona uma vez."
      title="Esqueceu sua senha?"
      subtitle="Informe seu e-mail e enviaremos um link para você criar uma nova senha."
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-slate-100" />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
