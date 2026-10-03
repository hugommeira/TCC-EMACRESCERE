"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * next/image com um fundo de marca por baixo. Se a foto remota falhar
 * (CDN fora, CSP, URL removida), sobra o degradê em vez do ícone de
 * imagem quebrada. Quem usa define o posicionamento (ex.: "absolute inset-0").
 */
export function Photo({ className = "", alt, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-ink-950 ${className}`}>
      {!failed && (
        <Image
          {...props}
          alt={alt}
          fill
          onError={() => setFailed(true)}
          className="object-cover"
        />
      )}
    </div>
  );
}
