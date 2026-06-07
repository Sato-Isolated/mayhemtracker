import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "accent" | "success" | "error";
  className?: string;
}

export function MetricCard({ label, value, hint, icon, tone = "neutral", className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "metric-tile rounded-lg border bg-[color-mix(in_oklch,var(--card)_86%,var(--surface-1))] px-3.5 py-3 shadow-[0_16px_34px_-32px_color-mix(in_oklch,black_80%,transparent)]",
        tone === "accent" && "border-[color-mix(in_oklch,var(--primary)_36%,var(--border))]",
        tone === "success" && "border-[color-mix(in_oklch,var(--success)_34%,var(--border))]",
        tone === "error" && "border-[color-mix(in_oklch,var(--error)_34%,var(--border))]",
        tone === "neutral" && "border-border/75",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {icon ? <span className="inline-flex size-7 items-center justify-center rounded-md border border-border/70 bg-secondary text-primary">{icon}</span> : null}
      </div>
      <div className="mt-2 text-2xl font-semibold leading-none text-foreground">{value}</div>
      {hint ? <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
