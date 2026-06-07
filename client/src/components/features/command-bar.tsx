import type { ReactNode } from "react";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { useShellSettings } from "@/state/tracker-data";

interface CommandBarProps {
  meta?: ReactNode;
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
  testId?: string;
}

export function CommandBar({ meta, search, filters, actions, className, testId }: CommandBarProps) {
  const { settingMap } = useShellSettings();
  const dataDensity = settingMap.dataDensity ?? settingMap.density ?? "comfortable";

  return (
    <Surface
      variant="subtle"
      data-testid={testId}
      data-density={dataDensity}
      className={cn("page-toolbar flex flex-col gap-3 px-3 py-3", dataDensity === "dense" && "gap-2 py-2.5", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {meta ? <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{meta}</div> : <div />}
        {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      </div>
      {search || filters ? (
        <div className="flex flex-wrap items-center gap-2">
          {search ? <div className="min-w-[15rem] flex-1">{search}</div> : null}
          {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
        </div>
      ) : null}
    </Surface>
  );
}
