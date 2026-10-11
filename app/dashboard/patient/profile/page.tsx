import type { Metadata }  from "next";
import { redirect }       from "next/navigation";
import { auth }           from "@/lib/auth";
import { getUserById }    from "@/services/api/user";
import { hasPassword }    from "@/services/api/profile";
import { DashboardShell, PageHeader, SectionCard } from "@/components/layout/DashboardShell";
import { AvatarUploader }    from "@/components/profile/AvatarUploader";
import { AccountForm }       from "@/components/profile/AccountForm";
import { PatientHealthForm } from "@/components/profile/PatientHealthForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { EmergencyContactForm } from "@/components/profile/EmergencyContactForm";
import { PrivacyCard }       from "@/components/profile/PrivacyCard";
import { PatientSummary }    from "@/components/profile/ProfileSummary";
import { formatDate, maskCpf } from "@/lib/utils";

export const metadata: Metadata = { title: "Meu perfil" };
export const dynamic = "force-dynamic";

export default async function PatientProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [user, temSenha] = await Promise.all([
    getUserById(session.user.id),
    hasPassword(session.user.id),
  ]);
  const profile = user.patientProfile;

  return (
    <DashboardShell>
      <PageHeader title="Meu perfil" description="Seus dados de cadastro e de saúde" />

      <div className="mb-6">
        <PatientSummary userId={user.id} heightCm={profile?.heightCm ?? null} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Foto e dados pessoais">
            <div className="space-y-6">
              <AvatarUploader name={user.name} initialUrl={user.avatarUrl} />
              <AccountForm initial={{ name: user.name, phone: user.phone, email: user.email }} />
            </div>
          </SectionCard>

          <SectionCard
            title="Informações de saúde"
            description="O médico vê estes dados no prontuário durante a consulta."
          >
            <PatientHealthForm
              initial={{
                // Dia no fuso de Brasília (a data é guardada à meia-noite de lá).
                birthDate:    profile?.birthDate
                  ? new Date(profile.birthDate.getTime() - 3 * 3600_000).toISOString().slice(0, 10)
                  : "",
                gender:       profile?.gender ?? "",
                bloodType:    profile?.bloodType ?? "",
                heightCm:     profile?.heightCm != null ? String(profile.heightCm) : "",
                goalWeightKg: profile?.goalWeightKg != null ? String(Number(profile.goalWeightKg)).replace(".", ",") : "",
                allergies:    (profile?.allergies as string[] | undefined) ?? [],
                medications:  (profile?.medications as string[] | undefined) ?? [],
                notes:        profile?.notes ?? "",
              }}
            />
          </SectionCard>

          <SectionCard
            title="Contato de emergência"
            description="Quem avisar se algo acontecer durante a consulta. O médico da consulta também vê."
          >
            <EmergencyContactForm
              initial={{
                name:     profile?.emergencyContactName ?? null,
                phone:    profile?.emergencyContactPhone ?? null,
                relation: profile?.emergencyContactRelation ?? null,
              }}
            />
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <SectionCard title="Sua conta">
            <dl className="space-y-3 text-sm">
              <Row label="CPF"           value={user.cpf ? maskCpf(user.cpf) : "—"} />
              <Row label="Cadastrado em" value={formatDate(user.createdAt)} />
              <Row label="Login"         value={temSenha ? "E-mail e senha" : "Conta Google"} />
            </dl>
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600 ring-1 ring-slate-200">
              CPF e e-mail identificam a sua conta e não podem ser trocados aqui. Para corrigir, fale com o suporte.
            </p>
          </SectionCard>

          <SectionCard title="Senha">
            <ChangePasswordForm hasPassword={temSenha} />
          </SectionCard>

          <SectionCard title="Privacidade">
            <PrivacyCard hasPassword={temSenha} isDoctor={false} />
          </SectionCard>
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
