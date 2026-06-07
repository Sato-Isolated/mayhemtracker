import { LineChart, Trophy, User2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { EmptyState } from "@/components/features/empty-state";
import { PageIntro } from "@/components/features/page-intro";
import { StatusBadge } from "@/components/features/status-badge";
import { formatDate } from "@/lib/tracker-utils";
import { useAnalytics } from "@/state/tracker-data";

export function ProfilePage() {
  const { profile, dashboard, championStats, loadProfile, loadDashboard, loadChampionStats } = useAnalytics();

  useEffect(() => {
    if (!profile.data && !profile.loading) void loadProfile();
    if (!dashboard.data && !dashboard.loading) void loadDashboard();
    if (!championStats.data && !championStats.loading) void loadChampionStats();
  }, [championStats.data, championStats.loading, dashboard.data, dashboard.loading, loadChampionStats, loadDashboard, loadProfile, profile.data, profile.loading]);

  if (!profile.data) {
    return <EmptyState title="Profile loading" description="Profile aggregates are filled from synced local matches." className="min-h-[28rem]" />;
  }

  const { overview, currentStreak, bestLossStreak, bestWinStreak, records } = profile.data;
  const trend = dashboard.data?.trend ?? [];
  const topPool = championStats.data?.slice(0, 8) ?? [];

  return (
    <div className="flex min-h-[calc(100vh-5.25rem)] flex-col gap-4">
      <PageIntro
        eyebrow="Player identity"
        title={overview.trackedPlayerName}
        description={`Last activity ${formatDate(overview.latestMatchAt)} - ${overview.totalMatches} matches analyzed.`}
        actions={(
          <>
            <StatusBadge>{overview.wins}W - {overview.losses}L</StatusBadge>
            <StatusBadge tone={currentStreak.type === "win" ? "success" : currentStreak.type === "loss" ? "error" : "neutral"}>{currentStreak.value} {currentStreak.type}</StatusBadge>
          </>
        )}
      />

      <section className="rounded-md border border-border/70 bg-card/72" data-testid="profile-dossier">
        <div className="grid gap-3 border-b border-border/60 p-3 lg:grid-cols-[1fr_1.35fr]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--primary)_12%,var(--card))]">
              <User2 className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{overview.trackedPlayerName}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{overview.totalMatches} local matches - {overview.winRate}% WR</div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <ProfileFact label="Win rate" value={`${overview.winRate}%`} />
            <ProfileFact label="Average KDA" value={overview.averageKda.toFixed(2)} />
            <ProfileFact label="Best streak" value={`${bestWinStreak}`} />
            <ProfileFact label="Worst skid" value={`${bestLossStreak}`} />
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="border-b border-border/60 lg:border-b-0 lg:border-r">
            <SectionTitle icon={<Trophy className="size-4 text-primary" />} title="Records" meta="Peak outputs from local history" />
            <div className="grid gap-2 p-3 sm:grid-cols-2">
              <ProfileFact label="Highest kills" value={records.highestKills.toLocaleString("en-US")} />
              <ProfileFact label="Highest assists" value={records.highestAssists.toLocaleString("en-US")} />
              <ProfileFact label="Highest damage" value={records.highestDamage.toLocaleString("en-US")} />
              <ProfileFact label="Highest gold" value={records.highestGold.toLocaleString("en-US")} />
              <ProfileFact label="Pentakills" value={records.pentakills.toLocaleString("en-US")} />
            </div>
          </section>

          <section>
            <SectionTitle icon={<User2 className="size-4 text-primary" />} title="Preferred pool" meta={`${topPool.length} champions`} />
            {topPool.length ? (
              <div className="divide-y divide-border/55">
                {topPool.map((entry) => (
                  <div key={String(entry.championId ?? entry.championName)} className="grid grid-cols-[minmax(0,1fr)_4.8rem_4.8rem_4.8rem] items-center gap-3 px-3 py-2.5 max-sm:grid-cols-[minmax(0,1fr)_4.8rem] max-sm:[&_.pool-wide]:hidden">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{entry.championName ?? `Champion ${entry.championId ?? "-"}`}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{entry.matches} games - {entry.averageKda} KDA</div>
                    </div>
                    <div className="pool-wide text-sm text-muted-foreground">{entry.matches}</div>
                    <div className="pool-wide text-sm text-muted-foreground">{entry.averageKda}</div>
                    <div className="text-right text-sm font-semibold text-foreground">{entry.winRate}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No champion pool yet" description="Sync more matches to populate profile picks." className="min-h-44 border-0" />
            )}
          </section>
        </div>

        <section className="border-t border-border/60">
          <SectionTitle icon={<LineChart className="size-4 text-primary" />} title="Recent form" meta={trend.length ? `${trend.length} periods` : "No trend"} />
          <div className="p-3">
            {trend.length ? (
              <div className="grid grid-cols-7 gap-2 lg:grid-cols-14">
                {trend.map((item) => (
                  <div key={item.key} className="grid gap-2">
                    <div className="flex h-24 items-end rounded-md border border-border/70 bg-background/45 p-1.5">
                      <div
                        className="w-full rounded-sm bg-primary"
                        style={{ height: `${Math.max(item.winRate, item.matches ? 12 : 4)}%` }}
                        title={`${item.label} - ${item.matches} game(s) - ${item.winRate}% WR`}
                      />
                    </div>
                    <div className="truncate text-center text-[0.62rem] uppercase text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No trend yet" description="Recent form appears after match sync." className="min-h-44 border-0" />
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

function SectionTitle({ icon, title, meta }: { icon: ReactNode; title: string; meta: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_68%,var(--card))]">{icon}</span>
        <span className="truncate text-sm font-semibold text-foreground">{title}</span>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground max-sm:hidden">{meta}</span>
    </div>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-[color-mix(in_oklch,var(--background)_62%,var(--card))] px-3 py-2">
      <div className="text-[0.68rem] font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
