import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface SectionLabelProps extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean;
}

const SectionLabel = React.forwardRef<HTMLParagraphElement, SectionLabelProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "p";
    return <Comp className={cn("text-[11px] uppercase tracking-[0.16em] text-muted-foreground", className)} ref={ref} {...props} />;
  },
);
SectionLabel.displayName = "SectionLabel";

export { SectionLabel };
