import { Swords } from "lucide-react";
import { useState } from "react";
import { MatchHistoryRow } from "@/components/features/match-history-row";
import { MetricTile } from "@/components/features/metric-tile";
import { PageIntro } from "@/components/features/page-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Surface } from "@/components/ui/surface";
import { useTrackerAppData, useTrackerMatchData } from "@/state/tracker-data";

export function MatchHistoryPage() {
  const { champions, items, augments } = useTrackerAppData();
  const {
    matches,
    matchPage,
    matchPageSize,
    setMatchPage,
    selectedMatchId,
    matchDetail,
    loadMatchDetail,
  } = useTrackerMatchData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalPages = Math.max(Math.ceil((matches.data?.total ?? 0) / matchPageSize), 1);
  const totalMatches = matches.data?.total ?? 0;

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
        description="Historique en file compacte avec expansion inline, inspiré de la référence mais adapté à votre stack web locale."
      />

      <section className="items-stretch grid gap-4 md:grid-cols-3" data-testid="match-history-summary-grid">
        <MetricTile label="Stored locally" value={totalMatches} hint="Matches available in the current local queue." />
        <MetricTile label="Current page" value={`${matchPage} / ${totalPages}`} hint="Navigation stays compact while inline detail handles the deep read." />
        <MetricTile label="Density note" value="Tap a row to inspect the scoreboard." hint="The expanded state keeps the player context and avoids a full page jump." />
      </section>

      <Card data-testid="match-history-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Match queue</CardTitle>
              <CardDescription>{matches.data?.total ?? 0} matchs disponibles localement. Page {matchPage} / {totalPages}.</CardDescription>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2 text-right">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Window</div>
              <div className="text-sm font-medium text-foreground">{matchPageSize} rows</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
            <div className="text-sm text-muted-foreground">Cliquez une ligne pour afficher le détail inline, ou ouvrez l'analyse complète.</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void setMatchPage(matchPage - 1)} disabled={matchPage <= 1}>Previous</Button>
              <Button variant="outline" onClick={() => void setMatchPage(matchPage + 1)} disabled={matchPage >= totalPages}>Next</Button>
            </div>
          </div>

          <Surface asChild variant="subtle" className="h-[74vh] rounded-[1.4rem] p-2">
          <ScrollArea data-testid="match-history-scroll">
            <div className="space-y-3">
              {matches.data?.items.length ? matches.data.items.map((match) => (
                <MatchHistoryRow
                  key={match.matchId}
                  match={match}
                  isExpanded={expandedId === match.matchId}
                  detail={selectedMatchId === match.matchId ? matchDetail.data : undefined}
                  champions={champions}
                  items={items}
                  augments={augments}
                  onToggle={() => void toggleMatch(match.matchId)}
                />
              )) : (
                <div className="rounded-[1.2rem] border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <Swords className="mx-auto mb-3 h-5 w-5" />
                  Aucun match local. Lancez une synchronisation.
                </div>
              )}
            </div>
          </ScrollArea>
          </Surface>
        </CardContent>
      </Card>
    </div>
  );
}
