import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataRowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
  tone?: "neutral" | "success" | "error";
}

export function DataRow({ children, active = false, tone = "neutral", className, ...props }: DataRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-lg border bg-[color-mix(in_oklch,var(--card)_88%,var(--surface-1))] p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-160 hover:-translate-y-px hover:border-[color-mix(in_oklch,var(--primary)_32%,var(--border))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "border-[color-mix(in_oklch,var(--primary)_50%,var(--border))] bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))]",
        tone === "success" && active && "border-[color-mix(in_oklch,var(--success)_42%,var(--border))]",
        tone === "error" && active && "border-[color-mix(in_oklch,var(--error)_42%,var(--border))]",
        !active && "border-border/70",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
