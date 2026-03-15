import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  icon?: ReactNode;
}

export function MetricTile({
  label,
  value,
  hint,
  className,
  icon,
}: MetricTileProps) {
  return (
    <div className={cn("metric-tile metric-tile-shell p-5", className)}>
      <div className="metric-tile-glow" />
      <div className="metric-tile-grid flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        {icon ? <span className="metric-tile-icon">{icon}</span> : null}
      </div>
      <div className="metric-tile-value mt-4 text-3xl font-semibold tracking-tight text-foreground">{value}</div>
      {hint ? <p className="metric-tile-hint mt-2 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}