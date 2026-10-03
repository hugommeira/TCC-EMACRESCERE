import type { Metadata }    from "next";
import Link                 from "next/link";
import { RegisterForm }     from "@/components/auth/RegisterForm";
import { AuthShell }        from "@/components/auth/AuthShell";
import { AUTH_PHOTOS }           from "@/components/landing/photos";

export const metadata: Metadata = { title: "Criar conta de paciente" };

// Nenhum item promete o que a plataforma não controla: especialidade do
// médico, receita (é decisão clínica), medicamento, entrega ou prazo, e
// atendimento 24h. Antes a lista trazia "Caneta entregue em casa em até
// 48h", o que contradiz o aviso legal de que a plataforma não vende nem
// dispensa medicamento.
const PERKS = [
  "Consulta com médico de CRM ativo e verificado",
  "Fila on-demand ou dia e horário que você escolher",
  "Receita digital válida em todo o Brasil, quando indicada pelo médico",
  "Histórico de consultas, receitas e peso sempre à mão",
];

export default function RegisterPage() {
  return (
    <AuthShell
      photo={AUTH_PHOTOS.register}
      badge="Cadastro rápido em 2 minutos"
      headline="Comece sua jornada de emagrecimento com saúde."
      lead="Sem mensalidade. Você só paga quando for consultar."
      points={PERKS}
      footnote="Médicos se cadastram pela área profissional e são aprovados pela equipe Emacrescere."
      eyebrow="Conta de paciente"
      title="Crie sua conta grátis"
      subtitle="É rápido e seguro. Seus dados ficam protegidos pela LGPD."
      wide
      after={
        <p className="mt-6 text-center text-sm text-slate-500">
          É médico?{" "}
          <Link href="/auth/register/medico" className="font-semibold text-brand-700 hover:underline">
            Cadastre-se na área profissional
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
