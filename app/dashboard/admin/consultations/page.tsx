import type { Metadata }   from "next";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { prisma }           from "@/lib/prisma";
import { ConsultationStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Avatar }           from "@/components/ui/Avatar";
import { formatDateTime, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Consultas – Admin" };

export default async function AdminConsultationsPage() {
  const consultations = await prisma.consultation.findMany({
    include: {
      patient: true,
      doctor:  true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
    take:    100,
  });

  return (
    <DashboardShell>
      <PageHeader
        title="Consultas"
        description={`${consultations.length} consultas recentes`}
      />

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {["Paciente", "Médico", "Data", "Status", "Pagamento", "Valor"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {consultations.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.patient.name} size="xs" />
                      <span className="font-medium text-gray-800">{c.patient.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.doctor ? `Dr(a). ${c.doctor.name}` : "—"}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {c.scheduledAt ? formatDateTime(c.scheduledAt) : formatDateTime(c.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ConsultationStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    {c.payment ? (
                      <PaymentStatusBadge status={c.payment.status} />
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.payment ? formatCurrency(Number(c.payment.amount)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
