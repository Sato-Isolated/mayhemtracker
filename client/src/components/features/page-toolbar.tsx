import type { ReactNode } from "react";
import { CommandBar } from "@/components/features/command-bar";

interface PageToolbarProps {
  meta?: ReactNode;
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
  testId?: string;
}

export function PageToolbar({ meta, search, filters, actions, className, testId }: PageToolbarProps) {
  return <CommandBar meta={meta} search={search} filters={filters} actions={actions} className={className} testId={testId} />;
}
