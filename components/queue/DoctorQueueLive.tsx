"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSse } from "@/lib/hooks/useSse";

interface QueueItem {
  id:                string;
  enqueuedAt:        string | Date;
  chiefComplaint:    string | null;
  patientLastSeenAt: string | Date | null;
  patient: {
    id:        string;
    name:      string;
    avatarUrl: string | null;
    patientProfile: {
      birthDate: string | Date | null;
      gender:    string | null;
      allergies: string[];
    } | null;
  };
}

type PresenceLevel = "online" | "away" | "offline" | "unknown";

function presenceLevel(lastSeen: string | Date | null): { level: PresenceLevel; secs: number | null } {
  if (!lastSeen) return { level: "unknown", secs: null };
  const secs = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
  if (secs < 45)  return { level: "online",  secs };
  if (secs < 120) return { level: "away",    secs };
  return { level: "offline", secs };
}

function PresenceBadge({ lastSeen }: { lastSeen: string | Date | null }) {
  const { level, secs } = presenceLevel(lastSeen);
  if (level === "online") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        online
      </span>
    );
  }
  if (level === "away") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
        ausente {secs ? `${secs}s` : ""}
      </span>
    );
  }
  if (level === "offline") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-rose-200">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
        offline {secs ? formatSecs(secs) : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
      sem heartbeat
    </span>
  );
}

function formatSecs(s: number): string {
  if (s < 60) return `há ${s}s`;
  return `há ${Math.floor(s / 60)}min`;
}

function age(birthDate: string | Date | null | undefined): string | null {
  if (!birthDate) return null;
  const bd = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - bd.getFullYear();
  const m = now.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
  return `${age} anos`;
}

function waitTime(enqueuedAt: string | Date): string {
  const ms  = Date.now() - new Date(enqueuedAt).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1)  return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m`;
}

export function DoctorQueueLive({ initial }: { initial: QueueItem[] }) {
  const router = useRouter();
  const [queue, setQueue]       = useState<QueueItem[]>(initial);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [, startTransition]     = useTransition();
  const [, setTick]             = useState(0);

  // Re-renderiza a cada 15s pra atualizar as badges de presença
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(i);
  }, []);

  // Refetch periódico a cada 30s pra pegar lastSeenAt atualizado do servidor
  useEffect(() => {
    const i = setInterval(() => { void refetch(); }, 30_000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSse("/api/queue/sse", {
    "queue.snapshot": (data) => setQueue(data as QueueItem[]),
    "queue.entered":  () => { void refetch(); },
    "queue.claimed": (data) => {
      const { consultationId } = data as { consultationId: string };
      setQueue((q) => q.filter((i) => i.id !== consultationId));
    },
    "queue.abandoned": (data) => {
      const { consultationId } = data as { consultationId: string };
      setQueue((q) => q.filter((i) => i.id !== consultationId));
    },
  });

  async function refetch() {
    try {
      const r = await fetch("/api/queue/list", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setQueue(data.items as QueueItem[]);
    } catch {}
  }

  async function claim(id: string) {
    setClaiming(id);
    setError(null);
    try {
      const r = await fetch("/api/queue/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ consultationId: id }),
      });
      const json = await r.json();
      if (!r.ok) {
        setError(json.message ?? "Erro ao atender");
        await refetch();
        return;
      }
      startTransition(() => router.push(`/consulta/${id}`));
    } catch {
      setError("Erro de conexão");
    } finally {
      setClaiming(null);
    }
  }

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/40 p-12 text-center">
        <p className="font-display text-lg font-semibold text-slate-900">
          Fila vazia
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Pacientes aparecem aqui automaticamente assim que pagam a consulta.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Conectado em tempo real
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}
      <ul className="space-y-3">
        {queue.map((item, i) => {
          const ageStr = age(item.patient.patientProfile?.birthDate ?? null);
          return (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-200 hover:shadow-md sm:flex-row sm:items-center"
            >
              <div className="flex flex-none items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-teal-500 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.patient.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>
                      {[ageStr, item.patient.patientProfile?.gender]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </span>
                    <PresenceBadge lastSeen={item.patientLastSeenAt} />
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-slate-700">
                  {item.chiefComplaint ?? "Sem queixa registrada"}
                </p>
                {item.patient.patientProfile?.allergies?.length ? (
                  <p className="mt-1 text-xs text-amber-700">
                    ⚠ Alergias: {item.patient.patientProfile.allergies.join(", ")}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-none items-center gap-3 sm:flex-col sm:items-end">
                <span className="text-xs text-slate-500">
                  Espera: <strong className="text-slate-900">{waitTime(item.enqueuedAt)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => void claim(item.id)}
                  disabled={claiming !== null}
                  className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {claiming === item.id ? "Conectando..." : "Atender agora"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
