import type { ReactNode } from "react";
import { MetricCard } from "@/components/features/metric-card";

interface MetricTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  icon?: ReactNode;
}

export function MetricTile({ label, value, hint, className, icon }: MetricTileProps) {
  return <MetricCard label={label} value={value} hint={hint} icon={icon} className={className} />;
}
