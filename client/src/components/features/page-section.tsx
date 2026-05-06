import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageSectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageSection({ title, description, actions, children, className }: PageSectionProps) {
  return (
    <section className={cn("space-y-3.5", className)}>
      {title || description || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-2.5">
          <div className="min-w-0">
            {title ? <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
