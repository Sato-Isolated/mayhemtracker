import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-160 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_10px_24px_-18px_color-mix(in_oklch,var(--primary)_90%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary)_88%,black)]",
        secondary: "border-border/80 bg-secondary text-secondary-foreground hover:border-[color-mix(in_oklch,var(--primary)_36%,var(--border))] hover:bg-[color-mix(in_oklch,var(--secondary)_84%,var(--accent))]",
        outline: "border-border/80 bg-card text-foreground hover:border-[color-mix(in_oklch,var(--primary)_36%,var(--border))] hover:bg-[var(--hover-overlay)]",
        ghost: "border-transparent text-foreground hover:border-border/70 hover:bg-[var(--hover-overlay)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive)_88%,black)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6",
        icon: "size-10",
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
