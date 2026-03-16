import type { ReactNode } from "react";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <section className="panel-surface relative overflow-hidden px-[1.35rem] py-[1.25rem] rounded-[1.6rem] max-sm:px-4 max-sm:py-4 max-sm:pt-[1.1rem]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[color-mix(in_oklch,var(--primary)_12%,transparent)] blur-[18px]" />
      <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
          <h1 className="mt-2 text-[1.95rem] font-semibold tracking-[-0.03em] text-foreground md:text-[2.2rem]">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-[0.95rem]">{description}</p>
        </div>
        {actions ? <div className="self-start flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}