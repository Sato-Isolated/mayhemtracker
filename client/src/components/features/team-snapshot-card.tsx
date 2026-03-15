import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactStat } from "@/lib/stats-utils";

interface TeamSnapshotCardProps {
  teamId: number;
  win?: boolean;
  isPlayerTeam: boolean;
  totalKills: number;
  totalDamage: number;
  totalGold: number;
}

export function TeamSnapshotCard({
  teamId,
  win,
  isPlayerTeam,
  totalKills,
  totalDamage,
  totalGold,
}: TeamSnapshotCardProps) {
  return (
    <Card className={isPlayerTeam ? "border-primary/40" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Team {teamId}</CardTitle>
            <CardDescription>{win ? "Victory" : "Defeat or unknown"}</CardDescription>
          </div>
          {isPlayerTeam ? <Badge variant="default">Tracked side</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <div className="surface-soft rounded-[1rem] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Kills</div>
          <div className="mt-2 text-2xl font-semibold">{totalKills}</div>
        </div>
        <div className="surface-soft rounded-[1rem] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Damage</div>
          <div className="mt-2 text-2xl font-semibold">{formatCompactStat(totalDamage)}</div>
        </div>
        <div className="surface-soft rounded-[1rem] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Gold</div>
          <div className="mt-2 text-2xl font-semibold">{formatCompactStat(totalGold)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
