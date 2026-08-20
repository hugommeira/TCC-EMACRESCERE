import "server-only";
import { EventEmitter } from "node:events";
import { Client } from "pg";

// ─── Bus em memória (intra-processo) ──────────────────────────────────────────
// Cada processo Next.js tem 1 EventEmitter. Múltiplos clientes SSE escutam
// e a 1 conexão Postgres LISTEN repassa eventos do Postgres pro bus.

type RealtimeChannel =
  | "queue"                     // fila de espera (médicos)
  | `consultation:${string}`    // sala da consulta (chat + status)
  | `patient:${string}`         // status pessoal do paciente
  | `doctor:${string}`;         // sala/eventos do médico

interface RealtimeEvent {
  channel: RealtimeChannel;
  type:    string;
  data?:   unknown;
}

const globalForBus = globalThis as unknown as {
  __realtimeBus?:    EventEmitter;
  __pgListener?:     Client;
  __pgListenerInit?: Promise<void>;
  __sseConnPerUser?: Map<string, number>;
};

const MAX_SSE_PER_USER = 10;

function sseConnMap(): Map<string, number> {
  if (!globalForBus.__sseConnPerUser) globalForBus.__sseConnPerUser = new Map();
  return globalForBus.__sseConnPerUser;
}

/** Tenta reservar 1 slot. Retorna função de release ou null se atingiu limite. */
export function acquireSseSlot(userId: string): (() => void) | null {
  const map = sseConnMap();
  const cur = map.get(userId) ?? 0;
  if (cur >= MAX_SSE_PER_USER) return null;
  map.set(userId, cur + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const c = map.get(userId) ?? 0;
    if (c <= 1) map.delete(userId);
    else        map.set(userId, c - 1);
  };
}

function bus(): EventEmitter {
  if (!globalForBus.__realtimeBus) {
    const e = new EventEmitter();
    e.setMaxListeners(0); // sem limite
    globalForBus.__realtimeBus = e;
  }
  return globalForBus.__realtimeBus;
}

// ─── Postgres LISTEN (1 conexão por processo) ─────────────────────────────────
async function ensurePgListener() {
  if (globalForBus.__pgListenerInit) return globalForBus.__pgListenerInit;

  globalForBus.__pgListenerInit = (async () => {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL ausente");

    const client = new Client({ connectionString: url });
    await client.connect();

    client.on("notification", (msg) => {
      if (!msg.payload) return;
      try {
        const ev = JSON.parse(msg.payload) as RealtimeEvent;
        bus().emit(ev.channel, ev);
      } catch {
        /* ignore malformed */
      }
    });

    client.on("error", (err) => {
      console.error("[realtime] pg listener error:", err);
      // reconectar na próxima invocação
      delete globalForBus.__pgListener;
      delete globalForBus.__pgListenerInit;
    });

    await client.query("LISTEN realtime");

    globalForBus.__pgListener = client;
  })();

  return globalForBus.__pgListenerInit;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Publica um evento no canal (broadcast cross-process via Postgres NOTIFY). */
export async function publish(event: RealtimeEvent): Promise<void> {
  await ensurePgListener();
  // NOTIFY tem limite de 8000 chars no payload; truncar se preciso.
  const payload = JSON.stringify(event);
  // Usa a mesma conexão do listener ou abre transação curta via $executeRaw.
  // Caminho mais simples: usa cliente Prisma com $executeRaw.
  const { prisma } = await import("@/lib/prisma");
  await prisma.$executeRawUnsafe(
    `SELECT pg_notify('realtime', $1::text)`,
    payload,
  );
}

/** Inscreve um listener síncrono num canal. Retorna função de unsubscribe. */
export function subscribe(
  channel: RealtimeChannel,
  handler: (event: RealtimeEvent) => void,
): () => void {
  void ensurePgListener();
  const wrapped = (ev: RealtimeEvent) => handler(ev);
  bus().on(channel, wrapped);
  return () => bus().off(channel, wrapped);
}

// ─── Helpers SSE ──────────────────────────────────────────────────────────────

export type SseSendFn = (event: RealtimeEvent) => void;

/**
 * Cria um ReadableStream SSE que escuta uma lista de canais.
 * Envia heartbeat a cada 25s. `onClose` é chamado quando o cliente desconecta.
 */
export function createSseStream(
  channels: RealtimeChannel[],
  initial?: () => Promise<RealtimeEvent[] | void>,
  onClose?: () => void,
): Response {
  const encoder = new TextEncoder();
  const unsubs: Array<() => void> = [];
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    for (const u of unsubs) u();
    onClose?.();
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: RealtimeEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`),
          );
        } catch {
          cleanup();
        }
      };

      if (initial) {
        try {
          const events = (await initial()) ?? [];
          for (const ev of events) send(ev);
        } catch (err) {
          console.error("[sse] initial error:", err);
        }
      }

      for (const ch of channels) {
        unsubs.push(subscribe(ch, send));
      }

      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          cleanup();
        }
      }, 25_000);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
