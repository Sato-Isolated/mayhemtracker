import { LayoutPanelLeft, ListFilter, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { MatchDetailPanel } from "@/components/features/match-detail-panel";
import { MatchHistoryRow } from "@/components/features/match-history-row";
import { MetricTile } from "@/components/features/metric-tile";
import { PageIntro } from "@/components/features/page-intro";
import { PageToolbar } from "@/components/features/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Surface } from "@/components/ui/surface";
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
  const splitView = historyView === "split";
  const pageWins = pageItems.filter((match) => {
    const tracked = trackedPuuid ? match.participants.find((participant) => participant.puuid === trackedPuuid) : match.participants[0];
    return tracked?.win;
  }).length;
  const pageWinRate = pageItems.length ? Math.round((pageWins / pageItems.length) * 100) : 0;
  const activeMatchId = expandedId ?? selectedMatchId ?? null;
  const activeMatch = pageItems.find((match) => match.matchId === activeMatchId);

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
    <div className="space-y-6">
      <PageIntro
        eyebrow="History"
        title="Stored matches"
        description="Dense review queue for the local archive, with split detail on wide screens and fast paging."
      />

      <section className="grid items-stretch gap-3 md:grid-cols-3" data-testid="match-history-summary-grid">
        <MetricTile label="Stored locally" value={totalMatches} hint="Matches available in the current local archive." />
        <MetricTile label="Current page" value={`${matchPage} / ${totalPages}`} hint={splitView ? "Split review keeps queue and detail side by side." : "Inline review stays inside the queue."} />
        <MetricTile label="Page win rate" value={`${pageWinRate}%`} hint={`${pageWins}W - ${pageItems.length - pageWins}L on this page`} />
      </section>

      <PageToolbar
        testId="match-history-toolbar"
        meta={(
          <>
            <Badge variant="outline">{totalMatches} stored</Badge>
            <Badge variant="secondary">{splitView ? "Split review" : "Inline review"}</Badge>
            <Badge variant="outline">{matchPageSize} rows per page</Badge>
          </>
        )}
        actions={(
          <>
            <Button variant="outline" size="sm" onClick={() => void setMatchPage(matchPage - 1)} disabled={matchPage <= 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => void setMatchPage(matchPage + 1)} disabled={matchPage >= totalPages}>Next</Button>
          </>
        )}
        filters={(
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">
              <ListFilter className="h-3.5 w-3.5" />
              Page {matchPage} of {totalPages}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">
              <LayoutPanelLeft className="h-3.5 w-3.5" />
              {splitView ? "Desktop split layout" : "Inline expansion"}
            </span>
          </>
        )}
      />

      <Card data-testid="match-history-card">
        <CardHeader>
          <div>
            <CardTitle>Match queue</CardTitle>
            <CardDescription>{totalMatches} stored matches - page {matchPage}/{totalPages}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className={splitView ? "grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.82fr)]" : ""}>
            <Surface asChild variant="subtle" className="h-[74vh] rounded-[1rem] p-2">
              <ScrollArea data-testid="match-history-scroll">
                <div className="space-y-2.5">
                  {matches.data?.items.length ? matches.data.items.map((match) => (
                    <MatchHistoryRow
                      key={match.matchId}
                      match={match}
                      trackedPuuid={trackedPuuid}
                      isExpanded={!splitView && expandedId === match.matchId}
                      detail={selectedMatchId === match.matchId ? matchDetail.data : undefined}
                      champions={champions}
                      items={items}
                      augments={augments}
                      onToggle={() => void toggleMatch(match.matchId)}
                    />
                  )) : (
                    <div className="rounded-[1rem] border border-dashed p-8 text-center text-sm text-muted-foreground">
                      <Swords className="mx-auto mb-3 h-5 w-5" />
                      No local matches yet. Run a sync to populate the archive.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Surface>

            {splitView ? (
              <Surface variant="subtle" className="hidden h-[74vh] rounded-[1rem] p-3 xl:flex xl:flex-col" data-testid="match-history-detail-panel">
                <div className="mb-3 border-b border-border/60 pb-3">
                  <div className="text-sm font-semibold text-foreground">Review panel</div>
                  <div className="text-xs text-muted-foreground">Selection stays visible while you browse the queue.</div>
                </div>
                <ScrollArea className="flex-1 pr-2">
                  {activeMatch ? (
                    <MatchDetailPanel
                      match={activeMatch}
                      detail={selectedMatchId === activeMatch.matchId ? matchDetail.data : undefined}
                      trackedPuuid={trackedPuuid}
                      champions={champions}
                      items={items}
                      augments={augments}
                      variant="panel"
                    />
                  ) : (
                    <div className="flex min-h-[18rem] items-center justify-center rounded-[0.95rem] border border-dashed border-border/70 bg-card/60 text-sm text-muted-foreground">
                      Select a match to inspect it in split view.
                    </div>
                  )}
                </ScrollArea>
              </Surface>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
