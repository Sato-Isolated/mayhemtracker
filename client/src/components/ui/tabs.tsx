import type * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export function Tabs(props: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root {...props} />;
}

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("tabs-shell inline-flex h-11 items-center rounded-xl p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-card/92 data-[state=active]:text-foreground data-[state=active]:shadow-[0_10px_22px_-18px_color-mix(in_oklch,var(--foreground)_28%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4 outline-none", className)} {...props} />;
}
