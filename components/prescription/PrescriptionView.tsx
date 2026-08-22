import { Badge }          from "@/components/ui/Badge";
import { formatDate }     from "@/lib/utils";
import { APP_NAME }       from "@/lib/constants";
import type { Prescription } from "@prisma/client";

interface Medication {
  name:         string;
  dosage:       string;
  frequency:    string;
  duration:     string;
  instructions?: string;
}

interface PrescriptionViewProps {
  prescription:  Prescription;
  doctorName:    string;
  patientName:   string;
  doctorCrm?:    string;
}

export function PrescriptionView({
  prescription,
  doctorName,
  patientName,
  doctorCrm,
}: PrescriptionViewProps) {
  const medications = prescription.medications as Medication[];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6 print:shadow-none">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-brand-600">{APP_NAME}</span>
            <span className="text-xs text-gray-400">Receituário Digital</span>
          </div>
          <p className="text-sm text-gray-600">Dr(a). {doctorName}</p>
          {doctorCrm && (
            <p className="text-xs text-gray-400">CRM {doctorCrm}</p>
          )}
        </div>
        <div className="text-right space-y-1">
          {prescription.issuedAt && (
            <p className="text-sm text-gray-600">
              Emitida em {formatDate(prescription.issuedAt)}
            </p>
          )}
          {prescription.expiresAt && (
            <p className="text-sm text-gray-500">
              Válida até {formatDate(prescription.expiresAt)}
            </p>
          )}
          <PrescriptionStatusBadge status={prescription.status} />
        </div>
      </div>

      {/* Patient */}
      <div className="rounded-lg bg-gray-50 px-4 py-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Paciente
        </p>
        <p className="font-semibold text-gray-900">{patientName}</p>
      </div>

      {/* Medications */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Medicamentos
        </h3>

        {medications.map((med, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-100 bg-white p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{med.name}</p>
                <p className="text-sm text-gray-600">{med.dosage}</p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">#{i + 1}</span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span>
                <span className="font-medium">Frequência:</span> {med.frequency}
              </span>
              <span>
                <span className="font-medium">Duração:</span> {med.duration}
              </span>
            </div>

            {med.instructions && (
              <p className="text-sm text-gray-500 italic">{med.instructions}</p>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      {prescription.notes && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-4">
          <p className="text-xs font-medium text-yellow-700 mb-1">Observações</p>
          <p className="text-sm text-yellow-800">{prescription.notes}</p>
        </div>
      )}

      {/* Signature hash */}
      {prescription.signatureHash && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-400">
            Hash de validação:{" "}
            <span className="font-mono text-gray-500 break-all">
              {prescription.signatureHash.slice(0, 16)}…
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Valide em: /api/prescription/validate?id={prescription.id}&hash=…
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function PrescriptionStatusBadge({
  status,
}: {
  status: Prescription["status"];
}) {
  const map = {
    DRAFT:     { label: "Rascunho",  variant: "yellow" as const },
    ISSUED:    { label: "Emitida",   variant: "green"  as const },
    CANCELLED: { label: "Cancelada", variant: "red"    as const },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
