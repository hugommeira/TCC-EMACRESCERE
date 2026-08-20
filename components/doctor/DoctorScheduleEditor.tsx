"use client";

import { useEffect, useRef, useState } from "react";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface Slot { active: boolean; start: string; end: string }

const DAYS: { key: DayKey; label: string; full: string }[] = [
  { key: "mon", label: "Seg", full: "Segunda-feira" },
  { key: "tue", label: "Ter", full: "Terça-feira" },
  { key: "wed", label: "Qua", full: "Quarta-feira" },
  { key: "thu", label: "Qui", full: "Quinta-feira" },
  { key: "fri", label: "Sex", full: "Sexta-feira" },
  { key: "sat", label: "Sáb", full: "Sábado" },
  { key: "sun", label: "Dom", full: "Domingo" },
];

const DEFAULT_SLOT: Slot = { active: false, start: "08:00", end: "18:00" };

function parseHours(raw: unknown): Record<DayKey, Slot> {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = {} as Record<DayKey, Slot>;
  for (const { key } of DAYS) {
    const v = obj[key];
    if (Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string") {
      out[key] = { active: true, start: v[0], end: v[1] };
    } else {
      out[key] = { ...DEFAULT_SLOT };
    }
  }
  return out;
}

function toApi(state: Record<DayKey, Slot>) {
  const out: Record<string, string[]> = {};
  for (const { key } of DAYS) {
    const s = state[key];
    out[key] = s.active ? [s.start, s.end] : [];
  }
  return out;
}

export function DoctorScheduleEditor({
  initial,
}: {
  initial: unknown;
}) {
  const [state, setState] = useState<Record<DayKey, Slot>>(() => parseHours(initial));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const isFirst = useRef(true);

  // Auto-save com debounce
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    const t = setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        const r = await fetch("/api/doctor/profile", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ availableHours: toApi(state) }),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({} as { message?: string }));
          setError(j.message ?? "Falha ao salvar");
          return;
        }
        setSavedAt(new Date());
      } catch {
        setError("Erro de conexão");
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [state]);

  function update(day: DayKey, patch: Partial<Slot>) {
    setState((s) => ({ ...s, [day]: { ...s[day], ...patch } }));
  }

  function applyToAll(template: Slot) {
    const next = {} as Record<DayKey, Slot>;
    for (const { key } of DAYS) next[key] = { ...template };
    setState(next);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900">Horários de atendimento</h3>
          <p className="text-xs text-slate-500">Defina os dias e horários em que você atende.</p>
        </div>
        <div className="text-right text-[11px]">
          {error ? (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 ring-1 ring-rose-200">
              {error}
            </span>
          ) : saving ? (
            <span className="text-slate-500">Salvando...</span>
          ) : savedAt ? (
            <span className="text-emerald-600">
              ✓ Salvo {savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : (
            <span className="text-slate-400">Auto-save ativo</span>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => applyToAll({ active: true, start: "08:00", end: "18:00" })}
          className="cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
        >
          Comercial seg-dom
        </button>
        <button
          type="button"
          onClick={() => {
            const next = {} as Record<DayKey, Slot>;
            for (const { key } of DAYS) {
              const isWeekend = key === "sat" || key === "sun";
              next[key] = isWeekend
                ? { active: false, start: "08:00", end: "18:00" }
                : { active: true,  start: "08:00", end: "18:00" };
            }
            setState(next);
          }}
          className="cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
        >
          Apenas semana
        </button>
        <button
          type="button"
          onClick={() => applyToAll({ active: false, start: "08:00", end: "18:00" })}
          className="cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
        >
          Limpar
        </button>
      </div>

      <ul className="space-y-2">
        {DAYS.map(({ key, full }) => {
          const slot = state[key];
          return (
            <li
              key={key}
              className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center ${
                slot.active ? "border-brand-200 bg-brand-50/30" : "border-slate-200 bg-white"
              }`}
            >
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={slot.active}
                  onChange={(e) => update(key, { active: e.target.checked })}
                  className="h-5 w-5 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className={`text-sm font-medium ${slot.active ? "text-slate-900" : "text-slate-500"}`}>
                  {full}
                </span>
              </label>

              <div className="flex flex-none items-center gap-2 sm:ml-auto">
                <TimeInput
                  value={slot.start}
                  onChange={(v) => update(key, { start: v })}
                  disabled={!slot.active}
                />
                <span className="text-xs text-slate-400">até</span>
                <TimeInput
                  value={slot.end}
                  onChange={(v) => update(key, { end: v })}
                  disabled={!slot.active}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TimeInput({
  value, onChange, disabled,
}: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-[7rem] rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
    />
  );
}
