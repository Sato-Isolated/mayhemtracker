import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const surfaceVariants = cva("", {
  variants: {
    variant: {
      soft: "border border-[var(--border-ui)] bg-[var(--surface-card)]",
      subtle:
        "border border-[var(--border-ui)] bg-[color-mix(in_oklch,var(--card)_66%,var(--surface-2))]",
      elevated:
        "border border-[var(--border-ui)] bg-[color-mix(in_oklch,var(--card)_84%,var(--surface-1))]",
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
