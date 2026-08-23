"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/layout/Sidebar";

interface NavLinksProps {
  items:     NavItem[];
  onNavigate?: () => void;
}

export function NavLinks({ items, onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="relative z-10 flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href as Route}
            {...(onNavigate ? { onClick: onNavigate } : {})}
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
  );
}
