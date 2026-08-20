import type { Metadata }  from "next";
import { auth }           from "@/lib/auth";
import { redirect }       from "next/navigation";
import { prisma }         from "@/lib/prisma";
import {
  DashboardShell, PageHeader, EmptyState, SectionCard,
} from "@/components/layout/DashboardShell";
import { Pagination } from "@/components/history/Pagination";
import type { PrescriptionStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Receitas — Admin" };
export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  COMUM:             "Comum",
  COMUM_DUAS_VIAS:   "Antimicrobiano",
  CONTROLE_ESPECIAL: "Controle Especial",
  AZUL_B1:           "Azul B1",
  AZUL_B2:           "Azul B2",
  AMARELA_A1:        "Amarela A1",
  AMARELA_A2:        "Amarela A2",
  AMARELA_A3:        "Amarela A3",
};

const STATUS_RING: Record<string, string> = {
  DRAFT:     "bg-slate-100 text-slate-700 ring-slate-200",
  ISSUED:    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-rose-50    text-rose-700    ring-rose-200",
};

function isStatus(v: string): v is PrescriptionStatus {
  return ["DRAFT","ISSUED","CANCELLED"].includes(v);
}

export default async function AdminPrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/auth/login");
  }

  const sp     = await searchParams;
  const page   = Number(sp.page ?? 1) || 1;
  const status = sp.status && isStatus(sp.status) ? sp.status : undefined;
  const limit  = 20;
  const skip   = (page - 1) * limit;

  const where = status ? { status } : {};
  const [items, total] = await prisma.$transaction([
    prisma.prescription.findMany({
      where,
      include: {
        items: true,
        consultation: {
          select: {
            id: true,
            patient: { select: { id: true, name: true } },
            doctor:  { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit, skip,
    }),
    prisma.prescription.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <DashboardShell>
      <PageHeader
        badge="Auditoria"
        title="Receituários"
        description={`${total} receita(s) registrada(s) na plataforma`}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
          title="Nenhuma receita ainda"
        />
      ) : (
        <SectionCard title="Histórico de receitas" className="overflow-hidden">
          <div className="-mx-5 -mt-5 -mb-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Data</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Médico</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Paciente</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Itens</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/40">
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {new Intl.DateTimeFormat("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }).format(p.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-900">{p.consultation.doctor?.name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">{p.consultation.patient.name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{TYPE_LABELS[p.type] ?? p.type}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-700">{p.items.length}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${STATUS_RING[p.status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      <div className="mt-6">
        <Pagination page={page} pages={pages} />
      </div>
    </DashboardShell>
  );
}
