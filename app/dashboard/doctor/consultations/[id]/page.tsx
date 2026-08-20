import type { Metadata }  from "next";
import { notFound, redirect } from "next/navigation";
import Link               from "next/link";
import { auth }           from "@/lib/auth";
import { getConsultationById }  from "@/services/api/consultation";
import { getPrescriptionByConsultation } from "@/services/api/prescription";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ConsultationStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { Avatar }         from "@/components/ui/Avatar";
import { Button }         from "@/components/ui/Button";
import { PrescriptionView }  from "@/components/prescription/PrescriptionView";
import { PrescriptionForm }  from "@/components/prescription/PrescriptionForm";
import { ConsultationActions } from "@/components/doctor/ConsultationActions";
import { formatDateTime, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalhes da consulta" };

interface Props { params: { id: string } }

export default async function DoctorConsultationDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/auth/login");

  let consultation;
  try {
    consultation = await getConsultationById(params.id, session.user.id);
  } catch {
    notFound();
  }

  const prescription = await getPrescriptionByConsultation(params.id, session.user.id).catch(() => null);
  const isActive     = ["IN_PROGRESS", "WAITING"].includes(consultation.status);
  const patient      = consultation.patient;

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/doctor/consultations" className="hover:text-gray-700">Consultas</Link>
        <span>/</span>
        <span className="text-gray-900">Detalhes</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Patient info */}
          <Card>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Avatar name={patient.name} src={patient.avatarUrl} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-500">{patient.email}</p>
                  {patient.phone && <p className="text-xs text-gray-400">{patient.phone}</p>}
                </div>
              </div>
              <ConsultationStatusBadge status={consultation.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
              <div>
                <p className="text-gray-500">Agendada para</p>
                <p className="font-medium text-gray-900">{formatDateTime(consultation.scheduledAt)}</p>
              </div>
              {consultation.patientProfile && (
                <>
                  {consultation.patientProfile.birthDate && (
                    <div>
                      <p className="text-gray-500">Data de nascimento</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(consultation.patientProfile.birthDate)}
                      </p>
                    </div>
                  )}
                  {consultation.patientProfile.bloodType && (
                    <div>
                      <p className="text-gray-500">Tipo sanguíneo</p>
                      <p className="font-medium text-gray-900">{consultation.patientProfile.bloodType}</p>
                    </div>
                  )}
                  {(consultation.patientProfile.allergies as string[]).length > 0 && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Alergias</p>
                      <p className="font-medium text-gray-900">
                        {(consultation.patientProfile.allergies as string[]).join(", ")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {consultation.chiefComplaint && (
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="text-xs font-medium text-amber-700 mb-1">Queixa principal</p>
                <p className="text-sm text-amber-900">{consultation.chiefComplaint}</p>
              </div>
            )}

            {isActive && consultation.roomToken && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href={`/dashboard/doctor/consultations/${consultation.id}/chat`}>
                  <Button fullWidth>🟢 Entrar na sala</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Prescription */}
          <Card>
            <CardTitle className="mb-4">Prescrição</CardTitle>
            {prescription ? (
              <PrescriptionView
                prescription={prescription}
                doctorName={session.user.name}
                patientName={patient.name}
              />
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-500">
                  Nenhuma prescrição emitida para esta consulta.
                </p>
                {(consultation.status === "IN_PROGRESS" || consultation.status === "COMPLETED") && (
                  <PrescriptionForm consultationId={consultation.id} />
                )}
              </>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ConsultationActions
            consultationId={consultation.id}
            status={consultation.status}
          />

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
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
