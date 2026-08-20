"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/components/ui";

interface TopBarProps {
  userName:  string;
  userImage?: string | null;
  title?:    string;
}

export function TopBar({ userName, userImage, title }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="min-w-0 flex-1">
        {title && (
          <h2 className="truncate font-display text-lg font-semibold text-slate-900">
            {title}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="hidden cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:inline-flex"
          aria-label="Buscar"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>

        <button
          type="button"
          className="relative cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Notificações"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2v1h16v-1l-2-2z" />
            <path d="M10 21a2 2 0 0 0 4 0" />
          </svg>
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white"
          />
        </button>

        <div className="mx-2 h-6 w-px bg-slate-200" aria-hidden />

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-2 rounded-full p-1 transition-colors hover:bg-slate-100"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <Avatar name={userName} {...(userImage !== undefined ? { src: userImage } : {})} size="sm" />
            <span className="hidden pr-1 text-sm font-medium text-slate-700 sm:inline">
              {userName.split(" ")[0]}
            </span>
            <svg viewBox="0 0 24 24" className={`hidden h-3.5 w-3.5 text-slate-400 transition-transform sm:block ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{userName}</p>
                <p className="truncate text-xs text-slate-500">Conta ativa</p>
              </div>
              <Link
                href="/dashboard/patient/profile"
                onClick={() => setOpen(false)}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                role="menuitem"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
                Meu perfil
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/auth/login" })}
                className="flex w-full cursor-pointer items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                role="menuitem"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
