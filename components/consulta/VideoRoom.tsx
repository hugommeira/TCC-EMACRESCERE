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
  useLocalParticipant,
} from "@livekit/components-react";
import { DisconnectReason, MediaDeviceFailure, Track } from "livekit-client";
import { apiFetch, codigoDoErro, mensagemDeErro } from "@/lib/api-client";
import { ERROS, type ErrorCode } from "@/lib/error-catalog";

interface Props {
  consultationId: string;
}

export function VideoRoom({ consultationId }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [url,   setUrl]   = useState<string | null>(null);
  // Falha que impede o vídeo (token, configuração, conexão caiu).
  const [falha, setFalha] = useState<{ code: ErrorCode | undefined; texto: string } | null>(null);
  // Problema de câmera/microfone: a sala continua aberta, só avisa.
  const [avisoMidia, setAvisoMidia] = useState<ErrorCode | null>(null);
  // Incrementar reabre a sala do zero (novo token): botão "Reconectar".
  const [tentativa, setTentativa] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setToken(null);
    setFalha(null);
    setAvisoMidia(null);
    // Câmera e microfone só funcionam em https (ou localhost).
    if (!window.isSecureContext) {
      setFalha({ code: "VIDEO_NAVEGADOR_INSEGURO", texto: ERROS.VIDEO_NAVEGADOR_INSEGURO.mensagem });
      return;
    }
    (async () => {
      try {
        const json = await apiFetch<{ token: string; url: string }>(
          `/api/livekit/token?consultationId=${encodeURIComponent(consultationId)}`,
          { cache: "no-store" },
        );
        if (!cancelled) {
          setToken(json.token);
          setUrl(json.url);
        }
      } catch (e) {
        if (!cancelled) setFalha({ code: codigoDoErro(e), texto: mensagemDeErro(e) });
      }
    })();
    return () => { cancelled = true; };
  }, [consultationId, tentativa]);

  const reconectar = () => setTentativa((t) => t + 1);

  function onMediaDeviceFailure(failure?: MediaDeviceFailure) {
    setAvisoMidia(
      failure === MediaDeviceFailure.PermissionDenied ? "VIDEO_CAMERA_NEGADA" : "VIDEO_DISPOSITIVO_NAO_ENCONTRADO",
    );
  }

  function onDisconnected(reason?: DisconnectReason) {
    // Saída voluntária (sair da página) não é falha.
    if (reason === DisconnectReason.CLIENT_INITIATED) return;
    setFalha({ code: "VIDEO_CONEXAO_PERDIDA", texto: ERROS.VIDEO_CONEXAO_PERDIDA.mensagem });
  }

  function onError(error: Error) {
    // Erro de permissão também chega aqui em alguns navegadores.
    const midia = MediaDeviceFailure.getFailure(error);
    if (midia) { onMediaDeviceFailure(midia); return; }
    console.error("[VideoRoom]", error);
    setFalha({ code: "VIDEO_CONEXAO_PERDIDA", texto: ERROS.VIDEO_CONEXAO_PERDIDA.mensagem });
  }

  if (falha) {
    const podeReconectar = falha.code !== "VIDEO_NAVEGADOR_INSEGURO" && falha.code !== "VIDEO_NAO_CONFIGURADO";
    const acao = falha.code ? ERROS[falha.code].acao : null;
    return (
      <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-slate-100 p-6 text-center">
        <p className="text-sm font-medium text-slate-800">{falha.texto}</p>
        {acao && <p className="max-w-sm text-xs text-slate-500">{acao}</p>}
        {podeReconectar && (
          <button
            type="button"
            onClick={reconectar}
            className="rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-md"
          >
            Reconectar
          </button>
        )}
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
      key={tentativa}
      token={token}
      serverUrl={url}
      data-lk-theme="default"
      connect
      video
      audio
      onError={onError}
      onDisconnected={onDisconnected}
      onMediaDeviceFailure={onMediaDeviceFailure}
      className="lk-room-fix relative h-full w-full overflow-hidden rounded-2xl bg-slate-900"
    >
      {avisoMidia && (
        <div role="alert" className="absolute inset-x-3 top-3 z-10 rounded-xl bg-amber-500/95 px-3 py-2 text-xs text-white shadow-lg">
          <p className="font-semibold">{ERROS[avisoMidia].mensagem}</p>
          <p className="mt-0.5 opacity-90">{ERROS[avisoMidia].acao}</p>
          <button type="button" onClick={reconectar} className="mt-1.5 rounded-full bg-white/20 px-3 py-1 font-semibold hover:bg-white/30">
            Reconectar
          </button>
        </div>
      )}
      <LayoutContextProvider>
        <RoomGrid />
        <RoomAudioRenderer />
        {/* Mic e câmera: botões próprios, com rótulo, para ligar/bloquear cada um. */}
        <div className="absolute inset-x-0 bottom-0 flex h-20 flex-wrap items-center justify-center gap-2 bg-slate-900 px-3">
          <MediaToggles />
          <ControlBar
            variation={isMobile ? "minimal" : "verbose"}
            style={{ borderTop: 0, padding: 0 }}
            controls={{
              microphone:  false,
              camera:      false,
              screenShare: true,
              chat:        false,
              leave:       false,
              settings:    true,
            }}
          />
        </div>
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

function MediaToggles() {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();

  const itens = [
    {
      ligado: isMicrophoneEnabled,
      alternar: () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled).catch(() => {}),
      rotuloOn: "Bloquear microfone",
      rotuloOff: "Ativar microfone",
      textoOn: "Microfone",
      textoOff: "Microfone bloqueado",
    },
    {
      ligado: isCameraEnabled,
      alternar: () => localParticipant.setCameraEnabled(!isCameraEnabled).catch(() => {}),
      rotuloOn: "Bloquear câmera",
      rotuloOff: "Ativar câmera",
      textoOn: "Câmera",
      textoOff: "Câmera bloqueada",
    },
  ];

  return (
    <>
      {itens.map((i) => (
        <button
          key={i.textoOn}
          type="button"
          onClick={i.alternar}
          aria-pressed={!i.ligado}
          aria-label={i.ligado ? i.rotuloOn : i.rotuloOff}
          title={i.ligado ? i.rotuloOn : i.rotuloOff}
          className={`rounded-full px-4 py-2 text-xs font-semibold text-white shadow transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40 ${
            i.ligado ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {i.ligado ? i.textoOn : i.textoOff}
        </button>
      ))}
    </>
  );
}
