import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[color-mix(in_oklch,var(--primary)_22%,var(--card))] text-[color-mix(in_oklch,var(--primary)_80%,var(--foreground))] shadow-[inset_0_1px_0_color-mix(in_oklch,white_45%,transparent)]",
        secondary: "border-transparent bg-secondary/85 text-secondary-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_55%,transparent)]",
        outline: "border-border/80 bg-[color-mix(in_oklch,var(--card)_82%,var(--surface-2))] text-foreground",
        success: "border-transparent bg-[color-mix(in_oklch,var(--success)_22%,var(--card))] text-[color-mix(in_oklch,var(--success)_82%,var(--foreground))] shadow-[inset_0_1px_0_color-mix(in_oklch,white_40%,transparent)]",
        error: "border-transparent bg-[color-mix(in_oklch,var(--error)_22%,var(--card))] text-[color-mix(in_oklch,var(--error)_80%,var(--foreground))] shadow-[inset_0_1px_0_color-mix(in_oklch,white_40%,transparent)]",
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
