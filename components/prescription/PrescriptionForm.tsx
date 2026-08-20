"use client";

import { useState }   from "react";
import { Button }     from "@/components/ui/Button";
import { Input }      from "@/components/ui/Input";
import { Alert }      from "@/components/ui/Alert";
import { createPrescriptionSchema } from "@/lib/validations/prescription";
import type { MedicationInput } from "@/lib/validations/prescription";

interface PrescriptionFormProps {
  consultationId: string;
  onSuccess?:     () => void;
}

const EMPTY_MED: MedicationInput = {
  name: "", dosage: "", frequency: "", duration: "", instructions: "",
};

export function PrescriptionForm({ consultationId, onSuccess }: PrescriptionFormProps) {
  const [medications, setMedications] = useState<MedicationInput[]>([{ ...EMPTY_MED }]);
  const [notes,       setNotes]       = useState("");
  const [errors,      setErrors]      = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);

  function addMedication() {
    setMedications((prev) => [...prev, { ...EMPTY_MED }]);
  }

  function removeMedication(index: number) {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMedication(index: number, field: keyof MedicationInput, value: string) {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`medications.${index}.${field}`];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = createPrescriptionSchema.safeParse({
      consultationId,
      medications,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      const fe = parsed.error.flatten();
      const fieldMap: Record<string, string> = {};
      Object.entries(fe.fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) fieldMap[k] = v[0];
      });
      setFieldErrors(fieldMap);
      setErrors("Corrija os campos destacados.");
      return;
    }

    setLoading(true);
    setErrors(null);

    try {
      const res = await fetch("/api/prescription", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(parsed.data),
      });

      const json = await res.json() as { message?: string };
      if (!res.ok) { setErrors(json.message ?? "Erro ao salvar"); return; }

      setSuccess(true);
      onSuccess?.();
    } catch {
      setErrors("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Alert variant="success" title="Prescrição criada!">
        A prescrição foi salva. Você pode emiti-la agora.
      </Alert>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {errors && (
        <Alert variant="error" onClose={() => setErrors(null)}>{errors}</Alert>
      )}

      {/* Medications list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Medicamentos</h3>
          <Button type="button" variant="ghost" size="sm" onClick={addMedication}>
            + Adicionar
          </Button>
        </div>

        {medications.map((med, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                Medicamento #{i + 1}
              </span>
              {medications.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMedication(i)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remover
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Nome do medicamento"
                value={med.name}
                onChange={(e) => updateMedication(i, "name", e.target.value)}
                error={fieldErrors[`medications.${i}.name`]}
                placeholder="Ex: Amoxicilina 500mg"
                required
              />
              <Input
                label="Dosagem"
                value={med.dosage}
                onChange={(e) => updateMedication(i, "dosage", e.target.value)}
                error={fieldErrors[`medications.${i}.dosage`]}
                placeholder="Ex: 1 comprimido"
                required
              />
              <Input
                label="Frequência"
                value={med.frequency}
                onChange={(e) => updateMedication(i, "frequency", e.target.value)}
                error={fieldErrors[`medications.${i}.frequency`]}
                placeholder="Ex: A cada 8 horas"
                required
              />
              <Input
                label="Duração"
                value={med.duration}
                onChange={(e) => updateMedication(i, "duration", e.target.value)}
                error={fieldErrors[`medications.${i}.duration`]}
                placeholder="Ex: 7 dias"
                required
              />
            </div>

            <div>
              <label className="label">Instruções (opcional)</label>
              <textarea
                value={med.instructions ?? ""}
                onChange={(e) => updateMedication(i, "instructions", e.target.value)}
                rows={2}
                placeholder="Ex: Tomar após as refeições"
                className="input resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="label">Observações gerais (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Orientações adicionais para o paciente…"
          className="input resize-none"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={loading}>
          Salvar prescrição
        </Button>
      </div>
    </form>
  );
}
