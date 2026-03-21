import type { ReactNode } from "react";
import { useShellSettings } from "@/state/tracker-data";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  const { settingMap } = useShellSettings();
  const showDescriptions = settingMap.showPageDescriptions !== "false";

  return (
    <section className="panel-surface relative overflow-hidden rounded-[1.2rem] px-4 py-3.5 max-sm:px-4 max-sm:py-3">
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[color-mix(in_oklch,var(--primary)_8%,transparent)] blur-[18px]" />
      <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
          <h1 className="mt-1.5 text-[1.55rem] font-semibold tracking-[-0.03em] text-foreground md:text-[1.8rem]">{title}</h1>
          {showDescriptions ? <p className="mt-2 max-w-2xl text-sm leading-5 text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex self-start flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
