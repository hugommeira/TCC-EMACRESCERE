"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Marca o elemento com `is-visible` quando ele entra na tela, uma vez só.
 * O CSS (.reveal / .reveal-clip em globals.css) faz a transição; com
 * prefers-reduced-motion o conteúdo já nasce no lugar.
 */
export function useInView<T extends Element>(rootMargin = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, visible };
}

export function Reveal({
  as: Tag = "div",
  variant = "rise",
  delay = 0,
  className = "",
  children,
}: {
  as?: ElementType;
  variant?: "rise" | "clip";
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const { ref, visible } = useInView<HTMLElement>();
  const base = variant === "clip" ? "reveal-clip" : "reveal";

  return (
    <Tag
      ref={ref}
      className={`${base} ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
