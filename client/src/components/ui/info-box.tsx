import * as React from "react";
import { cn } from "@/lib/utils";

const InfoBox = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-[1rem] border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  ),
);
InfoBox.displayName = "InfoBox";

export { InfoBox };
