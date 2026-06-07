import { LineChart, Trophy, User2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { EmptyState } from "@/components/features/empty-state";
import { PageIntro } from "@/components/features/page-intro";
import { StatusBadge } from "@/components/features/status-badge";
import type { ChampionStats, StaticDataEntry } from "@/lib/types";
import { formatDate, resolveStaticIconPath } from "@/lib/tracker-utils";
import { useAnalytics, useDiagnostics, useStaticData } from "@/state/tracker-data";

export function ProfilePage() {
  const { profile, dashboard, championStats, loadProfile, loadDashboard, loadChampionStats } = useAnalytics();
  const { champions, loadStaticLists } = useStaticData();
  const { summoner, loadCurrentSummoner } = useDiagnostics();

  useEffect(() => {
    if (!profile.data && !profile.loading) void loadProfile();
    if (!dashboard.data && !dashboard.loading) void loadDashboard();
    if (!championStats.data && !championStats.loading) void loadChampionStats();
    if (!champions.length) void loadStaticLists();
    if (!summoner.data && !summoner.loading) void loadCurrentSummoner();
  }, [championStats.data, championStats.loading, champions.length, dashboard.data, dashboard.loading, loadChampionStats, loadCurrentSummoner, loadDashboard, loadProfile, loadStaticLists, profile.data, profile.loading, summoner.data, summoner.loading]);

  if (!profile.data) {
    return <EmptyState title="Profile loading" description="Profile aggregates are filled from synced local matches." className="min-h-[28rem]" />;
  }

  const { overview, currentStreak, bestLossStreak, bestWinStreak, records } = profile.data;
  const trend = dashboard.data?.trend ?? [];
  const topPool = championStats.data?.slice(0, 8) ?? [];
  const profileIconId = summoner.data?.summoner?.profileIconId;
  const staticVersion = champions[0]?.version;
  const profileIconUrl = profileIconId
    ? staticVersion
      ? `https://ddragon.leagueoflegends.com/cdn/${staticVersion}/img/profileicon/${profileIconId}.png`
      : `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${profileIconId}.jpg`
    : "";

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
            {profileIconUrl ? (
              <img
                src={profileIconUrl}
                alt=""
                className="size-11 shrink-0 rounded-md border border-border/70 object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--primary)_12%,var(--card))]">
                <User2 className="size-5 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{overview.trackedPlayerName}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {overview.totalMatches} local matches - {overview.winRate}% WR
                {summoner.data?.summoner?.summonerLevel ? ` - Level ${summoner.data.summoner.summonerLevel}` : ""}
              </div>
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
              <RecordFact label="Highest kills" value={records.highestKills.toLocaleString("en-US")} champion={records.champions.highestKills} champions={champions} />
              <RecordFact label="Highest assists" value={records.highestAssists.toLocaleString("en-US")} champion={records.champions.highestAssists} champions={champions} />
              <RecordFact label="Highest damage" value={records.highestDamage.toLocaleString("en-US")} champion={records.champions.highestDamage} champions={champions} />
              <RecordFact label="Highest gold" value={records.highestGold.toLocaleString("en-US")} champion={records.champions.highestGold} champions={champions} />
              <RecordFact label="Pentakills" value={records.pentakills.toLocaleString("en-US")} champion={records.champions.pentakills} champions={champions} />
            </div>
          </section>

          <section>
            <SectionTitle icon={<User2 className="size-4 text-primary" />} title="Preferred pool" meta={`${topPool.length} champions`} />
            {topPool.length ? (
              <div className="divide-y divide-border/55">
                <div className="grid grid-cols-[minmax(0,1fr)_4.8rem_4.8rem_4.8rem] items-center gap-3 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground max-sm:grid-cols-[minmax(0,1fr)_4.8rem] max-sm:[&_.pool-wide]:hidden">
                  <span>Champion</span>
                  <span className="pool-wide text-right">Games</span>
                  <span className="pool-wide text-right">KDA</span>
                  <span className="text-right">WR</span>
                </div>
                {topPool.map((entry) => (
                  <ChampionPoolRow key={String(entry.championId ?? entry.championName)} entry={entry} champions={champions} />
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

function ChampionPoolRow({
  entry,
  champions,
}: {
  entry: ChampionStats;
  champions: StaticDataEntry[];
}) {
  const champion = champions.find((item) => item.numeric_id === entry.championId);
  const icon = resolveStaticIconPath(champion);
  const name = champion?.name ?? entry.championName ?? `Champion ${entry.championId ?? "-"}`;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_4.8rem_4.8rem_4.8rem] items-center gap-3 px-3 py-2.5 max-sm:grid-cols-[minmax(0,1fr)_4.8rem] max-sm:[&_.pool-wide]:hidden">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? (
          <img src={icon} alt="" className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-1 ring-white/10">?</div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{entry.matches} games - {entry.averageKda} KDA</div>
        </div>
      </div>
      <div className="pool-wide text-right text-sm text-muted-foreground tabular-nums">{entry.matches}</div>
      <div className="pool-wide text-right text-sm text-muted-foreground tabular-nums">{entry.averageKda}</div>
      <div className="text-right text-sm font-semibold text-foreground">{entry.winRate}%</div>
    </div>
  );
}

function RecordFact({
  label,
  value,
  champion,
  champions,
}: {
  label: string;
  value: string;
  champion?: { championId?: number; championName?: string };
  champions: StaticDataEntry[];
}) {
  const championEntry = champions.find((item) => item.numeric_id === champion?.championId);
  const icon = resolveStaticIconPath(championEntry);
  const name = championEntry?.name ?? champion?.championName;

  return (
    <div className="flex items-center gap-2.5 rounded-md border border-border/60 bg-[color-mix(in_oklch,var(--background)_62%,var(--card))] px-3 py-2">
      {icon ? (
        <img src={icon} alt="" className="size-8 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-1 ring-white/10">?</div>
      )}
      <div className="min-w-0">
        <div className="text-[0.68rem] font-semibold uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 flex min-w-0 items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{value}</span>
          {name ? <span className="truncate text-xs text-muted-foreground">{name}</span> : null}
        </div>
      </div>
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
