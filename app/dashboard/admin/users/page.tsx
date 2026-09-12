import type { Metadata }  from "next";
import { auth }           from "@/lib/auth";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { listUsers }      from "@/services/api/user";
import { Avatar }         from "@/components/ui/Avatar";
import { Badge }          from "@/components/ui/Badge";
import { Pagination }     from "@/components/history/Pagination";
import { UserActiveToggle } from "@/components/admin/UserActiveToggle";
import { formatDate }     from "@/lib/utils";
import type { Role }      from "@prisma/client";

export const metadata: Metadata = { title: "Usuários" };
export const dynamic  = "force-dynamic";

const PAGE_SIZE = 25;

const roleBadge: Record<Role, { label: string; variant: "blue"|"green"|"purple"|"gray" }> = {
  PATIENT:    { label: "Paciente",    variant: "blue"   },
  DOCTOR:     { label: "Médico",      variant: "green"  },
  ADMIN:      { label: "Admin",       variant: "purple" },
  SUPER_ADMIN: { label: "Super Admin", variant: "gray"  },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await auth();
  const sp   = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const q    = sp.q?.trim() || undefined;

  // Antes: 50 fixos, sem paginação — a partir do 51º usuário ninguém
  // aparecia; e não havia botão pra ativar/desativar apesar da API existir.
  const { data: users, total, pages } = await listUsers({ page, limit: PAGE_SIZE, ...(q ? { search: q } : {}) });

  return (
    <DashboardShell>
      <PageHeader
        title="Usuários"
        description={q ? `${total} resultado(s) para "${q}"` : `${total} usuários cadastrados · página ${page} de ${Math.max(1, pages)}`}
      />

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto table-responsive">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {["Usuário", "Role", "CPF", "Telefone", "Cadastro", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const rb = roleBadge[u.role];
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td data-label="Usuário" className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td data-label="Role" className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant={rb.variant}>{rb.label}</Badge>
                        {/* Médico só é "ativo de verdade" depois do credenciamento */}
                        {u.role === "DOCTOR" && u.doctorProfile?.approvalStatus === "PENDING" && (
                          <Badge variant="yellow" dot>Aguardando aprovação</Badge>
                        )}
                        {u.role === "DOCTOR" && u.doctorProfile?.approvalStatus === "REJECTED" && (
                          <Badge variant="red" dot>Reprovado</Badge>
                        )}
                      </div>
                    </td>
                    <td data-label="CPF" className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {u.cpf ?? "—"}
                    </td>
                    <td data-label="Telefone" className="px-4 py-3 text-gray-600">
                      {u.phone ?? "—"}
                    </td>
                    <td data-label="Cadastro" className="px-4 py-3 text-gray-500">
                      {formatDate(u.createdAt)}
                    </td>
                    <td data-label="Status" className="px-4 py-3">
                      <UserActiveToggle
                        userId={u.id}
                        name={u.name}
                        active={u.active}
                        isSelf={u.id === session?.user?.id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="mt-4">
          <Pagination page={page} pages={pages} />
        </div>
      )}
    </DashboardShell>
  );
}
