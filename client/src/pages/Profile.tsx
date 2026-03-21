import { useEffect } from "react";
import { Trophy, User2 } from "lucide-react";
import { MetricTile } from "@/components/features/metric-tile";
import { PageIntro } from "@/components/features/page-intro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Surface } from "@/components/ui/surface";
import { formatDate } from "@/lib/tracker-utils";
import { useAnalytics } from "@/state/tracker-data";

export function ProfilePage() {
  const { profile, dashboard, championStats, loadProfile, loadDashboard, loadChampionStats } = useAnalytics();

  useEffect(() => {
    if (!profile.data && !profile.loading) {
      void loadProfile();
    }
    if (!dashboard.data && !dashboard.loading) {
      void loadDashboard();
    }
    if (!championStats.data && !championStats.loading) {
      void loadChampionStats();
    }
  }, [
    championStats.data,
    championStats.loading,
    dashboard.data,
    dashboard.loading,
    loadChampionStats,
    loadDashboard,
    loadProfile,
    profile.data,
    profile.loading,
  ]);

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

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Performance records</h2>
          <p className="text-sm text-muted-foreground">Premier socle de la future vue profil détaillée.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricTile label="Highest kills" value={records.highestKills} />
          <MetricTile label="Highest assists" value={records.highestAssists} />
          <MetricTile label="Highest damage" value={records.highestDamage.toLocaleString("fr-FR")} />
          <MetricTile label="Highest gold" value={records.highestGold.toLocaleString("fr-FR")} />
          <MetricTile label="Pentakills" value={records.pentakills} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Preferred pool</CardTitle>
            <CardDescription>Les champions qui décrivent le mieux l’identité du profil local.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPool.map((entry) => (
              <Surface key={String(entry.championId ?? entry.championName)} className="rounded-[1rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{entry.championName ?? `Champion ${entry.championId ?? "-"}`}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{entry.matches} games · {entry.averageKda} KDA</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-foreground">{entry.winRate}%</div>
                    <div className="mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_oklch,var(--accent)_58%,var(--surface-2)),color-mix(in_oklch,var(--primary)_76%,var(--surface-1)))]"
                        style={{ width: `${entry.winRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Surface>
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
                <div key={item.key} className="flex min-w-0 flex-col items-center gap-2">
                  <div className="bg-[color-mix(in_oklch,var(--card)_74%,var(--surface-3))] flex h-32 w-full items-end justify-center rounded-[1rem] border border-border/70 px-2 pb-2">
                    <div
                      className="w-full rounded-full bg-[linear-gradient(180deg,color-mix(in_oklch,var(--accent)_58%,var(--surface-2)),color-mix(in_oklch,var(--primary)_76%,var(--surface-1)))]"
                      style={{ height: `${Math.max(item.winRate, item.matches ? 14 : 4)}%` }}
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
      </div>
    </div>
  );
}
