import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name:       string;
  src?:       string | null;
  size?:      AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6  w-6  text-xs",
  sm: "h-8  w-8  text-sm",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const sizePx: Record<AvatarSize, number> = {
  xs: 24, sm: 32, md: 40, lg: 48, xl: 64,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// Cores determinísticas por nome
function getColor(name: string): string {
  const colors = [
    "bg-blue-500",   "bg-green-500",  "bg-purple-500",
    "bg-orange-500", "bg-pink-500",   "bg-teal-500",
    "bg-indigo-500", "bg-rose-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index] ?? "bg-gray-500";
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const px = sizePx[size];

  if (src) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          sizeClasses[size],
          className,
        )}
      >
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={`${px}px`}
        />
      </div>
    );
  }

  return (
    <div
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "font-semibold text-white select-none",
        sizeClasses[size],
        getColor(name),
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
