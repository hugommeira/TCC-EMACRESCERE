"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter }    from "next/navigation";
import { DoctorCard }   from "./DoctorCard";
import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { Button }       from "@/components/ui/Button";
import { Input }        from "@/components/ui/Input";
import { Alert }        from "@/components/ui/Alert";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { UserWithProfile } from "@/types";

type Step = "doctor" | "datetime" | "complaint" | "payment" | "done";

export function ScheduleWizard() {
  const router = useRouter();

  const [step,        setStep]        = useState<Step>("doctor");
  const [doctors,     setDoctors]     = useState<UserWithProfile[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState("");

  const [selectedDoctor,    setSelectedDoctor]    = useState<UserWithProfile | null>(null);
  const [selectedDate,      setSelectedDate]      = useState("");
  const [selectedTime,      setSelectedTime]      = useState("");
  const [chiefComplaint,    setChiefComplaint]    = useState("");
  const [consultationId,    setConsultationId]    = useState<string | null>(null);
  const [consultationAmount, setConsultationAmount] = useState(0);

  // Load doctors
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const q   = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/users?doctors=true&limit=12${q}`);
      const json = await res.json() as { data: { data: UserWithProfile[] } };
      setDoctors(json.data.data);
    } catch {
      setError("Erro ao carregar médicos");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { void fetchDoctors(); }, [fetchDoctors]);

  // Step: select doctor
  async function handleDoctorSelect(doctorId: string) {
    const doc = doctors.find((d) => d.id === doctorId) ?? null;
    setSelectedDoctor(doc);
    setStep("datetime");
  }

  // Step: datetime → complaint → schedule
  async function handleSchedule() {
    if (!selectedDoctor || !selectedDate || !selectedTime || !chiefComplaint.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);

      const res = await fetch("/api/consultations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          doctorId:       selectedDoctor.id,
          scheduledAt:    scheduledAt.toISOString(),
          chiefComplaint: chiefComplaint.trim(),
          paymentMethod:  "PIX", // será sobrescrito no checkout
        }),
      });

      const json = await res.json() as { data?: { id: string }; message?: string };
      if (!res.ok) { setError(json.message ?? "Erro ao agendar"); return; }

      setConsultationId(json.data!.id);
      setConsultationAmount(Number(selectedDoctor.doctorProfile?.consultationFee ?? 0));
      setStep("payment");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Generate available times (8h–18h, hourly)
  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const h = (8 + i).toString().padStart(2, "0");
    return `${h}:00`;
  });

  // Minimum date: tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0]!;

  // ── Step: done ─────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-gray-900">Consulta confirmada!</h2>
        <p className="text-gray-500 text-sm">
          Sua consulta foi agendada e o pagamento confirmado. Acesse o painel para acompanhar.
        </p>
        <Button fullWidth onClick={() => router.push("/dashboard/patient/consultations")}>
          Ver minhas consultas
        </Button>
      </div>
    );
  }

  // ── Step: payment ──────────────────────────────────────────────────────────
  if (step === "payment" && consultationId) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <StepHeader step={3} total={3} label="Pagamento" onBack={() => setStep("complaint")} />
        <CheckoutForm
          consultationId={consultationId}
          amount={consultationAmount}
          doctorName={selectedDoctor?.name ?? ""}
          onSuccess={() => setStep("done")}
        />
      </div>
    );
  }

  // ── Step: complaint ────────────────────────────────────────────────────────
  if (step === "complaint") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <StepHeader step={2} total={3} label="Motivo da consulta" onBack={() => setStep("datetime")} />

        {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

        <div className="card space-y-4">
          <div>
            <label className="label">Descreva o motivo da consulta *</label>
            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={5}
              maxLength={500}
              placeholder="Ex: Dor de cabeça persistente há 3 dias, tonturas ao levantar..."
              className="input resize-none"
            />
            <p className="mt-1 text-xs text-gray-400 text-right">
              {chiefComplaint.length}/500
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
            💡 Seja específico sobre sintomas, duração e intensidade para que o médico se prepare adequadamente.
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          disabled={chiefComplaint.trim().length < 10}
          loading={loading}
          onClick={() => void handleSchedule()}
        >
          Confirmar e pagar →
        </Button>
      </div>
    );
  }

  // ── Step: datetime ─────────────────────────────────────────────────────────
  if (step === "datetime" && selectedDoctor) {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <StepHeader step={1} total={3} label="Data e horário" onBack={() => setStep("doctor")} />

        <div className="card space-y-4">
          <p className="text-sm text-gray-500">
            Agendando com <span className="font-semibold text-gray-800">Dr(a). {selectedDoctor.name}</span>
          </p>

          <Input
            label="Data da consulta"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDateStr}
            required
          />

          {selectedDate && (
            <div>
              <label className="label">Horário</label>
              <div className="grid grid-cols-5 gap-2">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                      selectedTime === t
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 text-gray-600 hover:border-brand-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          fullWidth
          size="lg"
          disabled={!selectedDate || !selectedTime}
          onClick={() => setStep("complaint")}
        >
          Continuar →
        </Button>
      </div>
    );
  }

  // ── Step: select doctor ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <StepHeader step={0} total={3} label="Escolha o médico" />

      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nome ou especialidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftAddon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          }
        />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-400">
          <p className="text-lg">🔍</p>
          <p className="mt-2 text-sm">Nenhum médico encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              onSelect={(id) => void handleDoctorSelect(id)}
              selected={selectedDoctor?.id === doc.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step header ──────────────────────────────────────────────────────────────

function StepHeader({
  step, total, label, onBack,
}: {
  step:    number;
  total:   number;
  label:   string;
  onBack?: () => void;
}) {
  return (
    <div className="space-y-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-brand-600 hover:underline flex items-center gap-1"
        >
          ← Voltar
        </button>
      )}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
        {total > 0 && (
          <span className="text-xs text-gray-400">Passo {step + 1} de {total}</span>
        )}
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${((step) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
