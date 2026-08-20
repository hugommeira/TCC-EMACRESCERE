import type { Metadata } from "next";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { prisma }          from "@/lib/prisma";
import { Badge }           from "@/components/ui/Badge";
import { formatDateTime }  from "@/lib/utils";

export const metadata: Metadata = { title: "Auditoria – Admin" };

const actionColor: Record<string, "blue" | "green" | "red" | "yellow" | "gray"> = {
  "user.register":          "green",
  "user.login":             "blue",
  "consultation.created":   "blue",
  "consultation.cancelled": "red",
  "consultation.completed": "green",
  "payment.confirmed":      "green",
  "payment.refunded":       "yellow",
  "prescription.issued":    "green",
};

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take:    200,
  });

  return (
    <DashboardShell>
      <PageHeader
        title="Log de auditoria"
        description="Todas as ações registradas na plataforma"
      />

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {["Data/Hora", "Ação", "Entidade", "ID Entidade", "Ator", "IP"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhum registro ainda
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={actionColor[log.action] ?? "gray"}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">{log.entity}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {log.entityId?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.actorEmail ?? log.actorId?.slice(0, 8) ?? "sistema"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {log.ip ?? "—"}
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
