import type { Metadata } from "next";
import Link              from "next/link";
import { RegisterForm }  from "@/components/auth/RegisterForm";
import { AuthShell }     from "@/components/auth/AuthShell";
import { PHOTOS }        from "@/components/landing/photos";

export const metadata: Metadata = { title: "Cadastro de médico" };

// O site não tinha como um médico se cadastrar: a API aceitava, o admin tinha
// a tela de aprovação, mas não existia a porta de entrada.
const STEPS = [
  { title: "Você envia o cadastro com o CRM", desc: "Verificamos a situação do registro." },
  { title: "A equipe analisa e aprova",        desc: "Você acompanha o status pelo painel." },
  { title: "Você configura sua agenda",        desc: "E passa a atender pela fila ou por horário marcado." },
];

export default function DoctorRegisterPage() {
  return (
    <AuthShell
      variant="doctor"
      photo={PHOTOS.doctorDesk}
      badge="Área profissional"
      headline="Atenda por vídeo, com prontuário e receita digital."
      lead="Fila de pacientes, prontuário, prescrição com busca na base da ANVISA e assinatura com o seu certificado A1."
      points={STEPS}
      footnote="Toda conduta clínica e eventual prescrição são decisão exclusiva do médico."
      eyebrow="Área profissional"
      title="Cadastro de médico"
      subtitle="Informe seu CRM. A equipe Emacrescere aprova o credenciamento antes de liberar os atendimentos."
      wide
      mobileLink={{ href: "/auth/register", label: "Sou paciente" }}
      after={
        <p className="mt-6 text-center text-sm text-slate-500">
          É paciente?{" "}
          <Link href="/auth/register" className="font-semibold text-brand-700 hover:underline">
            Crie sua conta de paciente
          </Link>
        </p>
      }
    >
      <RegisterForm variant="doctor" />
    </AuthShell>
  );
}
