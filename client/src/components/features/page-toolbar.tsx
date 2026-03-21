import type { ReactNode } from "react";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { useShellSettings } from "@/state/tracker-data";

interface PageToolbarProps {
  meta?: ReactNode;
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
  testId?: string;
}

export function PageToolbar({ meta, search, filters, actions, className, testId }: PageToolbarProps) {
  const { settingMap } = useShellSettings();
  const sticky = settingMap.stickyToolbars !== "false";
  const dataDensity = settingMap.dataDensity ?? settingMap.density ?? "comfortable";

  return (
    <Surface
      variant="subtle"
      data-testid={testId}
      data-density={dataDensity}
      className={cn(
        "page-toolbar rounded-[1.05rem] px-4 py-3",
        sticky && "page-toolbar-sticky sticky top-[5.4rem] z-[8] max-[1100px]:static",
        dataDensity === "dense" && "px-3 py-2.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {meta ? <div className="min-w-0 flex flex-1 flex-wrap items-center gap-2">{meta}</div> : <div />}
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {search || filters ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {search ? <div className="min-w-[16rem] flex-1">{search}</div> : null}
          {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
        </div>
      ) : null}
    </Surface>
  );
}
