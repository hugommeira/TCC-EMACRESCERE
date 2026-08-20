import { cn } from "@/lib/utils";
import type { ConsultationStatus, PaymentStatus } from "@prisma/client";

type BadgeVariant = "blue" | "green" | "yellow" | "red" | "gray" | "purple";

interface BadgeProps {
  children:  React.ReactNode;
  variant?:  BadgeVariant;
  dot?:      boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  blue:   "bg-blue-100   text-blue-800   ring-blue-200",
  green:  "bg-green-100  text-green-800  ring-green-200",
  yellow: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  red:    "bg-red-100    text-red-800    ring-red-200",
  gray:   "bg-gray-100   text-gray-700   ring-gray-200",
  purple: "bg-purple-100 text-purple-800 ring-purple-200",
};

const dotClasses: Record<BadgeVariant, string> = {
  blue:   "bg-blue-500",
  green:  "bg-green-500",
  yellow: "bg-yellow-500",
  red:    "bg-red-500",
  gray:   "bg-gray-400",
  purple: "bg-purple-500",
};

export function Badge({
  children,
  variant  = "gray",
  dot      = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        "text-xs font-medium ring-1 ring-inset",
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            dotClasses[variant],
          )}
        />
      )}
      {children}
    </span>
  );
}

// ─── Status badges prontos ────────────────────────────────────────────────────

export function ConsultationStatusBadge({
  status,
}: {
  status: ConsultationStatus;
}) {
  const map: Record<ConsultationStatus, { label: string; variant: BadgeVariant }> = {
    SCHEDULED:   { label: "Agendada",      variant: "blue" },
    WAITING:     { label: "Aguardando",    variant: "yellow" },
    IN_PROGRESS: { label: "Em andamento",  variant: "green" },
    COMPLETED:   { label: "Concluída",     variant: "gray" },
    CANCELLED:   { label: "Cancelada",     variant: "red" },
    NO_SHOW:     { label: "Não compareceu", variant: "red" },
  };

  const { label, variant } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
    PENDING:   { label: "Pendente",    variant: "yellow" },
    CONFIRMED: { label: "Confirmado",  variant: "blue" },
    RECEIVED:  { label: "Pago",        variant: "green" },
    OVERDUE:   { label: "Vencido",     variant: "red" },
    REFUNDED:  { label: "Reembolsado", variant: "purple" },
    CANCELLED: { label: "Cancelado",   variant: "gray" },
  };

  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
