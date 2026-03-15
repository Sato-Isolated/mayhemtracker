import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-2xl border px-4 py-3 text-sm", {
  variants: {
    variant: {
      default: "border-border bg-card/80 text-foreground",
      destructive: "border-[color:color-mix(in_oklch,var(--error)_34%,var(--border))] bg-[color-mix(in_oklch,var(--error)_14%,var(--card))] text-[var(--error-foreground)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-medium", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
