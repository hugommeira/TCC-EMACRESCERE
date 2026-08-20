import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children:   React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title:        string;
  description?: string;
  badge?:       string;
  action?:      React.ReactNode;
}

export function PageHeader({ title, description, badge, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {badge && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
            {badge}
          </span>
        )}
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

type StatTone = "brand" | "teal" | "amber" | "rose" | "indigo" | "slate";

const TONE_MAP: Record<StatTone, { bg: string; iconBg: string; iconText: string }> = {
  brand:  { bg: "bg-white", iconBg: "bg-brand-50",  iconText: "text-brand-600"  },
  teal:   { bg: "bg-white", iconBg: "bg-teal-50",   iconText: "text-teal-600"   },
  amber:  { bg: "bg-white", iconBg: "bg-amber-50",  iconText: "text-amber-600"  },
  rose:   { bg: "bg-white", iconBg: "bg-rose-50",   iconText: "text-rose-600"   },
  indigo: { bg: "bg-white", iconBg: "bg-indigo-50", iconText: "text-indigo-600" },
  slate:  { bg: "bg-white", iconBg: "bg-slate-100", iconText: "text-slate-600"  },
};

interface StatCardProps {
  label:    string;
  value:    string;
  hint?:    string;
  tone?:    StatTone;
  icon?:    React.ReactNode;
  trend?:   { value: string; up?: boolean };
  href?:    string;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "brand",
  icon,
  trend,
  href,
}: StatCardProps) {
  const t = TONE_MAP[tone];
  const Wrapper: React.ElementType = href ? "a" : "div";

  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        "group rounded-2xl border border-slate-200 p-5 transition-all duration-200",
        t.bg,
        href ? "cursor-pointer hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md" : "",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
            {value}
          </p>
          {(hint || trend) && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                    trend.up
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700",
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    {trend.up ? (
                      <path d="M7 17l5-5 4 4 5-5M16 7h5v5" />
                    ) : (
                      <path d="M7 7l5 5 4-4 5 5M16 17h5v-5" />
                    )}
                  </svg>
                  {trend.value}
                </span>
              )}
              {hint}
            </p>
          )}
        </div>

        {icon && (
          <span
            className={cn(
              "inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl ring-1 ring-inset",
              t.iconBg,
              t.iconText,
              tone === "brand" ? "ring-brand-100" :
              tone === "teal" ? "ring-teal-100" :
              tone === "amber" ? "ring-amber-100" :
              tone === "rose" ? "ring-rose-100" :
              tone === "indigo" ? "ring-indigo-100" :
              "ring-slate-200",
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </Wrapper>
  );
}

interface SectionCardProps {
  title:        string;
  description?: string;
  action?:      React.ReactNode;
  children:     React.ReactNode;
  className?:   string;
}

export function SectionCard({ title, description, action, children, className }: SectionCardProps) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

interface EmptyStateProps {
  icon?:        React.ReactNode;
  title:        string;
  description?: string;
  action?:      React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
      {icon && (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
          {icon}
        </span>
      )}
      <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
