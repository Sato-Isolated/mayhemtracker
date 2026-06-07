import type { ReactNode } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "info" | "success" | "warning" | "error";

const toneToVariant: Record<StatusTone, BadgeProps["variant"]> = {
  neutral: "outline",
  info: "default",
  success: "success",
  warning: "secondary",
  error: "error",
};

interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ children, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <Badge variant={toneToVariant[tone]} className={cn("whitespace-nowrap", className)}>
      {children}
    </Badge>
  );
}
