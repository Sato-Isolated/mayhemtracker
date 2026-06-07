import type { ReactNode } from "react";
import { PageHeader } from "@/components/features/page-header";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />;
}
