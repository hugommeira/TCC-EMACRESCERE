import "server-only";
import { AccessToken } from "livekit-server-sdk";

function env(name: "LIVEKIT_URL" | "LIVEKIT_API_KEY" | "LIVEKIT_API_SECRET"): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável ${name} não configurada`);
  return v;
}

export const livekitUrl = () => env("LIVEKIT_URL");

export interface RoomParticipant {
  identity:    string; // userId
  name:        string;
  role:        "DOCTOR" | "PATIENT";
  roomName:    string; // ex: consultation_{id}
  canPublish?: boolean;
  ttlSeconds?: number;
}

/** Gera JWT para o cliente entrar na sala. */
export async function createRoomToken(p: RoomParticipant): Promise<string> {
  const at = new AccessToken(env("LIVEKIT_API_KEY"), env("LIVEKIT_API_SECRET"), {
    identity: p.identity,
    name:     p.name,
    metadata: JSON.stringify({ role: p.role }),
    ttl:      p.ttlSeconds ?? 60 * 60 * 2, // 2h
  });

  at.addGrant({
    room:           p.roomName,
    roomJoin:       true,
    canPublish:     p.canPublish ?? true,
    canSubscribe:   true,
    canPublishData: true,
  });

  return at.toJwt();
}

/** Nome canônico da sala (compartilhado entre token + DB) */
export function roomNameFor(consultationId: string): string {
  return `consultation_${consultationId}`;
}
