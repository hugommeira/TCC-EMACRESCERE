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
import { doctorTitle, formatCurrency } from "@/lib/utils";
import { todayInSaoPaulo } from "@/lib/scheduling";
import { CancellationPolicy } from "./CancellationPolicy";

type Step = "doctor" | "datetime" | "complaint" | "payment";

interface Slot { time: string; startsAt: string; available: boolean }

export function ScheduleWizard() {
  const router = useRouter();

  const [step,        setStep]        = useState<Step>("doctor");
  const [doctors,     setDoctors]     = useState<UserWithProfile[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState("");

  const [selectedDoctor,    setSelectedDoctor]    = useState<UserWithProfile | null>(null);
  const [selectedDate,      setSelectedDate]      = useState("");
  // Guarda o instante ISO que o servidor devolveu — não uma hora "HH:MM" que
  // o navegador converteria pelo fuso dele.
  const [selectedSlot,      setSelectedSlot]      = useState<Slot | null>(null);
  const [slots,             setSlots]             = useState<Slot[]>([]);
  const [slotsLoading,      setSlotsLoading]      = useState(false);
  const [chiefComplaint,    setChiefComplaint]    = useState("");
  const [consultationId,    setConsultationId]    = useState<string | null>(null);
  // Qual horário a consulta já criada reservou, pra não criar outra ao voltar.
  const [bookedSlotIso,     setBookedSlotIso]     = useState<string | null>(null);
  const [consultationAmount, setConsultationAmount] = useState(0);

  // Horários reais do médico no dia escolhido (agenda dele + ocupação).
  const fetchSlots = useCallback(async (doctorId: string, date: string) => {
    setSlotsLoading(true);
    setSlots([]);
    try {
      const res  = await fetch(`/api/doctors/${doctorId}/slots?date=${date}`, { cache: "no-store" });
      const json = await res.json() as { data?: { slots: Slot[] }; message?: string };
      if (!res.ok) { setError(json.message ?? "Erro ao carregar horários"); return; }
      setSlots(json.data?.slots ?? []);
    } catch {
      setError("Erro ao carregar horários");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedSlot(null);
    if (selectedDoctor && selectedDate) void fetchSlots(selectedDoctor.id, selectedDate);
  }, [selectedDoctor, selectedDate, fetchSlots]);

  // Consulta criada e ainda não paga, mas o paciente voltou e trocou de médico
  // ou de horário: cancela a antiga pra não segurar aquele horário à toa.
  function releaseBooking() {
    if (!consultationId) return;
    void fetch(`/api/consultations/${consultationId}/cancel`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reason: "Paciente trocou o horário antes de pagar" }),
    }).catch(() => {});
    setConsultationId(null);
    setBookedSlotIso(null);
  }

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
    if (doc?.id !== selectedDoctor?.id) releaseBooking();
    setSelectedDoctor(doc);
    setStep("datetime");
  }

  // Step: datetime → complaint → schedule
  async function handleSchedule() {
    if (!selectedDoctor || !selectedSlot || !chiefComplaint.trim()) return;
    setError(null);

    // Voltou da tela de pagamento sem trocar o horário: a consulta já existe.
    // Antes isso criava uma segunda, que batia na primeira como "horário ocupado".
    if (consultationId && bookedSlotIso === selectedSlot.startsAt) {
      setStep("payment");
      return;
    }
    releaseBooking();
    setLoading(true);

    try {
      const res = await fetch("/api/consultations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          doctorId:       selectedDoctor.id,
          scheduledAt:    selectedSlot.startsAt,
          chiefComplaint: chiefComplaint.trim(),
          paymentMethod:  "PIX", // será sobrescrito no checkout
        }),
      });

      const json = await res.json() as { data?: { id: string }; message?: string };
      if (!res.ok) {
        setError(json.message ?? "Erro ao agendar");
        // Alguém pegou o horário nesse meio-tempo: volta e mostra a agenda atualizada.
        if (res.status === 409 && selectedDate) {
          setStep("datetime");
          void fetchSlots(selectedDoctor.id, selectedDate);
        }
        return;
      }

      setConsultationId(json.data!.id);
      setBookedSlotIso(selectedSlot.startsAt);
      // Só pra exibir: o valor cobrado é decidido pelo servidor.
      setConsultationAmount(Number(selectedDoctor.doctorProfile?.consultationFee ?? 0));
      setStep("payment");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Hoje em São Paulo (os horários que já passaram vêm indisponíveis da API).
  // Antes usava toISOString, que é UTC: depois das 21h o mínimo pulava um dia.
  const minDateStr = todayInSaoPaulo();

  // ── Step: payment ──────────────────────────────────────────────────────────
  if (step === "payment" && consultationId) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <StepHeader step={3} total={3} label="Pagamento" onBack={() => setStep("complaint")} />
        <CancellationPolicy />
        <CheckoutForm
          consultationId={consultationId}
          amount={consultationAmount}
          doctorName={selectedDoctor?.name ?? ""}
          // Antes ia pra uma tela "Consulta confirmada! Pagamento confirmado"
          // assim que o Pix era GERADO: o QR code sumia antes de o paciente
          // conseguir pagar, e a mensagem era falsa. A página da consulta mostra
          // o QR/boleto e acompanha a confirmação sozinha.
          onSuccess={() => router.push(`/dashboard/patient/queue/${consultationId}`)}
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
            <p className="mt-1 text-xs text-gray-600 text-right">
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
            Agendando com <span className="font-semibold text-gray-800">{doctorTitle(selectedDoctor.name)}</span>
            {Number(selectedDoctor.doctorProfile?.consultationFee ?? 0) > 0 && (
              <> · {formatCurrency(Number(selectedDoctor.doctorProfile?.consultationFee))}</>
            )}
          </p>

          {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

          <DayStrip
            from={minDateStr}
            value={selectedDate}
            onChange={(v) => { setSelectedDate(v); setSelectedSlot(null); }}
          />

          <Input
            label="Ou escolha outra data"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDateStr}
          />

          {selectedDate && (
            <div>
              <label className="label">Horário</label>
              {slotsLoading ? (
                <p className="text-sm text-gray-600">Carregando horários…</p>
              ) : slots.length === 0 ? (
                // Dia fora da agenda do médico (ex.: fim de semana).
                <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                  O médico não atende neste dia. Escolha outra data.
                </p>
              ) : !slots.some((s) => s.available) ? (
                <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                  Não há mais horários livres neste dia. Escolha outra data.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {slots.map((s) => (
                    <button
                      key={s.startsAt}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setSelectedSlot(s)}
                      aria-label={s.available ? `Horário ${s.time}` : `Horário ${s.time}, indisponível`}
                      className={`min-h-11 rounded-lg border py-2 text-sm font-medium transition-colors ${
                        !s.available
                          ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through"
                          : selectedSlot?.startsAt === s.startsAt
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-gray-200 text-gray-600 hover:border-brand-300"
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          fullWidth
          size="lg"
          disabled={!selectedSlot}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-600">
          <p className="text-lg">🔍</p>
          <p className="mt-2 text-sm">Nenhum médico encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

// Próximos 14 dias em chips (um toque, sem abrir o calendário do sistema).
// Datas em "YYYY-MM-DD" no fuso de São Paulo, somadas em UTC para não variar
// com o fuso do aparelho.
const WEEKDAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH   = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function DayStrip({ from, value, onChange }: { from: string; value: string; onChange: (v: string) => void }) {
  const [y, m, d] = from.split("-").map(Number);
  const days = Array.from({ length: 14 }, (_, i) => {
    const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + i));
    return { iso: dt.toISOString().slice(0, 10), wd: WEEKDAY[dt.getUTCDay()], day: dt.getUTCDate(), mon: MONTH[dt.getUTCMonth()] };
  });

  return (
    <div>
      <p className="label">Data da consulta</p>
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="listbox" aria-label="Próximos dias">
        {days.map((x, i) => {
          const on = x.iso === value;
          return (
            <button
              key={x.iso}
              type="button"
              role="option"
              aria-selected={on}
              aria-label={`${x.wd}, ${x.day} de ${x.mon}`}
              onClick={() => onChange(x.iso)}
              className={`flex w-14 flex-none snap-start flex-col items-center rounded-xl border py-2 transition-colors ${
                on ? "border-brand-500 bg-gradient-to-b from-brand-500 to-teal-500 text-white shadow-md shadow-brand-500/25"
                   : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
              }`}
            >
              <span className={`text-[11px] font-medium ${on ? "text-white/85" : "text-gray-500"}`}>{i === 0 ? "Hoje" : x.wd}</span>
              <span className="text-lg font-semibold leading-tight">{x.day}</span>
              <span className={`text-[10px] ${on ? "text-white/80" : "text-gray-400"}`}>{x.mon}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
          <span className="text-xs text-gray-600">Passo {step + 1} de {total}</span>
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
