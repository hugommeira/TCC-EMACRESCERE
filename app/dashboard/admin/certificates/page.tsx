import type { Metadata }  from "next";
import { auth }           from "@/lib/auth";
import { redirect }       from "next/navigation";
import { prisma }         from "@/lib/prisma";
import {
  DashboardShell, PageHeader, EmptyState, SectionCard,
} from "@/components/layout/DashboardShell";

export const metadata: Metadata = { title: "Certificados — Admin" };
export const dynamic = "force-dynamic";

const PT_BR_DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function AdminCertificatesPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/auth/login");
  }

  const certs = await prisma.medicalCertificate.findMany({
    include: { doctor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <DashboardShell>
      <PageHeader
        badge="ICP-Brasil"
        title="Certificados digitais"
        description="Visão geral dos certificados A1 cadastrados pelos médicos."
      />

      {certs.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          }
          title="Nenhum certificado cadastrado"
          description="Os médicos ainda não carregaram seus certificados A1."
        />
      ) : (
        <SectionCard title={`${certs.length} certificado(s)`} className="overflow-hidden">
          <div className="-mx-5 -mt-5 -mb-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Médico</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Titular (CN)</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Emissor</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Validade</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certs.map((c) => {
                  const expired = c.validTo ? c.validTo < new Date() : false;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/40">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-900">{c.doctor.name}</p>
                        <p className="text-xs text-slate-500">{c.doctor.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700">{c.subjectCN ?? "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{c.issuerCN ?? "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {c.validFrom && c.validTo
                          ? `${PT_BR_DATE.format(c.validFrom)} → ${PT_BR_DATE.format(c.validTo)}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        {expired ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Expirado
                          </span>
                        ) : c.active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Inativo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </DashboardShell>
  );
}
