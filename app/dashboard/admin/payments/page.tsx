import type { Metadata }   from "next";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { prisma }           from "@/lib/prisma";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { formatDateTime, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Pagamentos – Admin" };

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      consultation: { include: { patient: true, doctor: true } },
    },
    orderBy: { createdAt: "desc" },
    take:    100,
  });

  const totalReceived = payments
    .filter((p) => p.status === "RECEIVED")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <DashboardShell>
      <PageHeader title="Pagamentos" description="Histórico financeiro da plataforma" />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total recebido"  value={formatCurrency(totalReceived)} color="green" />
        <KpiCard label="Pendente"        value={formatCurrency(totalPending)}  color="yellow" />
        <KpiCard label="Total transações" value={String(payments.length)}      color="blue" />
        <KpiCard
          label="Taxa de conversão"
          value={`${payments.length > 0 ? Math.round((payments.filter(p => p.status === "RECEIVED").length / payments.length) * 100) : 0}%`}
          color="purple"
        />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {["ID Asaas", "Paciente", "Médico", "Método", "Valor", "Status", "Data"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {p.asaasPaymentId?.slice(0, 8) ?? "—"}…
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {p.consultation.patient.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.consultation.doctor?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.method}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatCurrency(Number(p.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDateTime(p.createdAt)}
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

function KpiCard({
  label, value, color,
}: {
  label: string;
  value: string;
  color: "green" | "yellow" | "blue" | "purple";
}) {
  const bg = {
    green:  "bg-green-50  text-green-700  border-green-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    blue:   "bg-blue-50   text-blue-700   border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  }[color];

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
