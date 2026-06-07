import type { ReactNode } from "react";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

interface DataPanelProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  testId?: string;
}

export function DataPanel({ title, description, actions, children, className, contentClassName, testId }: DataPanelProps) {
  return (
    <Surface variant="soft" className={cn("overflow-hidden", className)} data-testid={testId}>
      {title || description || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-3">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-3", contentClassName)}>{children}</div>
    </Surface>
  );
}
