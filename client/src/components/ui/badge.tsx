import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-[color-mix(in_oklch,var(--primary)_38%,var(--border))] bg-[color-mix(in_oklch,var(--primary)_16%,var(--card))] text-[color-mix(in_oklch,var(--primary)_78%,var(--foreground))]",
        secondary: "border-border/80 bg-secondary text-secondary-foreground",
        outline: "border-border/80 bg-[color-mix(in_oklch,var(--card)_82%,var(--surface-2))] text-foreground",
        success: "border-[color-mix(in_oklch,var(--success)_40%,var(--border))] bg-[color-mix(in_oklch,var(--success)_18%,var(--card))] text-[color-mix(in_oklch,var(--success)_78%,var(--foreground))]",
        error: "border-[color-mix(in_oklch,var(--error)_40%,var(--border))] bg-[color-mix(in_oklch,var(--error)_18%,var(--card))] text-[color-mix(in_oklch,var(--error)_78%,var(--foreground))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
