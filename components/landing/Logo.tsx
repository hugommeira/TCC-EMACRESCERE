import Link from "next/link";

export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const color = variant === "dark" ? "text-brand-600" : "text-brand-300";
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2"
      aria-label="Emaerescere - voltar ao topo"
    >
      <span
        aria-hidden
        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-md ring-1 ring-brand-500/30 transition-transform duration-200 group-hover:scale-105`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" />
          <path d="M9 11h6" />
        </svg>
      </span>
      <span className={`font-display text-xl font-semibold tracking-tight ${color}`}>
        Emaerescere
      </span>
    </Link>
  );
}
