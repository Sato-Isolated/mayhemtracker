import type { ReactNode } from "react";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <Surface variant="subtle" className={cn("flex min-h-52 flex-col items-center justify-center gap-3 border-dashed px-6 py-8 text-center", className)}>
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-1 max-w-md text-sm leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </Surface>
  );
}
