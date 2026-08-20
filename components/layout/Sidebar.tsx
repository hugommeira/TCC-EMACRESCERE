"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface NavItem {
  label:  string;
  href:   string;
  icon:   React.ReactNode;
  badge?: string | number;
}

interface SidebarProps {
  role:     Role;
  userName: string;
  items:    NavItem[];
}

const ROLE_LABEL: Record<Role, string> = {
  PATIENT:    "Paciente",
  DOCTOR:     "Médico",
  ADMIN:      "Administrador",
  SUPER_ADMIN: "Super Admin",
};

export function Sidebar({ items, userName, role }: SidebarProps) {
  const pathname = usePathname();
  const initial  = userName.charAt(0).toUpperCase();

  return (
    <aside className="relative hidden h-screen w-64 flex-col overflow-hidden bg-gradient-to-b from-brand-600 via-brand-700 to-teal-800 text-white shadow-xl lg:flex">
      {/* Glow decorativo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl"
      />

      {/* Logo */}
      <div className="relative z-10 flex h-16 flex-none items-center gap-2.5 border-b border-white/10 px-5">
        <span
          aria-hidden
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-600 shadow-md ring-1 ring-white/30"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" />
            <path d="M9 11h6" />
          </svg>
        </span>
        <span className="font-display text-lg font-semibold tracking-tight text-white">
          Emaerescere
        </span>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white text-brand-700 shadow-lg shadow-black/10"
                  : "text-white/85 hover:bg-white/10 hover:text-white",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex-none transition-colors",
                  isActive ? "text-brand-600" : "text-white/70 group-hover:text-white",
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                    isActive
                      ? "bg-brand-500 text-white"
                      : "bg-white/15 text-white ring-1 ring-white/20",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="relative z-10 flex-none border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm ring-1 ring-white/15">
          <span
            aria-hidden
            className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-sm font-semibold text-brand-700 shadow ring-2 ring-white/40"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="truncate text-[11px] text-white/70">{ROLE_LABEL[role]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
