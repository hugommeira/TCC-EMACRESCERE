"use client";

import { useState }  from "react";
import { useRouter } from "next/navigation";
import { Button }    from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Alert }     from "@/components/ui/Alert";
import type { ConsultationStatus } from "@prisma/client";

interface Props {
  consultationId: string;
  status:         ConsultationStatus;
  /** Pagamento confirmado. O servidor recusa chamar/iniciar consulta não paga. */
  paid?:          boolean;
  /** Horário marcado (ISO). "Não compareceu" só aparece depois dele. */
  scheduledAt?:   string | null;
}

export function ConsultationActions({ consultationId, status, paid = true, scheduledAt = null }: Props) {
  // Calculado uma vez na montagem; a página recarrega a cada ação.
  const [pastScheduled] = useState(() => !scheduledAt || new Date(scheduledAt).getTime() <= Date.now());
  const router    = useRouter();
  const [loading, setLoading]  = useState(false);
  const [error,   setError]    = useState<string | null>(null);

  async function updateStatus(newStatus: ConsultationStatus) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/consultations/${consultationId}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json() as { message: string };
        setError(err.message);
        return;
      }

      router.refresh();
    } catch {
      setError("Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle className="mb-3">Ações</CardTitle>

      {error && (
        <Alert variant="error" className="mb-3" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="space-y-2">
        {status === "SCHEDULED" && !paid && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
            Aguardando o pagamento do paciente. A consulta pode ser iniciada depois da confirmação.
          </p>
        )}

        {status === "SCHEDULED" && paid && (
          <Button
            fullWidth
            variant="primary"
            loading={loading}
            onClick={() => void updateStatus("WAITING")}
          >
            Chamar paciente
          </Button>
        )}

        {status === "WAITING" && (
          <Button
            fullWidth
            variant="primary"
            loading={loading}
            onClick={() => void updateStatus("IN_PROGRESS")}
          >
            🟢 Iniciar consulta
          </Button>
        )}

        {status === "IN_PROGRESS" && (
          <Button
            fullWidth
            variant="secondary"
            loading={loading}
            onClick={() => void updateStatus("COMPLETED")}
          >
            ✅ Encerrar consulta
          </Button>
        )}

        {["SCHEDULED", "WAITING"].includes(status) && (
          <Button
            fullWidth
            variant="danger"
            loading={loading}
            onClick={() => void updateStatus("CANCELLED")}
          >
            Cancelar
          </Button>
        )}

        {status === "SCHEDULED" && paid && pastScheduled && (
          <Button
            fullWidth
            variant="ghost"
            loading={loading}
            onClick={() => void updateStatus("NO_SHOW")}
          >
            Marcar não compareceu
          </Button>
        )}
      </div>
    </Card>
  );
}
