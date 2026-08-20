"use client";

import "@livekit/components-styles";
import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  LayoutContextProvider,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

interface Props {
  consultationId: string;
}

export function VideoRoom({ consultationId }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [url,   setUrl]   = useState<string | null>(null);
  const [err,   setErr]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/livekit/token?consultationId=${encodeURIComponent(consultationId)}`,
          { cache: "no-store" },
        );
        const json = await r.json();
        if (!r.ok) {
          if (!cancelled) setErr(json.message ?? "Erro ao gerar token");
          return;
        }
        if (!cancelled) {
          setToken(json.token);
          setUrl(json.url);
        }
      } catch {
        if (!cancelled) setErr("Erro de conexão com o servidor de vídeo");
      }
    })();
    return () => { cancelled = true; };
  }, [consultationId]);

  if (err) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-slate-100 p-6 text-center text-sm text-slate-600">
        {err}
      </div>
    );
  }

  if (!token || !url) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-slate-900 text-slate-400">
        <span className="inline-flex items-center gap-2 text-sm">
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" className="opacity-25" />
            <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
          </svg>
          Conectando ao vídeo...
        </span>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={url}
      data-lk-theme="default"
      connect
      video
      audio
      className="lk-room-fix h-full w-full overflow-hidden rounded-2xl bg-slate-900"
    >
      <LayoutContextProvider>
        <RoomGrid />
        <RoomAudioRenderer />
        {/* ControlBar com todos os controles: mic, câmera, screen share, device selector */}
        <ControlBar
          variation="verbose"
          controls={{
            microphone:  true,
            camera:      true,
            screenShare: true,
            chat:        false,
            leave:       false,
            settings:    true,
          }}
        />
      </LayoutContextProvider>
    </LiveKitRoom>
  );
}

function RoomGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera,        withPlaceholder: true },
      { source: Track.Source.ScreenShare,   withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks} className="h-[calc(100%-80px)]">
      <ParticipantTile />
    </GridLayout>
  );
}
