import type { ReactNode } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  cta?: ReactNode;
  secondaryCta?: ReactNode;
  variant?: "default" | "warning";
};

export function EmptyState({
  title,
  description,
  icon,
  cta,
  secondaryCta,
  variant = "default",
}: EmptyStateProps) {
  const Icon = variant === "warning" ? AlertTriangle : Sparkles;

  return (
    <div
      className={cn(
        "rounded-[1.75rem] border p-8 shadow-lg shadow-black/5",
        variant === "warning"
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border/70 bg-card/80",
      )}
    >
      <div className="flex flex-col gap-6">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl border",
            variant === "warning"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border-brand/20 bg-brand-muted text-brand-foreground",
          )}
        >
          {icon ?? <Icon className="size-5" />}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {cta || secondaryCta ? (
          <div className="flex flex-wrap gap-3">
            {cta}
            {secondaryCta}
          </div>
        ) : null}
      </div>
    </div>
  );
}
