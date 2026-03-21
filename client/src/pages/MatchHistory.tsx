import { ChevronLeft, ChevronRight, LayoutPanelLeft, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MatchDetailPanel } from "@/components/features/match-detail-panel";
import { MatchHistoryRow } from "@/components/features/match-history-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Surface } from "@/components/ui/surface";
import { formatDate } from "@/lib/tracker-utils";
import { useAnalytics, useMatches, useShellSettings, useStaticData } from "@/state/tracker-data";
import "@/components/features/history-feed.css";

export function MatchHistoryPage() {
  const { champions, items, augments } = useStaticData();
  const { dashboard, loadDashboard } = useAnalytics();
  const { settingMap } = useShellSettings();
  const trackedPuuid = dashboard.data?.overview.trackedPlayerPuuid;
  const { matches, matchPage, matchPageSize, setMatchPage, selectedMatchId, matchDetail, loadMatchDetail } = useMatches();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!dashboard.data && !dashboard.loading) {
      void loadDashboard();
    }
  }, [dashboard.data, dashboard.loading, loadDashboard]);

  const totalPages = Math.max(Math.ceil((matches.data?.total ?? 0) / matchPageSize), 1);
  const totalMatches = matches.data?.total ?? 0;
  const pageItems = matches.data?.items ?? [];
  const historyView = settingMap.defaultHistoryView ?? "split";
  const splitView = historyView === "split";
  const pageWins = pageItems.filter((match) => {
    const tracked = trackedPuuid ? match.participants.find((participant) => participant.puuid === trackedPuuid) : match.participants[0];
    return tracked?.win;
  }).length;
  const pageWinRate = pageItems.length ? Math.round((pageWins / pageItems.length) * 100) : 0;
  const activeMatchId = expandedId ?? selectedMatchId ?? null;
  const activeMatch = pageItems.find((match) => match.matchId === activeMatchId);
  const activeTrackedParticipant = trackedPuuid && activeMatch
    ? activeMatch.participants.find((participant) => participant.puuid === trackedPuuid) ?? activeMatch.participants[0]
    : activeMatch?.participants[0];
  const latestPageDate = pageItems[0] ? formatDate(pageItems[0].gameCreation ?? pageItems[0].retrievedAt) : "No matches yet";

  const heroMetrics = useMemo(
    () => [
      {
        label: "Archive",
        value: totalMatches.toLocaleString("fr-FR"),
        hint: "Stored locally and ready for review.",
        tone: "accent",
      },
      {
        label: "Current page",
        value: `${matchPage} / ${totalPages}`,
        hint: `${pageItems.length} matches in this slice.`,
        tone: "muted",
      },
      {
        label: "Page win rate",
        value: `${pageWinRate}%`,
        hint: `${pageWins} wins on the visible page.`,
        tone: "success",
      },
      {
        label: "Selection",
        value: activeTrackedParticipant?.championName ?? "Select a match",
        hint: activeMatch ? `${activeMatch.gameMode ?? "League"} - ${latestPageDate}` : "Pick a match to open the details.",
        tone: "muted",
      },
    ],
    [activeMatch, activeTrackedParticipant?.championName, latestPageDate, matchPage, pageItems.length, pageWinRate, pageWins, totalMatches, totalPages],
  );

  useEffect(() => {
    if (!splitView || !pageItems.length || activeMatchId) {
      return;
    }

    const firstMatchId = pageItems[0]?.matchId;
    if (!firstMatchId) {
      return;
    }

    setExpandedId(firstMatchId);
    if (selectedMatchId !== firstMatchId) {
      void loadMatchDetail(firstMatchId);
    }
  }, [activeMatchId, loadMatchDetail, pageItems, selectedMatchId, splitView]);

  async function toggleMatch(matchId: string) {
    if (!splitView && expandedId === matchId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(matchId);
    if (selectedMatchId !== matchId) {
      await loadMatchDetail(matchId);
    }
  }

  return (
    <div className="space-y-4">
      <section className="history-hero px-4 py-3.5 max-sm:px-3.5" data-testid="match-history-summary-grid">
        <div className="history-hero-grid">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">History</Badge>
                <Badge variant="secondary">{splitView ? "Split review" : "Inline review"}</Badge>
              </div>
              <h1 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-foreground md:text-[1.7rem]">
                Stored matches
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Compact local archive for quick browsing, comparison, and post-game review.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="history-feed-chip inline-flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                {latestPageDate}
              </span>
              <span className="history-feed-chip inline-flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                <LayoutPanelLeft className="h-3.5 w-3.5" />
                {splitView ? "Split" : "Inline"}
              </span>
              <Button variant="outline" size="sm" onClick={() => void setMatchPage(matchPage - 1)} disabled={matchPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => void setMatchPage(matchPage + 1)} disabled={matchPage >= totalPages}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="history-hero-metrics">
                {heroMetrics.map((metric) => (
              <div key={metric.label} className="history-hero-stat" data-tone={metric.tone}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</div>
                <div className="mt-1 text-lg font-semibold tracking-[-0.03em] text-foreground">{metric.value}</div>
                <div className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{metric.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={splitView ? "grid gap-3 xl:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.82fr)]" : "space-y-3"}>
        <Surface variant="subtle" className="history-feed-shell min-w-0 overflow-hidden p-2.5" data-testid="match-history-card">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-foreground">Match list</div>
                <Badge variant="outline">{totalMatches} stored</Badge>
                <Badge variant="outline">{matchPageSize} per page</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Page {matchPage} of {totalPages}.
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{activeMatch ? "Detail ready" : "Select a match"}</div>
          </div>

          <ScrollArea data-testid="match-history-scroll" className="h-[72vh] pr-1">
            <div className="space-y-2.5">
              {matches.data?.items.length ? matches.data.items.map((match) => (
                <MatchHistoryRow
                  key={match.matchId}
                  match={match}
                  trackedPuuid={trackedPuuid}
                  isExpanded={!splitView && expandedId === match.matchId}
                  isActive={activeMatchId === match.matchId}
                  detail={selectedMatchId === match.matchId ? matchDetail.data : undefined}
                  champions={champions}
                  items={items}
                  augments={augments}
                  onToggle={() => void toggleMatch(match.matchId)}
                />
              )) : (
                <div className="history-spotlight-empty flex min-h-[18rem] flex-col items-center justify-center rounded-[1rem] px-6 text-center text-sm text-muted-foreground">
                  <Swords className="mb-3 h-5 w-5" />
                  <div className="text-base font-medium text-foreground">No local matches yet</div>
                  <div className="mt-2 max-w-sm leading-6">
                    The archive is still empty. Run a sync to populate the history.
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Surface>

        {splitView ? (
          <Surface variant="subtle" className="history-spotlight hidden h-[72vh] min-w-0 flex-col p-2.5 xl:flex" data-testid="match-history-detail-panel">
            <ScrollArea className="flex-1 pr-2">
              {activeMatch ? (
                <MatchDetailPanel
                  match={activeMatch}
                  detail={selectedMatchId === activeMatch.matchId ? matchDetail.data : undefined}
                  trackedPuuid={trackedPuuid}
                  champions={champions}
                  items={items}
                  augments={augments}
                />
              ) : (
                <div className="history-spotlight-empty flex min-h-[18rem] items-center justify-center rounded-[1rem] px-6 text-center text-sm text-muted-foreground">
                  Select a match to show its details.
                </div>
              )}
            </ScrollArea>
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
