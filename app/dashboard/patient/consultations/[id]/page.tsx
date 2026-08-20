import type { Metadata }  from "next";
import { notFound, redirect } from "next/navigation";
import Link               from "next/link";
import { auth }           from "@/lib/auth";
import { getConsultationById } from "@/services/api/consultation";
import { getPrescriptionByConsultation } from "@/services/api/prescription";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ConsultationStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { Avatar }         from "@/components/ui/Avatar";
import { Button }         from "@/components/ui/Button";
import { PrescriptionView } from "@/components/prescription/PrescriptionView";
import { formatDateTime, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalhes da consulta" };

interface Props { params: { id: string } }

export default async function ConsultationDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  let consultation;
  try {
    consultation = await getConsultationById(params.id, session.user.id);
  } catch {
    notFound();
  }

  const prescription = await getPrescriptionByConsultation(params.id, session.user.id).catch(() => null);
  const isActive     = ["IN_PROGRESS", "WAITING"].includes(consultation.status);
  const doctor       = consultation.doctor;

  return (
    <DashboardShell>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/patient/consultations" className="hover:text-gray-700">Consultas</Link>
        <span>/</span>
        <span className="text-gray-900">Detalhes</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header card */}
          <Card>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Avatar name={doctor.name} src={doctor.avatarUrl} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900">Dr(a). {doctor.name}</p>
                  <p className="text-sm text-gray-500">{doctor.doctorProfile?.specialty}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    CRM {doctor.doctorProfile?.crm}/{doctor.doctorProfile?.crmState}
                  </p>
                </div>
              </div>
              <ConsultationStatusBadge status={consultation.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
              <div>
                <p className="text-gray-500">Data e hora</p>
                <p className="font-medium text-gray-900">{formatDateTime(consultation.scheduledAt)}</p>
              </div>
              {consultation.startedAt && (
                <div>
                  <p className="text-gray-500">Iniciada em</p>
                  <p className="font-medium text-gray-900">{formatDateTime(consultation.startedAt)}</p>
                </div>
              )}
              {consultation.endedAt && (
                <div>
                  <p className="text-gray-500">Encerrada em</p>
                  <p className="font-medium text-gray-900">{formatDateTime(consultation.endedAt)}</p>
                </div>
              )}
            </div>

            {consultation.chiefComplaint && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Motivo da consulta</p>
                <p className="text-sm text-gray-700">{consultation.chiefComplaint}</p>
              </div>
            )}

            {isActive && consultation.roomToken && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href={`/dashboard/patient/consultations/${consultation.id}/chat`}>
                  <Button fullWidth>
                    🟢 Entrar na sala de consulta
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Prescription */}
          {prescription && (
            <Card>
              <CardTitle className="mb-4">Prescrição médica</CardTitle>
              <PrescriptionView
                prescription={prescription}
                doctorName={doctor.name}
                patientName={consultation.patient.name}
                doctorCrm={`${doctor.doctorProfile?.crm}/${doctor.doctorProfile?.crmState}`}
              />
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Payment */}
          {consultation.payment && (
            <Card>
              <CardTitle className="mb-3">Pagamento</CardTitle>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-semibold">{formatCurrency(Number(consultation.payment.amount))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  <PaymentStatusBadge status={consultation.payment.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Método</span>
                  <span className="font-medium">{consultation.payment.method}</span>
                </div>
                {consultation.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pago em</span>
                    <span className="font-medium">{formatDateTime(consultation.payment.paidAt)}</span>
                  </div>
                )}
              </div>

              {/* PIX pending */}
              {consultation.payment.status === "PENDING" &&
               consultation.payment.pixCopyPaste && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <p className="text-xs text-gray-500">Código PIX:</p>
                  <p className="font-mono text-xs bg-gray-50 rounded p-2 break-all text-gray-600">
                    {consultation.payment.pixCopyPaste.slice(0, 40)}…
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Actions */}
          {consultation.status === "SCHEDULED" && (
            <Card>
              <CardTitle className="mb-3">Ações</CardTitle>
              <Button variant="danger" size="sm" fullWidth>
                Cancelar consulta
              </Button>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
