import Link from "next/link";
import { Card }   from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { ConsultationStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import type { ConsultationWithParties } from "@/types";

interface ConsultationCardProps {
  consultation: ConsultationWithParties;
  role:         "patient" | "doctor";
}

export function ConsultationCard({ consultation, role }: ConsultationCardProps) {
  const other    = role === "patient" ? consultation.doctor : consultation.patient;
  const prefix   = role === "patient" ? "Dr(a)." : "";
  const isActive =
    consultation.status === "IN_PROGRESS" ||
    consultation.status === "WAITING";

  const otherName      = other?.name ?? "Aguardando médico";
  const otherAvatarUrl = other?.avatarUrl ?? null;
  const dateLabel      = consultation.scheduledAt
    ? formatDateTime(consultation.scheduledAt)
    : consultation.enqueuedAt
      ? `Na fila desde ${formatDateTime(consultation.enqueuedAt)}`
      : "Atendimento on-demand";

  return (
    <Card hover className="transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={otherName} {...(otherAvatarUrl ? { src: otherAvatarUrl } : {})} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {prefix} {otherName}
            </p>
            <p className="text-sm text-gray-500">
              {dateLabel}
            </p>
          </div>
        </div>

        <ConsultationStatusBadge status={consultation.status} />
      </div>

      {consultation.chiefComplaint && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2 border-t border-gray-100 pt-3">
          {consultation.chiefComplaint}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {consultation.payment && (
            <>
              <PaymentStatusBadge status={consultation.payment.status} />
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(Number(consultation.payment.amount))}
              </span>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {isActive && consultation.roomToken && (
            <Link href={`/dashboard/${role}/consultations/${consultation.id}/chat`}>
              <Button size="sm" variant="primary">
                Entrar na sala
              </Button>
            </Link>
          )}
          <Link href={`/dashboard/${role}/consultations/${consultation.id}`}>
            <Button size="sm" variant="outline">
              Detalhes
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
