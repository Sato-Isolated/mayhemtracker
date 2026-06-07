import type { ReactNode } from "react";
import { useShellSettings } from "@/state/tracker-data";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  const { settingMap } = useShellSettings();
  const showDescriptions = settingMap.showPageDescriptions !== "false";

  return (
    <section className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-4">
      <div className="min-w-0 max-w-3xl">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-1.5 text-2xl font-semibold leading-tight text-foreground">{title}</h1>
        {showDescriptions ? <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </section>
  );
}
