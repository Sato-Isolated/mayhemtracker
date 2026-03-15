import type { ReactNode } from "react";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <section className="page-intro-shell panel-surface rounded-[1.6rem]">
      <div className="page-intro-grid flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
          <h1 className="mt-2 text-[1.95rem] font-semibold tracking-[-0.03em] text-foreground md:text-[2.2rem]">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-[0.95rem]">{description}</p>
        </div>
        {actions ? <div className="page-intro-actions flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}