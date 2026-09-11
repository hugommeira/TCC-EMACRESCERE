"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar }  from "@/components/ui/Avatar";
import { Badge }   from "@/components/ui/Badge";
import { Button }  from "@/components/ui/Button";
import { toast }   from "@/components/ui/Toast";
import { confirmDialog } from "@/components/ui/ConfirmDialog";

export interface DoctorForApproval {
  id:        string;
  name:      string;
  email:     string;
  phone:     string | null;
  cpf:       string | null;
  avatarUrl: string | null;
  createdAt: string;
  profile: {
    crm:             string;
    crmState:        string;
    specialty:       string;
    approvalStatus:  "PENDING" | "APPROVED" | "REJECTED";
    approvalNote:    string | null;
    approvedAt:      string | null;
    crmVerifiedAt:   string | null;
    crmVerification: { situation?: string; message?: string; source?: string } | null;
  };
}

const PT_BR_DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

const STATUS_LABEL: Record<DoctorForApproval["profile"]["approvalStatus"], { label: string; variant: "yellow" | "green" | "red" }> = {
  PENDING:  { label: "Aguardando análise", variant: "yellow" },
  APPROVED: { label: "Credenciado",        variant: "green"  },
  REJECTED: { label: "Reprovado",          variant: "red"    },
};

/**
 * Card de credenciamento de médico. Em PENDING mostra Aprovar / Reprovar
 * (reprovar exige motivo, que o médico vê no app). Em APPROVED/REJECTED
 * mostra a decisão e permite reverter.
 */
export function DoctorApprovalCard({ doctor }: { doctor: DoctorForApproval }) {
  const router = useRouter();
  const [busy, setBusy]         = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote]         = useState("");

  const p      = doctor.profile;
  const status = STATUS_LABEL[p.approvalStatus];
  const crmOk  = p.crmVerification?.situation === "ATIVO";

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (decision === "APPROVED") {
      const ok = await confirmDialog({
        title:        `Credenciar Dr(a). ${doctor.name}?`,
        message:      `CRM ${p.crm}/${p.crmState} · ${p.specialty}. O médico passa a atender e a aparecer para os pacientes.`,
        confirmLabel: "Aprovar",
        tone:         "primary",
      });
      if (!ok) return;
    }

    setBusy(true);
    try {
      const r = await fetch(`/api/admin/doctors/${doctor.id}/approval`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ decision, note: decision === "REJECTED" ? note.trim() : undefined }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.errors?.note?.[0] ?? data.message ?? "Não foi possível salvar a decisão");
        return;
      }
      toast.success(data.message);
      setRejecting(false);
      setNote("");
      router.refresh();
    } catch {
      toast.error("Falha de rede ao salvar a decisão");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <Avatar name={doctor.name} src={doctor.avatarUrl} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">Dr(a). {doctor.name}</p>
          <p className="text-sm text-gray-500 truncate">{p.specialty}</p>
        </div>
        <Badge variant={status.variant} dot>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
        <div>
          <span className="font-medium">CRM</span>
          <p className="text-gray-700">{p.crm}/{p.crmState}</p>
        </div>
        <div>
          <span className="font-medium">Cadastro</span>
          <p className="text-gray-700">{PT_BR_DATE.format(new Date(doctor.createdAt))}</p>
        </div>
        <div className="col-span-2">
          <span className="font-medium">E-mail</span>
          <p className="text-gray-700 truncate">{doctor.email}</p>
        </div>
        {doctor.phone && (
          <div>
            <span className="font-medium">Telefone</span>
            <p className="text-gray-700">{doctor.phone}</p>
          </div>
        )}
        {doctor.cpf && (
          <div>
            <span className="font-medium">CPF</span>
            <p className="text-gray-700">{doctor.cpf}</p>
          </div>
        )}
      </div>

      {/* Resultado da verificação (simulada) do CRM — a "prova" que o admin usa */}
      <div
        className={`rounded-lg px-3 py-2 text-xs ${
          crmOk ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
        }`}
      >
        <p className="font-semibold">
          Verificação do CRM: {p.crmVerification?.situation ?? "não realizada"}
          {p.crmVerification?.source === "simulado" && (
            <span className="ml-1 font-normal opacity-70">(simulada)</span>
          )}
        </p>
        {p.crmVerification?.message && <p className="mt-0.5">{p.crmVerification.message}</p>}
        {p.crmVerifiedAt && (
          <p className="mt-0.5 opacity-70">em {PT_BR_DATE.format(new Date(p.crmVerifiedAt))}</p>
        )}
      </div>

      {p.approvalStatus !== "PENDING" && (
        <p className="text-xs text-gray-500">
          {p.approvalStatus === "APPROVED" ? "Aprovado" : "Reprovado"}
          {p.approvedAt && ` em ${PT_BR_DATE.format(new Date(p.approvedAt))}`}
          {p.approvalNote && ` — ${p.approvalNote}`}
        </p>
      )}

      {rejecting ? (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <label className="block text-xs font-medium text-gray-700">
            Motivo da reprovação (o médico verá esta mensagem)
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: CRM não confere com o nome informado."
          />
          <div className="flex gap-2">
            <Button variant="danger" size="sm" loading={busy} disabled={note.trim().length < 5} onClick={() => decide("REJECTED")}>
              Confirmar reprovação
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => { setRejecting(false); setNote(""); }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 border-t border-gray-100 pt-3">
          {p.approvalStatus !== "APPROVED" && (
            <Button size="sm" loading={busy} onClick={() => decide("APPROVED")}>
              Aprovar
            </Button>
          )}
          {p.approvalStatus !== "REJECTED" && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => setRejecting(true)}>
              Reprovar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
