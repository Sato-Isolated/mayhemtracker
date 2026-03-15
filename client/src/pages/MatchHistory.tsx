import { ChevronRight, ExternalLink, Swords } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AugmentIcon } from "@/components/features/augment-icon";
import { ItemIcon } from "@/components/features/item-icon";
import { PageIntro } from "@/components/features/page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";
import { useTrackerAppData, useTrackerMatchData } from "@/state/tracker-data";

function formatCompactStat(value?: number) {
  if (!value) {
    return "0";
  }

  if (value >= 1000) {
    return `${(Math.round((value / 1000) * 10) / 10).toLocaleString("fr-FR")}k`;
  }

  return value.toLocaleString("fr-FR");
}

function formatKdaRatio(kills?: number, deaths?: number, assists?: number) {
  const safeDeaths = deaths && deaths > 0 ? deaths : 1;
  return ((kills ?? 0) + (assists ?? 0)) / safeDeaths;
}

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

      <section className="match-history-summary-grid grid gap-4 md:grid-cols-3" data-testid="match-history-summary-grid">
        <div className="metric-tile p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Stored locally</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{totalMatches}</div>
          <div className="mt-2 text-sm text-muted-foreground">Matches available in the current local queue.</div>
        </div>
        <div className="metric-tile p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current page</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{matchPage} / {totalPages}</div>
          <div className="mt-2 text-sm text-muted-foreground">Navigation stays compact while inline detail handles the deep read.</div>
        </div>
        <div className="metric-tile p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Density note</div>
          <div className="mt-3 text-xl font-semibold tracking-tight text-foreground">Tap a row to inspect the scoreboard.</div>
          <div className="mt-2 text-sm text-muted-foreground">The expanded state keeps the player context and avoids a full page jump.</div>
        </div>
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
          <div className="match-history-toolbar mb-4 flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Cliquez une ligne pour afficher le détail inline, ou ouvrez l’analyse complète.</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void setMatchPage(matchPage - 1)} disabled={matchPage <= 1}>Previous</Button>
              <Button variant="outline" onClick={() => void setMatchPage(matchPage + 1)} disabled={matchPage >= totalPages}>Next</Button>
            </div>
          </div>

          <ScrollArea className="surface-subtle h-[74vh] rounded-[1.4rem] p-2" data-testid="match-history-scroll">
            <div className="space-y-3">
              {matches.data?.items.length ? matches.data.items.map((match) => {
                const isExpanded = expandedId === match.matchId;
                const detail = selectedMatchId === match.matchId ? matchDetail.data : undefined;
                const trackedParticipant = match.participants[0];
                const visual = trackedParticipant ? getChampionVisual(trackedParticipant, champions) : { name: "Unknown", icon: "" };
                const scoreTeams = detail?.teams.map((team, teamIndex) => {
                  const members = detail.participants.filter((participant) => participant.teamId === team.teamId);
                  const maxDamage = Math.max(...members.map((participant) => participant.totalDamageDealt ?? 0), 1);
                  const maxTaken = Math.max(...members.map((participant) => participant.totalDamageTaken ?? 0), 1);
                  return {
                    ...team,
                    label: `Team ${teamIndex + 1}`,
                    members,
                    maxDamage,
                    maxTaken,
                  };
                }) ?? [];

                return (
                  <div key={match.matchId} data-testid={`match-history-row-${match.matchId}`}>
                    <button
                      type="button"
                      onClick={() => void toggleMatch(match.matchId)}
                      className={`match-history-row w-full rounded-[1.35rem] border px-4 py-4 text-left transition ${isExpanded ? "border-primary/45 bg-accent/20" : "surface-soft hover:border-primary/35 hover:bg-accent/18"}`}
                    >
                      <div className="match-history-row-layout flex flex-wrap items-center gap-3 xl:gap-4">
                        <div className="flex min-w-[4.4rem] shrink-0 flex-col gap-1 rounded-xl border border-border/60 bg-card/85 px-2.5 py-2 text-center">
                          <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${trackedParticipant?.win ? "result-win" : "result-loss"}`}>
                            {trackedParticipant?.win ? "WIN" : "LOSS"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{formatDuration(match.gameDuration)}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          {visual.icon ? <img src={visual.icon} alt={visual.name} className="h-11 w-11 rounded-2xl object-cover" /> : null}
                          <div className="min-w-[9rem]">
                            <div className="font-medium text-foreground">{visual.name}</div>
                            <div className="mt-1 text-[11px] text-muted-foreground">{formatDate(match.gameCreation ?? match.retrievedAt)}</div>
                          </div>
                        </div>

                        <div className="min-w-[7rem] shrink-0">
                          <div className="text-sm font-medium text-foreground">{trackedParticipant?.kills ?? 0}/{trackedParticipant?.deaths ?? 0}/{trackedParticipant?.assists ?? 0}</div>
                          <div className="text-xs text-muted-foreground">{match.gameMode ?? "League"}</div>
                        </div>

                        <div className="match-history-row-chips flex flex-wrap gap-2">
                          <Badge variant="outline">{match.participants.length} players</Badge>
                          <Badge variant="outline">{match.gameVersion ?? "Unknown patch"}</Badge>
                        </div>

                        <div className="hidden min-w-[10rem] flex-1 items-center gap-1 xl:flex">
                          {trackedParticipant?.augments.slice(0, 4).map((augmentId) => (
                            <AugmentIcon key={augmentId} augmentId={augmentId} augments={augments} size={22} />
                          ))}
                        </div>

                        <div className="hidden min-w-[11rem] flex-1 items-center gap-1 xl:flex">
                          {trackedParticipant?.items.slice(0, 6).map((itemId) => (
                            <ItemIcon key={itemId} itemId={itemId} items={items} size={22} />
                          ))}
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                          <ChevronRight className={`h-4 w-4 transition ${isExpanded ? "rotate-90" : "rotate-0"}`} />
                        </div>
                      </div>
                    </button>

                    <div className={`grid transition-[grid-template-rows] duration-200 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        {isExpanded ? (
                          <div className="match-history-inline-panel mx-2 rounded-b-[1.35rem] border border-t-0 border-border/70 bg-card/76 p-4" data-testid={`match-history-inline-${match.matchId}`}>
                            {detail ? (
                              <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-foreground">Inline scoreboard</div>
                                    <div className="text-xs text-muted-foreground">Lecture par équipe avec colonnes fixes et barres comparatives, puis bascule possible vers l’analyse complète.</div>
                                  </div>
                                  <Button variant="outline" asChild>
                                    <Link to={`/history/${match.matchId}`}><ExternalLink className="h-4 w-4" /> Full analysis</Link>
                                  </Button>
                                </div>

                                <div className="match-history-inline-summary grid gap-3 md:grid-cols-3">
                                  <div className="surface-soft rounded-[1rem] p-4">
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Tracked line</div>
                                    <div className="mt-2 text-lg font-semibold text-foreground">{trackedParticipant?.kills ?? 0}/{trackedParticipant?.deaths ?? 0}/{trackedParticipant?.assists ?? 0}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">Immediate read for the followed player.</div>
                                  </div>
                                  <div className="surface-soft rounded-[1rem] p-4">
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Queue</div>
                                    <div className="mt-2 text-lg font-semibold text-foreground">{detail.gameMode ?? "League"}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">Patch {detail.gameVersion ?? "unknown"}</div>
                                  </div>
                                  <div className="surface-soft rounded-[1rem] p-4">
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Duration</div>
                                    <div className="mt-2 text-lg font-semibold text-foreground">{formatDuration(detail.gameDuration)}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">Expanded detail without leaving the queue.</div>
                                  </div>
                                </div>

                                <div className="space-y-4" data-testid={`match-history-scoreboard-${match.matchId}`}>
                                  {scoreTeams.map((team) => (
                                    <section
                                      key={team.teamId}
                                      className={`match-scoreboard-team rounded-[1.2rem] border ${team.teamId === trackedParticipant?.teamId ? "match-scoreboard-team--ally" : "match-scoreboard-team--enemy"}`}
                                    >
                                      <div className="match-scoreboard-team-header flex items-center justify-between gap-3 px-4 py-3">
                                        <div className="text-sm font-semibold text-foreground">{team.label} {team.win ? "— Victory" : "— Defeat"}</div>
                                        <Badge variant={team.win ? "success" : "error"}>{team.members.length} players</Badge>
                                      </div>

                                      <div className="match-scoreboard-table">
                                        <div className="match-scoreboard-columns px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                          <div>Player</div>
                                          <div>KDA</div>
                                          <div>Damage</div>
                                          <div>Taken</div>
                                          <div>Gold</div>
                                          <div>Heal</div>
                                        </div>

                                        <div>
                                          {team.members.map((participant, index) => {
                                            const participantVisual = getChampionVisual(participant, champions);
                                            const isTracked = participant.puuid && trackedParticipant?.puuid ? participant.puuid === trackedParticipant.puuid : participant.summonerName === trackedParticipant?.summonerName;
                                            const damageWidth = `${Math.max(((participant.totalDamageDealt ?? 0) / team.maxDamage) * 100, 8)}%`;
                                            const takenWidth = `${Math.max(((participant.totalDamageTaken ?? 0) / team.maxTaken) * 100, 8)}%`;
                                            return (
                                              <div
                                                key={`${participant.puuid ?? index}-${participant.championId ?? index}`}
                                                className={`match-scoreboard-row px-4 py-2 ${isTracked ? "match-scoreboard-row--tracked" : ""}`}
                                              >
                                                <div className="match-scoreboard-player min-w-0">
                                                  {participantVisual.icon ? <img src={participantVisual.icon} alt={participantVisual.name} className="h-10 w-10 rounded-xl object-cover" /> : null}
                                                  <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-foreground">{participant.summonerName ?? participant.riotIdGameName ?? "Unknown"}</div>
                                                    <div className="truncate text-xs text-muted-foreground">{participantVisual.name}</div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                      {participant.items.length
                                                        ? participant.items.map((itemId, itemIndex) => (
                                                          <ItemIcon key={`${participant.puuid ?? index}-item-${itemId}-${itemIndex}`} itemId={itemId} items={items} size={18} />
                                                        ))
                                                        : <span className="text-[11px] text-muted-foreground">No items</span>}
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="match-scoreboard-kda">
                                                  <div className="text-sm font-semibold text-foreground">{participant.kills ?? 0} / {participant.deaths ?? 0} / {participant.assists ?? 0}</div>
                                                  <div className="text-xs text-muted-foreground">{formatKdaRatio(participant.kills, participant.deaths, participant.assists).toFixed(2)}</div>
                                                </div>

                                                <div className="match-scoreboard-statbar">
                                                  <div className="match-scoreboard-bar match-scoreboard-bar--damage">
                                                    <span style={{ width: damageWidth }} />
                                                  </div>
                                                  <div className="text-xs font-semibold text-foreground">{formatCompactStat(participant.totalDamageDealt)}</div>
                                                </div>

                                                <div className="match-scoreboard-statbar">
                                                  <div className="match-scoreboard-bar match-scoreboard-bar--taken">
                                                    <span style={{ width: takenWidth }} />
                                                  </div>
                                                  <div className="text-xs font-semibold text-foreground">{formatCompactStat(participant.totalDamageTaken)}</div>
                                                </div>

                                                <div className="match-scoreboard-metric text-sm font-semibold text-foreground">{formatCompactStat(participant.goldEarned)}</div>
                                                <div className="match-scoreboard-metric text-sm font-semibold text-emerald-400">{formatCompactStat(participant.totalHeal)}</div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      <div className="border-t border-border/60 px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                                          {team.members.flatMap((participant) => participant.augments).slice(0, 10).length
                                            ? team.members.flatMap((participant) => participant.augments).slice(0, 10).map((augmentId, index) => <AugmentIcon key={`${team.teamId}-augment-${augmentId}-${index}`} augmentId={augmentId} augments={augments} size={20} />)
                                            : <span className="text-xs text-muted-foreground">No augments</span>}
                                        </div>
                                      </div>
                                    </section>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">Chargement du détail…</div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-[1.2rem] border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <Swords className="mx-auto mb-3 h-5 w-5" />
                  Aucun match local. Lancez une synchronisation.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}