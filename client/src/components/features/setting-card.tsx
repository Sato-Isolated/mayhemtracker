import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoBox } from "@/components/ui/info-box";
import { cn } from "@/lib/utils";

interface SettingCardProps {
  title: ReactNode;
  description: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

function SettingCard({ title, description, hint, className, children }: SettingCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hint ? <InfoBox>{hint}</InfoBox> : null}
        {children}
      </CardContent>
    </Card>
  );
}

export { SettingCard };
