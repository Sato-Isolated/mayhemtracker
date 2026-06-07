import { ChevronLeft, ChevronRight, Filter, Search, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/features/empty-state";
import { MatchDetailPanel } from "@/components/features/match-detail-panel";
import { MatchHistoryRow } from "@/components/features/match-history-row";
import { PageIntro } from "@/components/features/page-intro";
import { StatusBadge } from "@/components/features/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/tracker-utils";
import { useAnalytics, useMatches, useShellSettings, useStaticData } from "@/state/tracker-data";

type ResultFilter = "all" | "wins" | "losses";

export function MatchHistoryPage() {
  const { champions, items, augments } = useStaticData();
  const { dashboard, loadDashboard } = useAnalytics();
  const { settingMap } = useShellSettings();
  const trackedPuuid = dashboard.data?.overview.trackedPlayerPuuid;
  const { matches, matchPage, matchPageSize, setMatchPage, selectedMatchId, matchDetail, loadMatchDetail } = useMatches();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [modeFilter, setModeFilter] = useState("all");

  useEffect(() => {
    if (!dashboard.data && !dashboard.loading) {
      void loadDashboard();
    }
  }, [dashboard.data, dashboard.loading, loadDashboard]);

  const totalMatches = matches.data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalMatches / matchPageSize), 1);
  const pageItems = matches.data?.items ?? [];
  const dataDensitySetting = settingMap.dataDensity ?? settingMap.density ?? "comfortable";
  const dataDensity: "comfortable" | "compact" | "dense" = dataDensitySetting === "dense"
    ? "dense"
    : dataDensitySetting === "compact"
      ? "compact"
      : "comfortable";

  const modeOptions = useMemo(() => {
    const modes = new Set(pageItems.map((match) => match.gameMode).filter(Boolean));
    return ["all", ...Array.from(modes).sort()] as string[];
  }, [pageItems]);

  const filteredPageItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return pageItems.filter((match) => {
      const tracked = trackedPuuid ? match.participants.find((participant) => participant.puuid === trackedPuuid) ?? match.participants[0] : match.participants[0];
      const matchesResult = resultFilter === "all" || (resultFilter === "wins" ? tracked?.win : !tracked?.win);
      const matchesMode = modeFilter === "all" || match.gameMode === modeFilter;
      const matchesQuery = !query || [
        tracked?.championName,
        tracked?.summonerName,
        tracked?.riotIdGameName,
        match.gameMode,
        match.matchId,
        match.summary,
      ].some((value) => value?.toLowerCase().includes(query));

      return matchesResult && matchesMode && matchesQuery;
    });
  }, [modeFilter, pageItems, resultFilter, searchQuery, trackedPuuid]);

  const latestPageDate = pageItems[0] ? formatDate(pageItems[0].gameCreation ?? pageItems[0].retrievedAt) : "No local matches";
  const pageWins = pageItems.filter((match) => {
    const tracked = trackedPuuid ? match.participants.find((participant) => participant.puuid === trackedPuuid) : match.participants[0];
    return tracked?.win;
  }).length;

  async function toggleMatch(matchId: string) {
    if (expandedId === matchId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(matchId);
    if (selectedMatchId !== matchId) {
      await loadMatchDetail(matchId);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5.25rem)] flex-col gap-4">
      <PageIntro
        eyebrow="History"
        title="History"
        description="Stored matches, fast scanning, and one focused review panel."
        actions={(
          <>
            <StatusBadge>{totalMatches} matches</StatusBadge>
            <StatusBadge tone="info">Inline review</StatusBadge>
          </>
        )}
      />

      <section className="rounded-md border border-border/70 bg-card/72" data-testid="match-history-card">
        <div className="grid gap-2 border-b border-border/60 p-2 min-[980px]:grid-cols-[minmax(15rem,1fr)_11rem_11rem_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">Search matches</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search champion, player, match..."
              className="h-9 w-full rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_78%,var(--card))] pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>

          <label>
            <span className="sr-only">Mode filter</span>
            <select
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value)}
              className="h-9 w-full rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_78%,var(--card))] px-3 text-sm text-foreground outline-none focus:border-primary"
            >
              {modeOptions.map((mode) => (
                <option key={mode} value={mode}>{mode === "all" ? "All modes" : mode}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Result filter</span>
            <select
              value={resultFilter}
              onChange={(event) => setResultFilter(event.target.value as ResultFilter)}
              className="h-9 w-full rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_78%,var(--card))] px-3 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="all">All results</option>
              <option value="wins">Wins</option>
              <option value="losses">Losses</option>
            </select>
          </label>

          <Button variant="outline" size="sm" className="h-9 justify-center">
            <Filter className="size-4" />
            Filters
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge>Page {matchPage} / {totalPages}</StatusBadge>
            <StatusBadge>{filteredPageItems.length} visible</StatusBadge>
            <StatusBadge>{pageWins} wins</StatusBadge>
            <StatusBadge tone="info">{latestPageDate}</StatusBadge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void setMatchPage(matchPage - 1)} disabled={matchPage <= 1}>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => void setMatchPage(matchPage + 1)} disabled={matchPage >= totalPages}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid min-h-[34rem]">
          <div className="min-w-0">
            <div className="grid grid-cols-[5.8rem_minmax(10rem,1fr)_minmax(5rem,0.56fr)_minmax(7.2rem,0.68fr)_auto] gap-3 border-b border-border/60 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground max-lg:grid-cols-[5.4rem_minmax(0,1fr)_minmax(5rem,0.6fr)_auto] max-lg:[&_.history-date]:hidden max-sm:grid-cols-[4.8rem_minmax(0,1fr)_auto] max-sm:[&_.history-kda]:hidden">
              <span>Result</span>
              <span>Champion</span>
              <span className="history-kda">KDA</span>
              <span className="history-date">Date</span>
              <span />
            </div>

            <div data-testid="match-history-scroll" className="app-scrollbar max-h-[calc(100vh-18.5rem)] overflow-y-auto max-xl:max-h-none">
              {filteredPageItems.length ? filteredPageItems.map((match) => (
                <MatchHistoryRow
                  key={match.matchId}
                  match={match}
                  trackedPuuid={trackedPuuid}
                  isExpanded={expandedId === match.matchId}
                  isActive={expandedId === match.matchId}
                  detail={selectedMatchId === match.matchId ? matchDetail.data : undefined}
                  champions={champions}
                  items={items}
                  augments={augments}
                  density={dataDensity}
                  onToggle={() => void toggleMatch(match.matchId)}
                />
              )) : (
                <EmptyState
                  icon={<Swords className="size-5" />}
                  title={pageItems.length ? "No matching rows" : "No local matches"}
                  description={pageItems.length ? "Clear the search or filters to show this page again." : "Run a sync to populate match history."}
                  className="m-3 min-h-72"
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
