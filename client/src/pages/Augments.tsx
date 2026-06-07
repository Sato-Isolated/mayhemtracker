import { ArrowDownUp, ChevronRight, RotateCcw, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AugmentIcon } from "@/components/features/augment-icon";
import { EmptyState } from "@/components/features/empty-state";
import { PageIntro } from "@/components/features/page-intro";
import { StatusBadge } from "@/components/features/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AugmentStats, MatchListItem, MatchParticipantSummary, StaticDataEntry } from "@/lib/types";
import { api } from "@/lib/api";
import { formatCompactStat, formatKdaRatio } from "@/lib/stats-utils";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";
import { useAnalytics, useStaticData } from "@/state/tracker-data";

const rarityFilters = ["all", "silver", "gold", "prismatic"] as const;
type AugmentSortKey = "matches" | "winRate" | "label";

function AugmentInlineRow({
  entry,
  augments,
  champions,
  matches,
  trackedPuuid,
  matchesLoading,
  matchesError,
  expanded,
  onToggle,
}: {
  entry: AugmentStats;
  augments: StaticDataEntry[];
  champions: StaticDataEntry[];
  matches: MatchListItem[];
  trackedPuuid?: string;
  matchesLoading: boolean;
  matchesError?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const label = entry.label ?? entry.augmentId;
  const augmentMatches = matches
    .map((match) => {
      const participant = getTrackedParticipant(match, trackedPuuid);
      return participant?.augments.includes(entry.augmentId) ? { match, participant } : null;
    })
    .filter((item): item is { match: MatchListItem; participant: MatchParticipantSummary } => Boolean(item));

  return (
    <div className="border-b border-border/55 last:border-b-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`augment-inline-${entry.augmentId}`}
        className={cn(
          "grid w-full grid-cols-[minmax(14rem,1fr)_6.5rem_4.8rem_4.8rem_1.5rem] items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "max-sm:grid-cols-[minmax(0,1fr)_4.8rem_1.5rem] max-sm:[&_.augment-secondary]:hidden",
          expanded ? "bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))] shadow-[inset_3px_0_0_var(--primary)]" : "hover:bg-[color-mix(in_oklch,var(--primary)_5%,transparent)]",
        )}
        onClick={onToggle}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <AugmentIcon augmentId={entry.augmentId} augments={augments} size={34} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{label}</div>
            <div className="mt-0.5 text-[0.72rem] text-muted-foreground">{entry.augmentId}</div>
          </div>
        </div>
        <div className="augment-secondary">{entry.rarity ? <Badge variant="secondary">{entry.rarity}</Badge> : <Badge variant="outline">-</Badge>}</div>
        <div className="augment-secondary text-right text-sm text-foreground tabular-nums">{entry.matches}</div>
        <div className="text-center"><Badge variant={entry.winRate >= 50 ? "success" : "outline"}>{entry.winRate}%</Badge></div>
        <div className="flex items-center justify-end text-muted-foreground">
          <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90 text-primary")} />
        </div>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-200 ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {expanded ? (
            <div id={`augment-inline-${entry.augmentId}`} className="border-t border-border/60 bg-card/75 p-3">
              {matchesLoading ? (
                <div className="rounded-md border border-dashed border-border/70 px-3 py-8 text-center text-sm text-muted-foreground">Loading augment matches...</div>
              ) : matchesError ? (
                <div className="rounded-md border border-error/35 bg-error/10 px-3 py-3 text-sm text-error">{matchesError}</div>
              ) : augmentMatches.length ? (
                <div className="divide-y divide-border/55 rounded-md border border-border/60 bg-[color-mix(in_oklch,var(--background)_54%,var(--card))]">
                  <div className="grid grid-cols-[5.2rem_minmax(12rem,1fr)_5.2rem_5.8rem_5.4rem_8.8rem] items-center gap-3 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground max-lg:grid-cols-[5.2rem_minmax(0,1fr)_5.2rem_5.4rem] max-lg:[&_.augment-match-wide]:hidden max-sm:grid-cols-[4.8rem_minmax(0,1fr)_5.2rem] max-sm:[&_.augment-match-mid]:hidden">
                    <span>Result</span>
                    <span>Champion / Match</span>
                    <span className="text-right">KDA</span>
                    <span className="augment-match-mid text-right">Damage</span>
                    <span className="augment-match-wide text-right">Gold</span>
                    <span className="augment-match-wide text-right">Date</span>
                  </div>
                  {augmentMatches.map(({ match, participant }) => {
                    const visual = getChampionVisual(participant, champions);
                    const won = participant.win === true;

                    return (
                      <div key={match.matchId} data-testid="augment-match-row" className="grid grid-cols-[5.2rem_minmax(12rem,1fr)_5.2rem_5.8rem_5.4rem_8.8rem] items-center gap-3 px-3 py-2.5 max-lg:grid-cols-[5.2rem_minmax(0,1fr)_5.2rem_5.4rem] max-lg:[&_.augment-match-wide]:hidden max-sm:grid-cols-[4.8rem_minmax(0,1fr)_5.2rem] max-sm:[&_.augment-match-mid]:hidden">
                        <div className={won ? "text-xs font-semibold text-success" : "text-xs font-semibold text-error"}>
                          {won ? "Victory" : "Defeat"}
                          <div className="mt-0.5 font-normal text-muted-foreground">{formatDuration(match.gameDuration)}</div>
                        </div>
                        <div className="flex min-w-0 items-center gap-2.5">
                          {visual.icon ? (
                            <img src={visual.icon} alt="" className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
                          ) : (
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-1 ring-white/10">?</div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">{visual.name}</div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">{match.summary}</div>
                          </div>
                        </div>
                        <div className="text-right tabular-nums">
                          <div className="text-sm font-semibold text-foreground">{participant.kills ?? 0}/{participant.deaths ?? 0}/{participant.assists ?? 0}</div>
                          <div className="text-xs text-muted-foreground">{formatKdaRatio(participant.kills, participant.deaths, participant.assists).toFixed(2)}</div>
                        </div>
                        <div className="augment-match-mid text-right text-sm text-foreground tabular-nums">{formatCompactStat(participant.totalDamageDealt)}</div>
                        <div className="augment-match-wide text-right text-sm text-muted-foreground tabular-nums">{formatCompactStat(participant.goldEarned)}</div>
                        <div className="augment-match-wide whitespace-nowrap text-right text-xs text-muted-foreground">{formatDate(match.gameCreation ?? match.retrievedAt)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border/70 px-3 py-8 text-center text-sm text-muted-foreground">No stored matches found for this augment.</div>
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

export function AugmentsPage() {
  const { augmentStats, dashboard, loadAugmentStats, loadDashboard } = useAnalytics();
  const { augments, champions, loadStaticLists } = useStaticData();
  const [rarity, setRarity] = useState<(typeof rarityFilters)[number]>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortKey, setSortKey] = useState<AugmentSortKey>("matches");
  const [descending, setDescending] = useState(true);
  const [expandedAugment, setExpandedAugment] = useState<string | null>(null);
  const [storedMatches, setStoredMatches] = useState<MatchListItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | undefined>();

  useEffect(() => {
    if (!augmentStats.data && !augmentStats.loading) {
      void loadAugmentStats();
    }
    if (!dashboard.data && !dashboard.loading) {
      void loadDashboard();
    }
    if (!augments.length || !champions.length) {
      void loadStaticLists();
    }
  }, [augmentStats.data, augmentStats.loading, augments.length, champions.length, dashboard.data, dashboard.loading, loadAugmentStats, loadDashboard, loadStaticLists]);

  const filtered = useMemo(
    () => [...(augmentStats.data ?? [])]
      .filter((entry) => rarity === "all" || (entry.rarity ?? "").toLowerCase() === rarity)
      .filter((entry) => {
        const query = deferredSearch.trim().toLowerCase();
        if (!query) return true;
        return (entry.label ?? entry.augmentId).toLowerCase().includes(query);
      })
      .sort((left, right) => {
        const leftValue = left[sortKey] ?? "";
        const rightValue = right[sortKey] ?? "";
        const result = typeof leftValue === "string"
          ? String(leftValue).localeCompare(String(rightValue))
          : Number(leftValue) - Number(rightValue);
        return descending ? result * -1 : result;
      }),
    [augmentStats.data, deferredSearch, descending, rarity, sortKey],
  );

  function toggleSort(nextKey: AugmentSortKey) {
    if (sortKey === nextKey) {
      setDescending((current) => !current);
      return;
    }
    setSortKey(nextKey);
    setDescending(nextKey !== "label");
  }

  async function toggleAugment(id: string) {
    setExpandedAugment((current) => current === id ? null : id);
    if (expandedAugment === id || storedMatches.length || matchesLoading) {
      return;
    }

    setMatchesLoading(true);
    setMatchesError(undefined);
    try {
      setStoredMatches(await loadAllStoredMatches());
    } catch (error) {
      setMatchesError(error instanceof Error ? error.message : "Unable to load augment matches.");
    } finally {
      setMatchesLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5.25rem)] flex-col gap-4">
      <PageIntro
        eyebrow="Augment analytics"
        title="Augments"
        description="Augment performance as a compact inline archive."
        actions={(
          <>
            <StatusBadge>{filtered.length} visible</StatusBadge>
            <StatusBadge tone="info">Inline review</StatusBadge>
          </>
        )}
      />

      <section className="rounded-md border border-border/70 bg-card/72" data-testid="augments-card">
        <div className="grid gap-2 border-b border-border/60 p-2 min-[980px]:grid-cols-[minmax(15rem,1fr)_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">Search augment</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search augment"
              className="h-9 w-full rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_78%,var(--card))] pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2" data-testid="augments-toolbar">
            {rarityFilters.map((value) => (
              <Button key={value} size="sm" variant={rarity === value ? "default" : "outline"} onClick={() => setRarity(value)}>{value}</Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => toggleSort("matches")}><ArrowDownUp className="size-4" /> Games</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("winRate")}><ArrowDownUp className="size-4" /> WR</Button>
            <Button variant="outline" size="sm" onClick={() => { setRarity("all"); setSearch(""); setSortKey("matches"); setDescending(true); }}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
          <StatusBadge>Rarity: {rarity}</StatusBadge>
          <StatusBadge>Sort: {sortKey}</StatusBadge>
          <StatusBadge tone="info">{descending ? "Descending" : "Ascending"}</StatusBadge>
        </div>

        <div className="app-scrollbar max-h-[calc(100vh-18.5rem)] overflow-y-auto max-xl:max-h-none">
          <div className="sticky top-0 z-10 grid grid-cols-[minmax(14rem,1fr)_6.5rem_4.8rem_4.8rem_1.5rem] gap-3 border-b border-border/60 bg-card/95 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground backdrop-blur max-sm:grid-cols-[minmax(0,1fr)_4.8rem_1.5rem] max-sm:[&_.augment-secondary]:hidden">
            <span>Augment</span>
            <span className="augment-secondary">Rarity</span>
            <span className="augment-secondary text-right">Games</span>
            <span className="text-center">WR</span>
            <span />
          </div>
          {filtered.length ? filtered.map((entry) => (
            <AugmentInlineRow
              key={entry.augmentId}
              entry={entry}
              augments={augments}
              champions={champions}
              matches={storedMatches}
              trackedPuuid={dashboard.data?.overview.trackedPlayerPuuid}
              matchesLoading={matchesLoading}
              matchesError={matchesError}
              expanded={expandedAugment === entry.augmentId}
              onToggle={() => void toggleAugment(entry.augmentId)}
            />
          )) : (
            <EmptyState title="No augments found" description="Clear the filters or sync more matches." className="m-3 min-h-72" />
          )}
        </div>
      </section>
    </div>
  );
}
