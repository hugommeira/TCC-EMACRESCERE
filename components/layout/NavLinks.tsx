"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/layout/Sidebar";

interface NavLinksProps {
  items:       NavItem[];
  onNavigate?: () => void;
  /**
   * "sidebar": no tablet (md) vira trilho só de ícones com rótulo curto
   * embaixo; no desktop (lg) volta a ser a lista completa.
   * "drawer": lista completa sempre (menu lateral do celular).
   */
  layout?:     "sidebar" | "drawer";
}

/** Item ativo: a própria rota ou uma sub-rota (a home do painel só ela mesma). */
export function isNavActive(pathname: string, href: string, items: NavItem[]) {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  // Sem isto, "/dashboard/patient" ficaria ativo junto com todas as outras.
  return !items.some((i) => i.href !== href && i.href.startsWith(`${href}/`) && pathname.startsWith(i.href));
}

export function NavLinks({ items, onNavigate, layout = "drawer" }: NavLinksProps) {
  const pathname = usePathname();
  const rail = layout === "sidebar";

  return (
    <nav className={cn("relative z-10 flex-1 space-y-1 overflow-y-auto px-3 py-4", rail && "md:px-2 lg:px-3")}>
      {items.map((item) => {
        const isActive = isNavActive(pathname, item.href, items);

        return (
          <Link
            key={item.href}
            href={item.href as Route}
            {...(onNavigate ? { onClick: onNavigate } : {})}
            title={rail ? item.label : undefined}
            className={cn(
              "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
              rail && "md:flex-col md:gap-1 md:px-1 md:py-2.5 md:text-[10.5px] md:leading-tight lg:flex-row lg:gap-3 lg:px-3 lg:text-sm",
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
            <span className={cn("flex-1 truncate", rail && "md:hidden lg:inline")}>{item.label}</span>
            {rail && (
              <span className="hidden w-full truncate text-center md:block lg:hidden">
                {item.short ?? item.label}
              </span>
            )}
            {item.badge !== undefined && (
              <span
                className={cn(
                  "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                  rail && "md:absolute md:right-1 md:top-1 lg:static",
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
  );
}
