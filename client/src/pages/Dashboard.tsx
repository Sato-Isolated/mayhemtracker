import { Clock3, Flame, Sparkles, Sword, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { ActivityHeatmap } from "@/components/features/activity-heatmap";
import { DashboardCard } from "@/components/features/dashboard-card";
import { MetricTile } from "@/components/features/metric-tile";
import { PageIntro } from "@/components/features/page-intro";
import { TrendBars } from "@/components/features/trend-bars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";
import { useTrackerAppData, useTrackerMatchData } from "@/state/tracker-data";

export function DashboardPage() {
  const { dashboard, champions, loadDashboard } = useTrackerAppData();
  const { syncMatches } = useTrackerMatchData();

  if (!dashboard.data) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Command center"
          title="Dashboard loading"
          description="Le premier dashboard produit se branche sur les nouvelles agrégations locales."
          actions={<Button onClick={() => void loadDashboard()}>Recharger</Button>}
        />
      </div>
    );
  }

  const { overview, recentSession, streak, activity, trend, topChampions, topAugments, recentMatches } = dashboard.data;
  const streakLabel = streak.type === "neutral" ? "No active streak" : `${streak.type === "win" ? "Win" : "Loss"} streak`;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Command center"
        title={`${overview.trackedPlayerName} · ${overview.winRate}% WR`}
        description="Synthèse immédiate, signaux récents et accès direct à l’historique sans bloquer la première lecture utile."
        actions={
          <>
            <Button onClick={() => void syncMatches()}>Synchroniser</Button>
            <Button variant="outline" asChild>
              <Link to="/history">Voir l’historique</Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-4 items-stretch max-[1100px]:grid-cols-1 panel-surface p-4" data-testid="dashboard-hero">
        <div className="min-w-0 flex flex-col">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Live summary</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{overview.trackedPlayerName} is sitting at {overview.winRate}% win rate.</h2>
          <div className="flex flex-wrap gap-[0.6rem] mt-3">
            <span className="status-chip inline-flex items-center gap-[0.55rem] rounded-full px-[0.72rem] py-[0.42rem] text-[0.76rem] status-chip-strong">{overview.totalMatches} tracked matches</span>
            <span className="status-chip inline-flex items-center gap-[0.55rem] rounded-full px-[0.72rem] py-[0.42rem] text-[0.76rem]">{recentSession.matches} games on the last 24h</span>
            <span className="status-chip inline-flex items-center gap-[0.55rem] rounded-full px-[0.72rem] py-[0.42rem] text-[0.76rem]">{streakLabel}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1 content-stretch max-[1100px]:grid-cols-1 mt-4">
            <div className="min-w-0 surface-soft rounded-[1rem] p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Match volume</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{overview.totalMatches}</div>
              <div className="mt-1 text-xs text-muted-foreground">{overview.wins} wins · {overview.losses} losses tracked locally</div>
            </div>
            <div className="min-w-0 surface-soft rounded-[1rem] p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Baseline form</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{overview.winRate}%</div>
              <div className="mt-1 text-xs text-muted-foreground">Overall win rate across the tracked sample</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[0.85rem]">
          <div className="p-[0.95rem] rounded-[1rem] surface-elevated">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Session pulse</div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <div className="text-3xl font-semibold tracking-tight text-foreground">{recentSession.winRate}%</div>
                <div className="mt-1 text-xs text-muted-foreground">WR over the recent session window</div>
              </div>
              <Badge variant={recentSession.winRate >= overview.winRate ? "success" : "outline"}>
                {recentSession.winRate >= overview.winRate ? "Above baseline" : "Below baseline"}
              </Badge>
            </div>
            <div className="dashboard-hero-meter mt-4">
              <div className="dashboard-hero-meter-fill" style={{ width: `${Math.min(Math.max(recentSession.winRate, 4), 100)}%` }} />
            </div>
          </div>
          <div className="dashboard-hero-spotlight flex-1 surface-soft rounded-[1rem] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Focus pick</div>
                <div className="mt-2 text-lg font-semibold text-foreground">{topChampions[0]?.championName ?? "No champion yet"}</div>
              </div>
              <Badge variant="outline">{topChampions[0]?.winRate ?? 0}% WR</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {topChampions[0] ? `${topChampions[0].matches} games tracked with ${topChampions[0].averageKda} average KDA.` : "Play a few matches to generate a clearer champion signal."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-[0.7rem] max-sm:grid-cols-1">
            <div className="surface-soft rounded-[1rem] p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Average KDA</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{overview.averageKda.toFixed(2)}</div>
            </div>
            <div className="surface-soft rounded-[1rem] p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Average duration</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{formatDuration(overview.averageDurationSeconds)}</div>
            </div>
          </div>
        </div>

        <div className="col-span-full min-w-0">
          <ActivityHeatmap items={activity} variant="embedded" />
        </div>
      </section>

      <div className="dashboard-metric-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-metric-grid">
        <MetricTile label="Tracked matches" value={overview.totalMatches} hint={`${overview.wins} victoires · ${overview.losses} défaites`} icon={<Sword className="h-4 w-4 text-primary" />} />
        <MetricTile label="Average KDA" value={overview.averageKda.toFixed(2)} hint={`Durée moyenne ${formatDuration(overview.averageDurationSeconds)}`} icon={<TrendingUp className="h-4 w-4 text-primary" />} />
        <MetricTile label="Recent session" value={`${recentSession.matches} games`} hint={`${recentSession.winRate}% WR sur 24h`} icon={<Clock3 className="h-4 w-4 text-primary" />} />
        <MetricTile label="Current streak" value={streak.value} hint={streak.type === "neutral" ? "Aucune série" : `${streak.type === "win" ? "Wins" : "Losses"} consécutifs`} icon={<Flame className="h-4 w-4 text-primary" />} />
      </div>

      <div className="space-y-6">
        <Card data-testid="dashboard-recent-matches-card">
          <CardHeader>
            <CardTitle>Recent matches</CardTitle>
            <CardDescription>Lecture rapide des dernières parties suivies pour retrouver le bon contexte avant analyse.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMatches.length ? recentMatches.map((entry) => {
              const visual = getChampionVisual(entry.participant, champions);
              return (
                <Link key={entry.match.matchId} to={`/history/${entry.match.matchId}`} className="relative surface-subtle block rounded-[1.2rem] p-4 transition hover:border-primary/40 hover:bg-accent/25">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {visual.icon ? <img src={visual.icon} alt={visual.name} className="h-12 w-12 rounded-2xl object-cover" /> : null}
                      <div>
                        <div className="font-medium text-foreground">{visual.name}</div>
                        <div className="text-sm text-muted-foreground">{formatDate(entry.match.gameCreation ?? entry.match.retrievedAt)} · {entry.match.gameMode ?? "League"}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={entry.participant.win ? "success" : "error"}>{entry.participant.win ? "Win" : "Loss"}</Badge>
                      <div className="mt-2 text-sm text-muted-foreground">{entry.participant.kills ?? 0}/{entry.participant.deaths ?? 0}/{entry.participant.assists ?? 0}</div>
                    </div>
                  </div>
                </Link>
              );
            }) : <div className="rounded-[1.2rem] border border-dashed p-5 text-sm text-muted-foreground">Aucun match suivi pour le moment.</div>}
          </CardContent>
        </Card>
      </div>

      <TrendBars items={trend} />

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardCard title="Champion focus" description="Les picks qui structurent réellement la performance récente." badge={`${topChampions.length} tracked`}>
          <div className="space-y-3">
            {topChampions.map((entry) => (
              <div key={String(entry.championId ?? entry.championName)} className="surface-subtle dashboard-list-row flex items-center justify-between gap-4 rounded-[1.2rem] p-4">
                <div>
                  <div className="font-medium">{entry.championName ?? `Champion ${entry.championId ?? "-"}`}</div>
                  <div className="text-sm text-muted-foreground">{entry.matches} games · {entry.averageKda} KDA</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold">{entry.winRate}%</div>
                  <div className="text-sm text-muted-foreground">{Math.round(entry.averageDamage / 100) / 10}k dmg</div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Augment pressure" description="La distribution d’augments les plus joués, déjà exploitable pour les futures vues dédiées." badge={`${topAugments.length} tracked`}>
          <div className="space-y-3">
            {topAugments.map((entry) => (
              <div key={entry.augmentId} className="surface-subtle dashboard-list-row flex items-center justify-between gap-4 rounded-[1.2rem] p-4">
                <div>
                  <div className="font-medium">{entry.label ?? entry.augmentId}</div>
                  <div className="text-sm text-muted-foreground">{entry.matches} games{entry.rarity ? ` · ${entry.rarity}` : ""}</div>
                </div>
                <Badge variant="outline">{entry.winRate}% WR</Badge>
              </div>
            ))}
            <Button variant="outline" asChild>
              <Link to="/augments"><Sparkles className="h-4 w-4" /> Ouvrir la vue augment</Link>
            </Button>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}