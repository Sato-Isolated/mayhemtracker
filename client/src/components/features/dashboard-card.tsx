import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description: string;
  badge?: string;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

export function DashboardCard({ title, description, badge, loading, className, children }: DashboardCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {loading ? <Badge variant="secondary">Loading</Badge> : null}
            {badge ? <Badge variant="outline">{badge}</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}
