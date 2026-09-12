"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import { NavLinks } from "@/components/layout/NavLinks";
import { TopBarSearch, NotificationsMenu } from "@/components/layout/TopBarTools";
import { ROLE_LABEL } from "@/components/layout/Sidebar";
import type { NavItem } from "@/components/layout/Sidebar";
import type { Role } from "@prisma/client";

interface TopBarProps {
  userName:  string;
  userImage?: string | null;
  title?:    string;
  items?:    NavItem[];
  role?:     Role;
}

export function TopBar({ userName, userImage, title, items, role }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const profileHref =
    role === "PATIENT" ? "/dashboard/patient/profile"
    : role === "DOCTOR" ? "/dashboard/doctor/profile"
    : null;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <>
    <header className="flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {items && items.length > 0 && (
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="-ml-2 inline-flex flex-none cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Abrir menu"
            aria-haspopup="menu"
            aria-expanded={mobileNavOpen}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        {title && (
          <h2 className="truncate font-display text-lg font-semibold text-slate-900">
            {title}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Busca e sino funcionais (antes eram só decorativos) */}
        {role && <TopBarSearch role={role} />}
        <NotificationsMenu />

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
              {/* Antes apontava fixo pra /dashboard/patient/profile: médico e
                  admin caíam em "Acesso negado". Admin não tem página de perfil. */}
              {profileHref && (
                <Link
                  href={profileHref}
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
              )}
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

    {items && items.length > 0 && mobileNavOpen && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <button
          type="button"
          aria-label="Fechar menu"
          className="absolute inset-0 cursor-default bg-slate-900/40"
          onClick={() => setMobileNavOpen(false)}
        />
        <div className="relative flex h-full w-72 max-w-[80vw] flex-col overflow-hidden bg-gradient-to-b from-brand-600 via-brand-700 to-teal-800 text-white shadow-xl">
          <div className="flex h-16 flex-none items-center justify-between border-b border-white/10 px-4">
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              {role ? ROLE_LABEL[role] : "Menu"}
            </span>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="cursor-pointer rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Fechar menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <NavLinks items={items} onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </div>
    )}
    </>
  );
}
