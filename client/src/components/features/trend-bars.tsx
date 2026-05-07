import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPoint } from "@/lib/types";

export function TrendBars({ items }: { items: TrendPoint[] }) {
  const maxMatches = Math.max(...items.map((item) => item.matches), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Win-rate trend</CardTitle>
        <CardDescription>Rolling view of recent days with volume and output.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-3 lg:grid-cols-14">
          {items.map((item) => (
            <div key={item.key} className="flex min-w-0 flex-col items-center gap-2">
              <div className="bg-[color-mix(in_oklch,var(--card)_74%,var(--surface-3))] flex h-36 w-full items-end justify-center rounded-[1rem] border border-border/70 px-2 pb-2">
                <div
                  className="w-full rounded-full bg-[linear-gradient(180deg,color-mix(in_oklch,var(--accent)_58%,var(--surface-2)),color-mix(in_oklch,var(--primary)_76%,var(--surface-1)))]"
                  style={{ height: `${Math.max((item.matches / maxMatches) * 100, item.matches ? 16 : 4)}%` }}
                  title={`${item.label} · ${item.matches} game(s) · ${item.winRate}% WR`}
                />
              </div>
              <div className="text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</div>
                <div className="text-xs text-foreground">{item.winRate}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}