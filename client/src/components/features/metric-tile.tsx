import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  icon?: ReactNode;
}

export function MetricTile({ label, value, hint, className, icon }: MetricTileProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-[1rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--card)_88%,var(--surface-1)),color-mix(in_oklch,var(--surface-2)_90%,var(--background)))] p-4 shadow-[0_12px_28px_-20px_color-mix(in_oklch,var(--foreground)_18%,transparent)]", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        {icon ? (
          <span className="relative z-[1] inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-[color-mix(in_oklch,var(--card)_74%,var(--surface-2))] shadow-[inset_0_1px_0_color-mix(in_oklch,white_50%,transparent)]">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      {hint ? <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
