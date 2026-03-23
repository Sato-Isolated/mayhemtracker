import { ChevronLeft, ChevronRight, LayoutPanelLeft, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MatchDetailPanel } from "@/components/features/match-detail-panel";
import { MatchHistoryRow } from "@/components/features/match-history-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const latestPageDate = pageItems[0] ? formatDate(pageItems[0].gameCreation ?? pageItems[0].retrievedAt) : "Aucun match local";

  const heroMetrics = useMemo(
    () => [
      {
        label: "Archive",
        value: totalMatches.toLocaleString("fr-FR"),
        hint: "Stocke localement et pret pour la revue.",
        tone: "accent",
      },
      {
        label: "Page active",
        value: `${matchPage} / ${totalPages}`,
        hint: `${pageItems.length} matchs dans cette tranche.`,
        tone: "muted",
      },
      {
        label: "Winrate page",
        value: `${pageWinRate}%`,
        hint: `${pageWins} victoires sur la page visible.`,
        tone: "success",
      },
      {
        label: "Selection",
        value: activeTrackedParticipant?.championName ?? "Choisir un match",
        hint: activeMatch ? `${activeMatch.gameMode ?? "League"} - ${latestPageDate}` : "Selectionnez un match pour ouvrir le detail.",
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
      <section className="panel-surface relative px-4 py-3.5 max-sm:px-3.5" data-testid="match-history-summary-grid">
        <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[color-mix(in_oklch,var(--primary)_8%,transparent)] blur-[18px]" />

        <div className="relative grid gap-[0.9rem]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Historique</Badge>
                <Badge variant="secondary">{splitView ? "Revue scindee" : "Revue integree"}</Badge>
              </div>
              <h1 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-foreground md:text-[1.7rem]">
                Matchs stockes
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Archive locale compacte pour parcourir, comparer et revoir rapidement l'apres-match.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--border)_82%,transparent)] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-2))] px-3 py-1.5 text-xs text-muted-foreground">
                {latestPageDate}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--border)_82%,transparent)] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-2))] px-3 py-1.5 text-xs text-muted-foreground">
                <LayoutPanelLeft className="h-3.5 w-3.5" />
                {splitView ? "Scinde" : "Integre"}
              </span>
              <Button variant="outline" size="sm" onClick={() => void setMatchPage(matchPage - 1)} disabled={matchPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
                Precedent
              </Button>
              <Button variant="outline" size="sm" onClick={() => void setMatchPage(matchPage + 1)} disabled={matchPage >= totalPages}>
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-[0.6rem] min-[1101px]:grid-cols-4 max-[1100px]:grid-cols-2 max-sm:grid-cols-1">
            {heroMetrics.map((metric) => (
              <div
                key={metric.label}
                className={cn(
                  "rounded-[0.85rem] border bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-2))] px-[0.85rem] py-3",
                  compactMetrics && "px-[0.75rem] py-[0.7rem]",
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
        </div>
      </section>

      <div className={splitView ? "grid gap-3 xl:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.82fr)]" : "space-y-3"}>
        <Surface
          variant="subtle"
          className="min-w-0 overflow-hidden rounded-[1rem] border-[color-mix(in_oklch,var(--border)_82%,var(--primary))] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-1))] p-2.5"
          data-testid="match-history-card"
        >
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-foreground">Liste des matchs</div>
                <Badge variant="outline">{totalMatches} stockes</Badge>
                <Badge variant="outline">{matchPageSize} par page</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Page {matchPage} sur {totalPages}.
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{activeMatch ? "Detail pret" : "Selectionnez un match"}</div>
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
                  density={dataDensity}
                  onToggle={() => void toggleMatch(match.matchId)}
                />
              )) : (
                <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1rem] border border-dashed border-[color-mix(in_oklch,var(--border)_90%,var(--primary))] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-2))] px-6 text-center text-sm text-muted-foreground">
                  <Swords className="mb-3 h-5 w-5" />
                  <div className="text-base font-medium text-foreground">Aucun match local</div>
                  <div className="mt-2 max-w-sm leading-6">
                    L'archive est encore vide. Lancez une synchronisation pour remplir l'historique.
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Surface>

        {splitView ? (
          <Surface
            variant="subtle"
            className="hidden h-[72vh] min-w-0 flex-col rounded-[1rem] border-[color-mix(in_oklch,var(--border)_82%,var(--primary))] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-1))] p-2.5 xl:flex"
            data-testid="match-history-detail-panel"
          >
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
                <div className="flex min-h-[18rem] items-center justify-center rounded-[1rem] border border-dashed border-[color-mix(in_oklch,var(--border)_90%,var(--primary))] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-2))] px-6 text-center text-sm text-muted-foreground">
                  Selectionnez un match pour afficher son detail.
                </div>
              )}
            </ScrollArea>
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
