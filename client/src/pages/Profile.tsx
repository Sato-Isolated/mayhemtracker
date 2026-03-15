import { Trophy, User2 } from "lucide-react";
import { MetricTile } from "@/components/features/metric-tile";
import { PageIntro } from "@/components/features/page-intro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/tracker-utils";
import { useTrackerAppData } from "@/state/tracker-data";

export function ProfilePage() {
  const { profile, dashboard, championStats } = useTrackerAppData();

  if (!profile.data) {
    return <PageIntro eyebrow="Player identity" title="Profile loading" description="Les agrégations de profil se remplissent à partir des matchs locaux synchronisés." />;
  }

  const { overview, currentStreak, bestLossStreak, bestWinStreak, records } = profile.data;
  const trend = dashboard.data?.trend ?? [];
  const topPool = championStats.data?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Player identity"
        title={overview.trackedPlayerName}
        description={`Dernière activité ${formatDate(overview.latestMatchAt)} · ${overview.totalMatches} matchs analysés.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Global win rate" value={`${overview.winRate}%`} hint={`${overview.wins} wins · ${overview.losses} losses`} icon={<User2 className="h-4 w-4 text-primary" />} />
        <MetricTile label="Average KDA" value={overview.averageKda.toFixed(2)} hint="Calculé sur le joueur suivi" />
        <MetricTile label="Current streak" value={currentStreak.value} hint={currentStreak.type === "neutral" ? "No active streak" : currentStreak.type} />
        <MetricTile label="Best streak" value={bestWinStreak} hint={`Worst skid ${bestLossStreak}`} icon={<Trophy className="h-4 w-4 text-primary" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance records</CardTitle>
          <CardDescription>Premier socle de la future vue profil détaillée.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricTile label="Highest kills" value={records.highestKills} />
          <MetricTile label="Highest assists" value={records.highestAssists} />
          <MetricTile label="Highest damage" value={records.highestDamage.toLocaleString("fr-FR")} />
          <MetricTile label="Highest gold" value={records.highestGold.toLocaleString("fr-FR")} />
          <MetricTile label="Pentakills" value={records.pentakills} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Preferred pool</CardTitle>
            <CardDescription>Les champions qui décrivent le mieux l’identité du profil local.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPool.map((entry) => (
              <div key={String(entry.championId ?? entry.championName)} className="surface-soft rounded-[1rem] p-4">
                <div className="font-medium">{entry.championName ?? `Champion ${entry.championId ?? "-"}`}</div>
                <div className="mt-1 text-sm text-muted-foreground">{entry.matches} games · {entry.winRate}% WR · {entry.averageKda} KDA</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent form</CardTitle>
            <CardDescription>Lecture courte du rendement récent sans sortir du profil.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3 lg:grid-cols-14">
              {trend.map((item) => (
                <div key={item.key} className="space-y-2 text-center">
                  <div className="chart-track mx-auto flex h-24 w-full items-end rounded-[0.9rem] border border-border/70 p-2">
                    <div className="w-full rounded-full bg-primary/70" style={{ height: `${Math.max(item.winRate, item.matches ? 14 : 4)}%` }} />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}