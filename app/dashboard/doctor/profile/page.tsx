import type { Metadata }  from "next";
import { redirect }       from "next/navigation";
import { auth }           from "@/lib/auth";
import { prisma }         from "@/lib/prisma";
import {
  DashboardShell, PageHeader, SectionCard,
} from "@/components/layout/DashboardShell";
import { DoctorProfileForm }      from "@/components/doctor/DoctorProfileForm";
import { DoctorScheduleEditor }   from "@/components/doctor/DoctorScheduleEditor";
import { AvatarUploader }     from "@/components/profile/AvatarUploader";
import { AccountForm }        from "@/components/profile/AccountForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DoctorEducationForm } from "@/components/profile/DoctorEducationForm";
import { PrivacyCard }        from "@/components/profile/PrivacyCard";
import { DoctorSummary }      from "@/components/profile/ProfileSummary";
import { hasPassword }        from "@/services/api/profile";
import { doctorTitle, formatPhone } from "@/lib/utils";

export const metadata: Metadata = { title: "Meu perfil" };
export const dynamic = "force-dynamic";

const PT_BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function DoctorProfilePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctorProfile: true },
  });

  if (!user || !user.doctorProfile) redirect("/dashboard/doctor");

  const profile = user.doctorProfile;
  const temSenha = await hasPassword(user.id);
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <DashboardShell>
      <PageHeader
        badge="Perfil médico"
        title={`${doctorTitle(user.name)}`}
        description={`${profile.specialty}${profile.subSpecialty ? ` · ${profile.subSpecialty}` : ""}`}
      />

      <div className="mb-6">
        <DoctorSummary userId={user.id} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Foto e contato" description="A foto aparece para os pacientes na escolha do médico e na consulta.">
            <div className="space-y-6">
              <AvatarUploader name={user.name} initialUrl={user.avatarUrl} />
              <AccountForm initial={{ name: user.name, phone: user.phone, email: user.email }} />
            </div>
          </SectionCard>

          <SectionCard title="Informações profissionais" description="Editáveis com auto-save">
            <DoctorProfileForm
              initial={{
                available:       profile.available,
                consultationFee: Number(profile.consultationFee),
                subSpecialty:    profile.subSpecialty,
                bio:             profile.bio,
              }}
            />
          </SectionCard>

          <SectionCard title="Formação" description="Aparece para o paciente quando ele escolhe o médico.">
            <DoctorEducationForm
              initial={{
                graduationSchool: profile.graduationSchool ?? "",
                graduationYear:   profile.graduationYear != null ? String(profile.graduationYear) : "",
                residency:        profile.residency ?? "",
                languages:        profile.languages,
              }}
            />
          </SectionCard>

          <SectionCard title="Agenda" description="Dias e horários em que você está disponível">
            <DoctorScheduleEditor initial={profile.availableHours} />
          </SectionCard>
        </div>

        {/* Sidebar com dados readonly */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 via-white to-teal-50/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Dados oficiais
            </p>
            <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
              {firstName}
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="CRM"          value={`${profile.crm} / ${profile.crmState}`} />
              <Row label="Especialidade" value={profile.specialty} />
              <Row label="E-mail"       value={user.email} />
              {user.phone && <Row label="Telefone" value={formatPhone(user.phone)} />}
              <Row label="Consulta"     value={PT_BRL.format(Number(profile.consultationFee))} />
            </dl>
            <p className="mt-4 rounded-lg bg-white/70 px-3 py-2 text-[11px] text-slate-600 ring-1 ring-slate-200">
              CRM e especialidade são validados pelo administrador na criação da conta. Para alterar, contate o suporte.
            </p>
          </div>

          <SectionCard title="Senha">
            <ChangePasswordForm hasPassword={temSenha} />
          </SectionCard>

          <SectionCard title="Privacidade">
            <PrivacyCard hasPassword={temSenha} isDoctor />
          </SectionCard>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
            <p className="font-semibold">Certificado digital</p>
            <p className="mt-1 leading-relaxed">
              Configure seu certificado digital A1 em{" "}
              <a href="/dashboard/doctor/certificate" className="font-semibold underline">
                Certificado digital
              </a>{" "}
              para poder emitir receitas assinadas.
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
