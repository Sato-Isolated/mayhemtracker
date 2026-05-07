import { ChevronLeft, ChevronRight, LayoutPanelLeft, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MatchDetailPanel } from "@/components/features/match-detail-panel";
import { MatchHistoryRow } from "@/components/features/match-history-row";
import { PageIntro } from "@/components/features/page-intro";
import { PageToolbar } from "@/components/features/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/tracker-utils";
import { useAnalytics, useMatches, useShellSettings, useStaticData } from "@/state/tracker-data";

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
  const dataDensitySetting = settingMap.dataDensity ?? settingMap.density ?? "comfortable";
  const dataDensity: "comfortable" | "compact" | "dense" = dataDensitySetting === "dense"
    ? "dense"
    : dataDensitySetting === "compact"
      ? "compact"
      : "comfortable";
  const compactMetrics = dataDensity !== "comfortable";
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
  const latestPageDate = pageItems[0] ? formatDate(pageItems[0].gameCreation ?? pageItems[0].retrievedAt) : "No local matches";

  const heroMetrics = useMemo(
    () => [
      {
        label: "Archive",
        value: totalMatches.toLocaleString("en-US"),
        hint: "Stored locally and ready for review.",
        tone: "accent",
      },
      {
        label: "Page active",
        value: `${matchPage} / ${totalPages}`,
        hint: `${pageItems.length} matches in this range.`,
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
        value: activeTrackedParticipant?.championName ?? "Choose a match",
        hint: activeMatch ? `${activeMatch.gameMode ?? "League"} - ${latestPageDate}` : "Select a match to open the detail view.",
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
    <div className="space-y-3.5">
      <PageIntro
        eyebrow="History"
        title="Stored matches"
        description="Local archive tuned for desktop review with instant details and compact scanning."
        actions={(
          <>
            <Badge variant="outline">{totalMatches} matches</Badge>
            <Badge variant="secondary">{splitView ? "Split review" : "Inline review"}</Badge>
          </>
        )}
      />

      <PageToolbar
        testId="match-history-toolbar"
        meta={(
          <>
            <Badge variant="outline">Page {matchPage} / {totalPages}</Badge>
            <Badge variant="outline">{pageItems.length} visible rows</Badge>
            <Badge variant="secondary">{latestPageDate}</Badge>
            <Badge variant="outline" className="gap-1.5">
              <LayoutPanelLeft className="h-3.5 w-3.5" />
              {splitView ? "Split" : "Inline"}
            </Badge>
          </>
        )}
        actions={(
          <>
            <Button variant="outline" size="sm" onClick={() => void setMatchPage(matchPage - 1)} disabled={matchPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => void setMatchPage(matchPage + 1)} disabled={matchPage >= totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      />

      <section className="panel-surface relative px-3.5 py-3" data-testid="match-history-summary-grid">
        <div className="grid gap-[0.6rem] min-[1101px]:grid-cols-4 max-[1100px]:grid-cols-2 max-sm:grid-cols-1">
          {heroMetrics.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                "rounded-[0.85rem] border bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-2))] px-[0.85rem] py-2.5",
                compactMetrics && "px-[0.75rem] py-[0.65rem]",
                metric.tone === "accent"
                  ? "border-[color-mix(in_oklch,var(--accent)_24%,var(--border))]"
                  : metric.tone === "success"
                    ? "border-[color-mix(in_oklch,var(--success)_24%,var(--border))]"
                    : "border-[color-mix(in_oklch,var(--border)_82%,transparent)]",
              )}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</div>
              <div className="mt-1 text-lg font-semibold tracking-[-0.03em] text-foreground">{metric.value}</div>
              <div className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{metric.hint}</div>
            </div>
          ))}
        </div>
      </section>

      <div className={splitView ? "grid items-stretch gap-3 xl:grid-cols-[minmax(0,1.03fr)_minmax(360px,0.8fr)]" : "space-y-3"}>
        <Surface
          variant="subtle"
          className="min-w-0 rounded-[1rem] border-[color-mix(in_oklch,var(--border)_82%,var(--primary))] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-1))] p-2.5"
          data-testid="match-history-card"
        >
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

          <div data-testid="match-history-scroll" className="space-y-2.5 pr-1">
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
                density={dataDensity}
                onToggle={() => void toggleMatch(match.matchId)}
              />
            )) : (
              <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1rem] border border-dashed border-[color-mix(in_oklch,var(--border)_90%,var(--primary))] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-2))] px-6 text-center text-sm text-muted-foreground">
                <Swords className="mb-3 h-5 w-5" />
                <div className="text-base font-medium text-foreground">No local matches</div>
                <div className="mt-2 max-w-sm leading-6">
                  The archive is still empty. Run a sync to populate match history.
                </div>
              </div>
            )}
          </div>
        </Surface>

        {splitView ? (
          <Surface
            variant="subtle"
            className="hidden min-h-full min-w-0 flex-col rounded-[1rem] border-[color-mix(in_oklch,var(--border)_82%,var(--primary))] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-1))] p-2.5 xl:flex"
            data-testid="match-history-detail-panel"
          >
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
              <div className="flex min-h-[18rem] flex-1 items-center justify-center rounded-[1rem] border border-dashed border-[color-mix(in_oklch,var(--border)_90%,var(--primary))] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-2))] px-6 text-center text-sm text-muted-foreground">
                Select a match to display its details.
              </div>
            )}
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
