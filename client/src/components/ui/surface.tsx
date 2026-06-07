import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const surfaceVariants = cva("", {
  variants: {
    variant: {
      soft: "rounded-lg border border-[var(--border-ui)] bg-[var(--surface-card)] shadow-[0_14px_36px_-34px_color-mix(in_oklch,black_70%,transparent)]",
      subtle:
        "rounded-lg border border-[var(--border-ui)] bg-[color-mix(in_oklch,var(--card)_76%,var(--surface-2))]",
      elevated:
        "rounded-lg border border-[var(--border-ui)] bg-[color-mix(in_oklch,var(--card)_88%,var(--surface-1))] shadow-[0_20px_48px_-38px_color-mix(in_oklch,black_80%,transparent)]",
    },
  },
  defaultVariants: {
    variant: "soft",
  },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  asChild?: boolean;
}

const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return <Comp className={cn(surfaceVariants({ variant }), className)} ref={ref} {...props} />;
  },
);
Surface.displayName = "Surface";

export { Surface, surfaceVariants };
