"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { isNavActive } from "@/components/layout/NavLinks";
import type { NavItem } from "@/components/layout/Sidebar";

// Abas de app no rodapé do celular (abaixo de md). Só para menus de até 5
// itens (paciente e médico); o admin continua com o menu lateral.
// O médico usa o tom escuro, como no resto da área profissional.
export function BottomNav({ items, role }: { items: NavItem[]; role: Role }) {
  const pathname = usePathname();
  const dark = role === "DOCTOR";

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden",
        dark ? "border-white/10 bg-ink-950/95" : "border-slate-200 bg-white/95",
      )}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href, items);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href as Route}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors",
                  dark
                    ? active ? "text-white" : "text-white/55 active:text-white"
                    : active ? "text-brand-700" : "text-slate-500 active:text-slate-900",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200",
                    active && (dark ? "bg-white/15 text-brand-300" : "bg-brand-50 text-brand-600"),
                  )}
                  aria-hidden
                >
                  {item.icon}
                </span>
                <span className="max-w-full truncate">{item.short ?? item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
