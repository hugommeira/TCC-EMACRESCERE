"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SceneKind } from "./Stage";

// Moldura de qualquer asset 3D do site. Regras (docs/3d/BRIEFING.md):
//  - o WebGL só é baixado quando a moldura chega perto da tela;
//  - fora da tela, a cena pausa;
//  - sem WebGL, com movimento reduzido, economia de dados ou tela estreita,
//    fica só o poster (imagem WebP), que também cobre o carregamento.
// O chunk do three.js é separado (import dinâmico) e nunca entra no caminho
// de abertura das páginas.

const Stage = dynamic(() => import("./Stage"), { ssr: false });

export interface Scene3DProps {
  scene:     SceneKind;
  /** Poster em /public/3d/posters (sem extensão), ex.: "logo-heart". */
  poster:    string;
  /** Descrição para leitor de tela; vazio = decorativo (escondido). */
  alt:       string;
  className?: string;
  /** Largura mínima (px) da janela para usar WebGL. Abaixo disso, só o poster. */
  minWidth?: number;
}

function canUseLive(minWidth: number): boolean {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < minWidth) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Scene3D({ scene, poster, alt, className = "", minWidth = 1024 }: Scene3DProps) {
  const box = useRef<HTMLDivElement>(null);
  const [live,   setLive]   = useState(false);   // pode usar WebGL neste aparelho
  const [near,   setNear]   = useState(false);   // chegou perto da tela: baixar
  const [inView, setInView] = useState(false);   // está visível: animar
  const [ready,  setReady]  = useState(false);   // primeiro quadro desenhado
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLive(canUseLive(minWidth));
  }, [minWidth]);

  useEffect(() => {
    const el = box.current;
    if (!el || !live) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [live]);

  const handleReady = useCallback(() => setReady(true), []);
  const handleError = useCallback(() => setFailed(true), []);
  const showStage = live && near && !failed;

  return (
    <div
      ref={box}
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      // "relative" só quando quem chama não posiciona (no CSS do Tailwind,
      // relative vem depois de absolute e ganharia)
      className={/\b(absolute|fixed)\b/.test(className) ? className : `relative ${className}`}
    >
      <Image
        src={`/3d/posters/${poster}.webp`}
        alt=""
        fill
        unoptimized
        priority={false}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={`object-contain transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      {showStage && (
        <div className="absolute inset-0" aria-hidden>
          <Stage
            scene={scene}
            active={inView}
            onReady={handleReady}
            onError={handleError}
          />
        </div>
      )}
    </div>
  );
}
