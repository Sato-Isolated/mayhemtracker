import { ArrowDownUp, ChevronRight, RotateCcw, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/features/empty-state";
import { PageIntro } from "@/components/features/page-intro";
import { StatusBadge } from "@/components/features/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChampionStats, MatchListItem, MatchParticipantSummary, StaticDataEntry } from "@/lib/types";
import { formatDate, formatDuration, resolveStaticIconPath } from "@/lib/tracker-utils";
import { formatCompactStat, formatKdaRatio } from "@/lib/stats-utils";
import { api } from "@/lib/api";
import { useAnalytics, useStaticData } from "@/state/tracker-data";

type ChampionSortKey = "matches" | "winRate" | "averageKda" | "averageDamage" | "averageGold" | "championName";

function formatK(value: number) {
  return `${Math.round(value / 100) / 10}k`;
}

function ChampionInlineRow({
  entry,
  champions,
  matches,
  trackedPuuid,
  matchesLoading,
  matchesError,
  expanded,
  onToggle,
}: {
  entry: ChampionStats;
  champions: StaticDataEntry[];
  matches: MatchListItem[];
  trackedPuuid?: string;
  matchesLoading: boolean;
  matchesError?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const champion = champions.find((item) => item.numeric_id === entry.championId);
  const icon = resolveStaticIconPath(champion);
  const name = champion?.name ?? entry.championName ?? `Champion ${entry.championId ?? "-"}`;
  const championMatches = matches
    .map((match) => {
      const participant = getTrackedParticipant(match, trackedPuuid);
      return participant?.championId === entry.championId ? { match, participant } : null;
    })
    .filter((item): item is { match: MatchListItem; participant: MatchParticipantSummary } => Boolean(item));

  return (
    <div className="border-b border-border/55 last:border-b-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`champion-inline-${entry.championId ?? name}`}
        className={cn(
          "grid w-full grid-cols-[minmax(13rem,1fr)_4.8rem_4.8rem_4.8rem_7rem_1.5rem] items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "max-lg:grid-cols-[minmax(0,1fr)_4.8rem_4.8rem_1.5rem] max-lg:[&_.champion-output]:hidden",
          "max-sm:grid-cols-[minmax(0,1fr)_4.8rem_1.5rem] max-sm:[&_.champion-kda]:hidden",
          expanded ? "bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))] shadow-[inset_3px_0_0_var(--primary)]" : "hover:bg-[color-mix(in_oklch,var(--primary)_5%,transparent)]",
        )}
        onClick={onToggle}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <img src={icon} alt="" className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-1 ring-white/10">?</div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{name}</div>
            <div className="mt-0.5 text-[0.72rem] text-muted-foreground">{entry.wins}W - {entry.losses}L</div>
          </div>
        </div>
        <div className="text-right text-sm text-foreground tabular-nums">{entry.matches}</div>
        <div className="text-center"><Badge variant={entry.winRate >= 50 ? "success" : "outline"}>{entry.winRate}%</Badge></div>
        <div className="champion-kda text-right text-sm font-semibold text-foreground tabular-nums">{entry.averageKda}</div>
        <div className="champion-output text-right text-xs text-muted-foreground tabular-nums">
          <div>{formatK(entry.averageDamage)} dmg</div>
          <div>{formatK(entry.averageGold)} gold</div>
        </div>
        <div className="flex items-center justify-end text-muted-foreground">
          <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90 text-primary")} />
        </div>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-200 ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {expanded ? (
            <div id={`champion-inline-${entry.championId ?? name}`} className="border-t border-border/60 bg-card/75 p-3">
              {matchesLoading ? (
                <div className="rounded-md border border-dashed border-border/70 px-3 py-8 text-center text-sm text-muted-foreground">Loading champion matches...</div>
              ) : matchesError ? (
                <div className="rounded-md border border-error/35 bg-error/10 px-3 py-3 text-sm text-error">{matchesError}</div>
              ) : championMatches.length ? (
                <div className="divide-y divide-border/55 rounded-md border border-border/60 bg-[color-mix(in_oklch,var(--background)_54%,var(--card))]">
                  <div className="grid grid-cols-[5.2rem_minmax(0,1fr)_5.2rem_5.8rem_5.4rem_7rem] items-center gap-3 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground max-lg:grid-cols-[5.2rem_minmax(0,1fr)_5.2rem_5.4rem] max-lg:[&_.champion-match-wide]:hidden max-sm:grid-cols-[4.8rem_minmax(0,1fr)_5.2rem] max-sm:[&_.champion-match-mid]:hidden">
                    <span>Result</span>
                    <span>Match</span>
                    <span className="text-right">KDA</span>
                    <span className="champion-match-mid text-right">Damage</span>
                    <span className="champion-match-wide text-right">Gold</span>
                    <span className="champion-match-wide text-right">Date</span>
                  </div>
                  {championMatches.map(({ match, participant }) => {
                    const won = participant.win === true;
                    return (
                      <div key={match.matchId} className="grid grid-cols-[5.2rem_minmax(0,1fr)_5.2rem_5.8rem_5.4rem_7rem] items-center gap-3 px-3 py-2.5 max-lg:grid-cols-[5.2rem_minmax(0,1fr)_5.2rem_5.4rem] max-lg:[&_.champion-match-wide]:hidden max-sm:grid-cols-[4.8rem_minmax(0,1fr)_5.2rem] max-sm:[&_.champion-match-mid]:hidden">
                        <div className={won ? "text-xs font-semibold text-success" : "text-xs font-semibold text-error"}>
                          {won ? "Victory" : "Defeat"}
                          <div className="mt-0.5 font-normal text-muted-foreground">{formatDuration(match.gameDuration)}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">{match.gameMode ?? "League"}</div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">{match.summary}</div>
                        </div>
                        <div className="text-right tabular-nums">
                          <div className="text-sm font-semibold text-foreground">{participant.kills ?? 0}/{participant.deaths ?? 0}/{participant.assists ?? 0}</div>
                          <div className="text-xs text-muted-foreground">{formatKdaRatio(participant.kills, participant.deaths, participant.assists).toFixed(2)}</div>
                        </div>
                        <div className="champion-match-mid text-right text-sm text-foreground tabular-nums">{formatCompactStat(participant.totalDamageDealt)}</div>
                        <div className="champion-match-wide text-right text-sm text-muted-foreground tabular-nums">{formatCompactStat(participant.goldEarned)}</div>
                        <div className="champion-match-wide text-right text-xs text-muted-foreground">{formatDate(match.gameCreation ?? match.retrievedAt)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border/70 px-3 py-8 text-center text-sm text-muted-foreground">No stored matches found for this champion.</div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getTrackedParticipant(match: MatchListItem, trackedPuuid?: string) {
  return trackedPuuid
    ? match.participants.find((participant) => participant.puuid === trackedPuuid) ?? match.participants[0]
    : match.participants[0];
}

async function loadAllStoredMatches() {
  const pageSize = 100;
  const firstPage = await api.getMatches(1, pageSize);
  const totalPages = Math.max(Math.ceil(firstPage.total / pageSize), 1);
  const rest = [];

  for (let page = 2; page <= totalPages; page += 1) {
    rest.push(api.getMatches(page, pageSize));
  }

  const pages = await Promise.all(rest);
  return [firstPage, ...pages].flatMap((page) => page.items);
}

export function ChampionsPage() {
  const { championStats, dashboard, loadChampionStats, loadDashboard } = useAnalytics();
  const { champions, loadStaticLists } = useStaticData();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortKey, setSortKey] = useState<ChampionSortKey>("matches");
  const [descending, setDescending] = useState(true);
  const [expandedChampion, setExpandedChampion] = useState<string | null>(null);
  const [storedMatches, setStoredMatches] = useState<MatchListItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | undefined>();

  useEffect(() => {
    if (!championStats.data && !championStats.loading) {
      void loadChampionStats();
    }
    if (!dashboard.data && !dashboard.loading) {
      void loadDashboard();
    }
    if (!champions.length) {
      void loadStaticLists();
    }
  }, [championStats.data, championStats.loading, champions.length, dashboard.data, dashboard.loading, loadChampionStats, loadDashboard, loadStaticLists]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const rows = [...(championStats.data ?? [])].filter((entry) => {
      if (!query) return true;
      return (entry.championName ?? `champion ${entry.championId ?? ""}`).toLowerCase().includes(query);
    });

    return rows.sort((left, right) => {
      const leftValue = left[sortKey] ?? 0;
      const rightValue = right[sortKey] ?? 0;
      const result = typeof leftValue === "string"
        ? leftValue.localeCompare(String(rightValue))
        : Number(leftValue) - Number(rightValue);
      return descending ? result * -1 : result;
    });
  }, [championStats.data, deferredSearch, descending, sortKey]);

  const topEntry = filtered[0];

  function toggleSort(nextKey: ChampionSortKey) {
    if (sortKey === nextKey) {
      setDescending((current) => !current);
      return;
    }
    setSortKey(nextKey);
    setDescending(nextKey !== "championName");
  }

  async function toggleChampion(id: string) {
    setExpandedChampion((current) => current === id ? null : id);
    if (expandedChampion === id || storedMatches.length || matchesLoading) {
      return;
    }

    setMatchesLoading(true);
    setMatchesError(undefined);
    try {
      setStoredMatches(await loadAllStoredMatches());
    } catch (error) {
      setMatchesError(error instanceof Error ? error.message : "Unable to load champion matches.");
    } finally {
      setMatchesLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5.25rem)] flex-col gap-4">
      <PageIntro
        eyebrow="Champion analytics"
        title="Champions"
        description="Champion performance as a compact inline archive."
        actions={(
          <>
            <StatusBadge>{filtered.length} visible</StatusBadge>
            <StatusBadge tone="info">Inline review</StatusBadge>
          </>
        )}
      />

      <section className="rounded-md border border-border/70 bg-card/72" data-testid="champions-card">
        <div className="grid gap-2 border-b border-border/60 p-2 min-[980px]:grid-cols-[minmax(15rem,1fr)_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">Search champion</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search champion"
              className="h-9 w-full rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_78%,var(--card))] pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2" data-testid="champions-toolbar" data-density="dense">
            <Button variant="outline" size="sm" onClick={() => toggleSort("matches")}><ArrowDownUp className="size-4" /> Games</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("winRate")}><ArrowDownUp className="size-4" /> WR</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("averageKda")}><ArrowDownUp className="size-4" /> KDA</Button>
            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSortKey("matches"); setDescending(true); }}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
          <StatusBadge>Top: {topEntry?.championName ?? "-"}</StatusBadge>
          <StatusBadge>Sort: {sortKey}</StatusBadge>
          <StatusBadge tone="info">{descending ? "Descending" : "Ascending"}</StatusBadge>
        </div>

        <div className="app-scrollbar max-h-[calc(100vh-18.5rem)] overflow-y-auto max-xl:max-h-none">
          <div className="sticky top-0 z-10 grid grid-cols-[minmax(13rem,1fr)_4.8rem_4.8rem_4.8rem_7rem_1.5rem] gap-3 border-b border-border/60 bg-card/95 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground backdrop-blur max-lg:grid-cols-[minmax(0,1fr)_4.8rem_4.8rem_1.5rem] max-lg:[&_.champion-output]:hidden max-sm:grid-cols-[minmax(0,1fr)_4.8rem_1.5rem] max-sm:[&_.champion-kda]:hidden">
            <span>Champion</span>
            <span className="text-right">Games</span>
            <span className="text-center">WR</span>
            <span className="champion-kda text-right">KDA</span>
            <span className="champion-output text-right">Output</span>
            <span />
          </div>
          {filtered.length ? filtered.map((entry) => {
            const id = String(entry.championId ?? entry.championName);
            return (
              <ChampionInlineRow
                key={id}
                entry={entry}
                champions={champions}
                matches={storedMatches}
                trackedPuuid={dashboard.data?.overview.trackedPlayerPuuid}
                matchesLoading={matchesLoading}
                matchesError={matchesError}
                expanded={expandedChampion === id}
                onToggle={() => void toggleChampion(id)}
              />
            );
          }) : (
            <EmptyState title="No champions found" description="Clear the search or sync more matches." className="m-3 min-h-72" />
          )}
        </div>
      </section>
    </div>
  );
}
