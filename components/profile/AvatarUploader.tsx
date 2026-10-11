"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { apiFetch, mensagemDeErro } from "@/lib/api-client";
import { ERROS } from "@/lib/error-catalog";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
/** Foto escolhida pode ser grande (celular): ela é reduzida antes de subir. */
const MAX_INPUT_BYTES = 15 * 1024 * 1024;
/** Lado da área de recorte na tela e da foto final enviada. */
const VIEW = 256;
const OUT  = 512;

/**
 * Foto de perfil: ver ampliada, trocar (com recorte quadrado) e remover.
 * Sem foto, o Avatar mostra as iniciais.
 */
export function AvatarUploader({
  name, initialUrl,
}: {
  name: string; initialUrl: string | null;
}) {
  const router = useRouter();
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url,      setUrl]      = useState(initialUrl);
  const [viewing,  setViewing]  = useState(false);
  const [cropSrc,  setCropSrc]  = useState<string | null>(null);
  const [busy,     setBusy]     = useState<"upload" | "remove" | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  async function afterChange(next: string | null) {
    setUrl(next);
    // Foto nova no topo da página também.
    await update();
    router.refresh();
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    if (!ACCEPT.includes(f.type)) { setError(ERROS.PERFIL_FOTO_INVALIDA.mensagem); return; }
    if (f.size > MAX_INPUT_BYTES) { setError("Foto grande demais. Escolha uma de até 15 MB."); return; }
    setCropSrc(URL.createObjectURL(f));
  }

  async function upload(blob: Blob) {
    setBusy("upload");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", blob, "avatar.jpg");
      const r = await apiFetch<{ data: { avatarUrl: string } }>("/api/profile/avatar", { method: "POST", body: form });
      closeCrop();
      await afterChange(r.data.avatarUrl);
    } catch (err) {
      setError(mensagemDeErro(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm("Remover sua foto de perfil?")) return;
    setBusy("remove");
    setError(null);
    try {
      await apiFetch("/api/profile/avatar", { method: "DELETE" });
      await afterChange(null);
    } catch (err) {
      setError(mensagemDeErro(err));
    } finally {
      setBusy(null);
    }
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
      <button
        type="button"
        onClick={() => (url ? setViewing(true) : inputRef.current?.click())}
        aria-label={url ? "Ver foto de perfil ampliada" : "Adicionar foto de perfil"}
        className="group relative flex-none cursor-pointer rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
      >
        <Avatar name={name} src={url} size="xl" className="!h-24 !w-24 !text-2xl ring-4 ring-white shadow-md" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/40 group-hover:opacity-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {url
              ? <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" /></>
              : <><path d="M3 7h3l2-3h8l2 3h3v13H3z" /><circle cx="12" cy="13" r="4" /></>}
          </svg>
        </span>
      </button>

      <div className="text-center sm:text-left">
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy !== null}
            className="cursor-pointer rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
          >
            {url ? "Trocar foto" : "Adicionar foto"}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy !== null}
              className="cursor-pointer rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy === "remove" ? "Removendo..." : "Remover"}
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">JPG, PNG ou WebP. A foto é recortada em quadrado.</p>
        {error && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      </div>

      <input ref={inputRef} type="file" accept={ACCEPT.join(",")} onChange={onPick} className="hidden" />

      <Modal open={viewing} onClose={() => setViewing(false)} title="Foto de perfil" size="lg">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`Foto de ${name}`} className="mx-auto max-h-[70vh] w-auto rounded-xl object-contain" />
        )}
      </Modal>

      {cropSrc && (
        <CropModal
          src={cropSrc}
          busy={busy === "upload"}
          error={error}
          onCancel={closeCrop}
          onConfirm={(blob) => void upload(blob)}
        />
      )}
    </div>
  );
}

// ─── Recorte quadrado ─────────────────────────────────────────────────────────

function CropModal({
  src, busy, error, onCancel, onConfirm,
}: {
  src: string; busy: boolean; error: string | null; onCancel: () => void; onConfirm: (b: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat,  setNat]  = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos,  setPos]  = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Escala que faz o lado menor da foto cobrir a área de recorte.
  const scale = nat ? (VIEW / Math.min(nat.w, nat.h)) * zoom : 1;
  const w = nat ? nat.w * scale : VIEW;
  const h = nat ? nat.h * scale : VIEW;

  const clamp = (p: { x: number; y: number }) => ({
    x: Math.min(0, Math.max(VIEW - w, p.x)),
    y: Math.min(0, Math.max(VIEW - h, p.y)),
  });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const n = { w: img.naturalWidth, h: img.naturalHeight };
      setNat(n);
      const s = VIEW / Math.min(n.w, n.h);
      setPos({ x: (VIEW - n.w * s) / 2, y: (VIEW - n.h * s) / 2 });
    };
    img.onerror = () => setLoadError(true);
    img.src = src;
  }, [src]);

  // Zoom mantém o centro da área de recorte no mesmo ponto da foto.
  function onZoom(z: number) {
    if (!nat) return;
    const s0 = VIEW / Math.min(nat.w, nat.h);
    const oldS = s0 * zoom, newS = s0 * z;
    const cx = (VIEW / 2 - pos.x) / oldS, cy = (VIEW / 2 - pos.y) / oldS;
    const nw = nat.w * newS, nh = nat.h * newS;
    setZoom(z);
    setPos({
      x: Math.min(0, Math.max(VIEW - nw, VIEW / 2 - cx * newS)),
      y: Math.min(0, Math.max(VIEW - nh, VIEW / 2 - cy * newS)),
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    setPos(clamp({ x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py }));
  }
  function onKey(e: React.KeyboardEvent) {
    const step = 10;
    const m: Record<string, [number, number]> = {
      ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step],
    };
    const mv = m[e.key];
    if (!mv) return;
    e.preventDefault();
    setPos((p) => clamp({ x: p.x + mv[0], y: p.y + mv[1] }));
  }

  function confirm() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const f = OUT / VIEW;
    ctx.fillStyle = "#fff"; // PNG com transparência vira fundo branco no JPG
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(img, pos.x * f, pos.y * f, w * f, h * f);
    canvas.toBlob((b) => { if (b) onConfirm(b); }, "image/jpeg", 0.9);
  }

  return (
    <Modal open onClose={busy ? () => {} : onCancel} title="Ajustar foto" size="md">
      {loadError ? (
        <p className="text-sm text-red-600">Não foi possível abrir esta imagem. Escolha outra.</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div
            role="img"
            aria-label="Área de recorte. Arraste a foto ou use as setas do teclado para posicionar."
            tabIndex={0}
            onKeyDown={onKey}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
            className="relative cursor-grab touch-none overflow-hidden rounded-full bg-slate-100 ring-4 ring-brand-100 focus:outline-none focus-visible:ring-brand-400 active:cursor-grabbing"
            style={{ width: VIEW, height: VIEW }}
          >
            {nat && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
                style={{ width: w, height: h, transform: `translate(${pos.x}px, ${pos.y}px)` }}
              />
            )}
          </div>

          <label className="flex w-full max-w-[256px] items-center gap-3 text-xs text-slate-600">
            <span aria-hidden>−</span>
            <input
              type="range" min={1} max={3} step={0.01}
              value={zoom}
              onChange={(e) => onZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1 accent-brand-600"
            />
            <span aria-hidden>+</span>
          </label>
          <p className="text-center text-[11px] text-slate-500">Arraste para posicionar e use o controle para aproximar.</p>
          {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={busy || !nat}
          className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Enviando..." : "Salvar foto"}
        </button>
      </div>
    </Modal>
  );
}
