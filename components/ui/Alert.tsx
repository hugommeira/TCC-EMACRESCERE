import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  title?:    string;
  children:  React.ReactNode;
  variant?:  AlertVariant;
  icon?:     React.ReactNode;
  className?: string;
  onClose?:  () => void;
}

const variantClasses: Record<AlertVariant, { wrapper: string; title: string; icon: string }> = {
  info: {
    wrapper: "bg-blue-50   border-blue-200   text-blue-800",
    title:   "text-blue-900",
    icon:    "text-blue-500",
  },
  success: {
    wrapper: "bg-green-50  border-green-200  text-green-800",
    title:   "text-green-900",
    icon:    "text-green-500",
  },
  warning: {
    wrapper: "bg-yellow-50 border-yellow-200 text-yellow-800",
    title:   "text-yellow-900",
    icon:    "text-yellow-500",
  },
  error: {
    wrapper: "bg-red-50    border-red-200    text-red-800",
    title:   "text-red-900",
    icon:    "text-red-500",
  },
};

export function Alert({
  title,
  children,
  variant  = "info",
  icon,
  className,
  onClose,
}: AlertProps) {
  const classes = variantClasses[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-sm",
        classes.wrapper,
        className,
      )}
    >
      {icon && (
        <span className={cn("mt-0.5 shrink-0", classes.icon)} aria-hidden>
          {icon}
        </span>
      )}

      <div className="flex-1 space-y-1">
        {title && (
          <p className={cn("font-semibold", classes.title)}>{title}</p>
        )}
        <div>{children}</div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Fechar alerta"
          className="ml-auto shrink-0 opacity-60 transition-opacity hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}
