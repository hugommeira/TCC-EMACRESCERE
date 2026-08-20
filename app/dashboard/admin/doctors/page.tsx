import type { Metadata } from "next";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { listDoctors }   from "@/services/api/user";
import { Avatar }        from "@/components/ui/Avatar";
import { Badge }         from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Médicos – Admin" };

export default async function AdminDoctorsPage() {
  const { data: doctors, total } = await listDoctors({ page: 1, limit: 50 });

  return (
    <DashboardShell>
      <PageHeader
        title="Médicos"
        description={`${total} médicos cadastrados`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((d) => {
          const p = d.doctorProfile;
          if (!p) return null;
          return (
            <div key={d.id} className="card space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={d.name} src={d.avatarUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">Dr(a). {d.name}</p>
                  <p className="text-sm text-gray-500 truncate">{p.specialty}</p>
                </div>
                <Badge variant={p.available ? "green" : "gray"} dot>
                  {p.available ? "On" : "Off"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <div>
                  <span className="font-medium">CRM</span>
                  <p className="text-gray-700">{p.crm}/{p.crmState}</p>
                </div>
                <div>
                  <span className="font-medium">Valor consulta</span>
                  <p className="text-gray-700">{formatCurrency(Number(p.consultationFee))}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">E-mail</span>
                  <p className="text-gray-700 truncate">{d.email}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {doctors.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-400">
          <p className="text-4xl mb-2">👨‍⚕️</p>
          <p className="font-medium">Nenhum médico cadastrado</p>
        </div>
      )}
    </DashboardShell>
  );
}
