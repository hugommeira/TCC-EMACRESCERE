import type { Metadata }  from "next";
import { redirect }       from "next/navigation";
import { auth }           from "@/lib/auth";
import { getUserById }    from "@/services/api/user";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { Card, CardTitle } from "@/components/ui/Card";
import { Avatar }         from "@/components/ui/Avatar";
import { formatDate, maskCpf, formatPhone } from "@/lib/utils";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PatientProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const user    = await getUserById(session.user.id);
  const profile = user.patientProfile;

  return (
    <DashboardShell>
      <PageHeader title="Meu perfil" description="Suas informações cadastrais" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar name={user.name} src={user.avatarUrl} size="xl" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.phone && (
                  <p className="text-sm text-gray-500">{formatPhone(user.phone)}</p>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
              <DataRow label="CPF"           value={user.cpf ? maskCpf(user.cpf) : "—"} />
              <DataRow label="Cadastrado em" value={formatDate(user.createdAt)} />
            </div>
          </Card>

          {profile && (
            <Card>
              <CardTitle className="mb-4">Informações médicas</CardTitle>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <DataRow label="Data de nascimento" value={profile.birthDate ? formatDate(profile.birthDate) : "—"} />
                <DataRow label="Gênero"             value={profile.gender ?? "—"} />
                <DataRow label="Tipo sanguíneo"     value={profile.bloodType ?? "—"} />
                <DataRow
                  label="Alergias"
                  value={(profile.allergies as string[]).length > 0
                    ? (profile.allergies as string[]).join(", ")
                    : "Nenhuma registrada"}
                />
                <DataRow
                  label="Medicamentos em uso"
                  value={(profile.medications as string[]).length > 0
                    ? (profile.medications as string[]).join(", ")
                    : "Nenhum registrado"}
                  className="col-span-2"
                />
                {profile.notes && (
                  <DataRow label="Observações" value={profile.notes} className="col-span-2" />
                )}
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardTitle className="mb-3">Editar perfil</CardTitle>
            <p className="text-sm text-gray-500">
              Funcionalidade de edição disponível em breve.
            </p>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function DataRow({
  label, value, className = "",
}: {
  label: string; value: string; className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-gray-900">{value}</p>
    </div>
  );
}
