import type { Metadata }  from "next";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { listUsers }      from "@/services/api/user";
import { Avatar }         from "@/components/ui/Avatar";
import { Badge }          from "@/components/ui/Badge";
import { formatDate }     from "@/lib/utils";
import type { Role }      from "@prisma/client";

export const metadata: Metadata = { title: "Usuários" };

const roleBadge: Record<Role, { label: string; variant: "blue"|"green"|"purple"|"gray" }> = {
  PATIENT:    { label: "Paciente",    variant: "blue"   },
  DOCTOR:     { label: "Médico",      variant: "green"  },
  ADMIN:      { label: "Admin",       variant: "purple" },
  SUPER_ADMIN: { label: "Super Admin", variant: "gray"  },
};

export default async function AdminUsersPage() {
  const { data: users, total } = await listUsers({ page: 1, limit: 50 });

  return (
    <DashboardShell>
      <PageHeader
        title="Usuários"
        description={`${total} usuários cadastrados`}
      />

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={rb.variant}>{rb.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {u.cpf ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.active ? "green" : "red"} dot>
                        {u.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
