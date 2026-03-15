import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl border border-transparent text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px",
  {
    variants: {
      variant: {
        default: "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_88%,white),color-mix(in_oklch,var(--primary)_72%,var(--accent)))] text-primary-foreground shadow-[0_16px_30px_-18px_color-mix(in_oklch,var(--primary)_48%,transparent)] hover:shadow-[0_20px_34px_-18px_color-mix(in_oklch,var(--primary)_56%,transparent)] hover:saturate-110",
        secondary: "border-border/70 bg-[color-mix(in_oklch,var(--secondary)_82%,var(--card))] text-secondary-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_58%,transparent)] hover:bg-[color-mix(in_oklch,var(--secondary)_72%,var(--accent))]",
        outline: "border-border/80 bg-[color-mix(in_oklch,var(--card)_80%,var(--surface-2))] text-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_55%,transparent)] hover:border-primary/25 hover:bg-[color-mix(in_oklch,var(--accent)_22%,var(--card))]",
        ghost: "text-foreground hover:bg-[color-mix(in_oklch,var(--accent)_20%,transparent)]",
        destructive: "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--destructive)_88%,white),color-mix(in_oklch,var(--destructive)_76%,var(--accent)))] text-destructive-foreground shadow-[0_16px_30px_-18px_color-mix(in_oklch,var(--destructive)_45%,transparent)] hover:saturate-110",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
