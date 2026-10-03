import type { Metadata } from "next";
import { Suspense }      from "react";
import { LoginForm }     from "@/components/auth/LoginForm";
import { AuthShell }     from "@/components/auth/AuthShell";
import { AUTH_PHOTOS }        from "@/components/landing/photos";

export const metadata: Metadata = { title: "Entrar" };

const HIGHLIGHTS = [
  {
    title: "Acompanhamento contínuo",
    desc:  "Seu médico acompanha seu progresso pelo app, sempre que precisar.",
  },
  {
    title: "Receita digital válida",
    desc:  "Prescrições com assinatura certificada conforme CFM 2.314/2022.",
  },
  // Antes: "Entrega segura em 48h — caneta de emagrecimento entregue em casa".
  // A plataforma não vende nem entrega medicamento (ver aviso legal do
  // rodapé), então não pode prometer entrega, prazo nem o próprio remédio.
  {
    title: "Fila ou hora marcada",
    desc:  "Entre na fila on-demand ou escolha o médico e o horário.",
  },
];

export default function LoginPage() {
  return (
    <AuthShell
      photo={AUTH_PHOTOS.login}
      headline="Sua jornada de emagrecimento continua aqui."
      lead="Plataforma de telessaúde para acompanhamento médico do emagrecimento."
      points={HIGHLIGHTS}
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar seu acompanhamento."
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
