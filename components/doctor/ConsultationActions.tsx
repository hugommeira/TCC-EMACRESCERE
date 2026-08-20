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
}

export function ConsultationActions({ consultationId, status }: Props) {
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
        {status === "SCHEDULED" && (
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

        {status === "SCHEDULED" && (
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
