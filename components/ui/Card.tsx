import { cn } from "@/lib/utils";

interface CardProps {
  children:    React.ReactNode;
  className?:  string;
  hover?:      boolean;
  padding?:    "none" | "sm" | "md" | "lg";
  as?:         React.ElementType;
}

const paddingClasses = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

export function Card({
  children,
  className,
  hover  = false,
  padding = "md",
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        paddingClasses[padding],
        hover && "transition-shadow duration-200 hover:shadow-md",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children:   React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children:   React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-lg font-semibold text-gray-900", className)}>
      {children}
    </h3>
  );
}

export function CardFooter({
  children,
  className,
}: {
  children:   React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-between border-t border-gray-100 pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
