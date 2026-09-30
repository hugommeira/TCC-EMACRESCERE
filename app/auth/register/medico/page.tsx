import type { Metadata } from "next";
import Link              from "next/link";
import { RegisterForm }  from "@/components/auth/RegisterForm";
import { Logo }          from "@/components/landing/Logo";

export const metadata: Metadata = { title: "Cadastro de médico" };

// O site não tinha como um médico se cadastrar: a API aceitava, o admin tinha
// a tela de aprovação, mas não existia a porta de entrada.
export default function DoctorRegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <Link href="/auth/register" className="text-sm text-slate-600 hover:text-slate-900">
            Sou paciente
          </Link>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Área profissional
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900">
          Cadastro de médico
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Informe seu CRM. Verificamos a situação do registro no cadastro, e a equipe
          Emacrescere aprova o credenciamento antes de liberar os atendimentos.
        </p>

        <ol className="mt-6 space-y-1.5 rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">
          <li><strong className="text-slate-900">1.</strong> Você envia o cadastro com o CRM.</li>
          <li><strong className="text-slate-900">2.</strong> A equipe analisa e aprova (você acompanha pelo painel).</li>
          <li><strong className="text-slate-900">3.</strong> Aprovado, você configura sua agenda e passa a receber agendamentos.</li>
        </ol>

        <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <RegisterForm variant="doctor" />
        </div>
      </div>
    </main>
  );
}
