import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { AugmentIcon } from "@/components/features/augment-icon";
import { ItemIcon } from "@/components/features/item-icon";
import { PageIntro } from "@/components/features/page-intro";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function GameAnalysisPage() {
  const { matchId } = useParams();
  const { champions, items, augments } = useTrackerAppData();
  const { matchDetail, loadMatchDetail } = useTrackerMatchData();

  useEffect(() => {
    if (matchId && matchDetail.data?.matchId !== matchId && !matchDetail.loading) {
      void loadMatchDetail(matchId);
    }
  }, [loadMatchDetail, matchDetail.data?.matchId, matchDetail.loading, matchId]);

  const match = matchDetail.data;
  const playerTeamId = match?.participants.find((participant) => participant.win)?.teamId ?? match?.participants[0]?.teamId;
  const teamSnapshots = match?.teams.map((team) => {
    const members = match.participants.filter((participant) => participant.teamId === team.teamId);
    const totalDamage = members.reduce((sum, participant) => sum + (participant.totalDamageDealt ?? 0), 0);
    const totalGold = members.reduce((sum, participant) => sum + (participant.goldEarned ?? 0), 0);
    const totalKills = members.reduce((sum, participant) => sum + (participant.kills ?? 0), 0);
    return {
      teamId: team.teamId,
      win: team.win,
      totalDamage,
      totalGold,
      totalKills,
      totalHeal: members.reduce((sum, participant) => sum + (participant.totalHeal ?? 0), 0),
      members,
      isPlayerTeam: team.teamId === playerTeamId,
      maxDamage: Math.max(...members.map((participant) => participant.totalDamageDealt ?? 0), 1),
      maxTaken: Math.max(...members.map((participant) => participant.totalDamageTaken ?? 0), 1),
    };
  });

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Game analysis"
        title={match ? match.summary : "Match analysis"}
        description={match ? `${formatDate(match.gameCreation ?? match.retrievedAt)} · ${formatDuration(match.gameDuration)} · ${match.gameVersion ?? "version inconnue"}` : "Chargement du détail de match."}
      />

      {match ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {teamSnapshots?.map((team) => (
              <Card key={team.teamId} className={team.isPlayerTeam ? "border-primary/40" : undefined}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>Team {team.teamId}</CardTitle>
                      <CardDescription>{team.win ? "Victory" : "Defeat or unknown"}</CardDescription>
                    </div>
                    {team.isPlayerTeam ? <Badge variant="default">Tracked side</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <div className="surface-soft rounded-[1rem] p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Kills</div>
                    <div className="mt-2 text-2xl font-semibold">{team.totalKills}</div>
                  </div>
                  <div className="surface-soft rounded-[1rem] p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Damage</div>
                    <div className="mt-2 text-2xl font-semibold">{Math.round(team.totalDamage / 100) / 10}k</div>
                  </div>
                  <div className="surface-soft rounded-[1rem] p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Gold</div>
                    <div className="mt-2 text-2xl font-semibold">{Math.round(team.totalGold / 100) / 10}k</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card data-testid="game-analysis-scoreboard-card">
            <CardHeader>
              <CardTitle>Scoreboard</CardTitle>
              <CardDescription>Version produit de l’analyse de match, avec le même langage visuel que l’inline scoreboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="default">{match.gameMode ?? "League"}</Badge>
                <Badge variant="outline">Queue {match.queueId ?? "-"}</Badge>
                <Badge variant="outline">Map {match.mapId ?? "-"}</Badge>
                {match.gameModeMutators.map((mutator) => <Badge key={mutator} variant="secondary">{mutator}</Badge>)}
              </div>
              <div className="space-y-4" data-testid="game-analysis-scoreboard-groups">
                {teamSnapshots?.map((team, teamIndex) => (
                  <section
                    key={team.teamId}
                    className={`match-scoreboard-team rounded-[1.2rem] border ${team.isPlayerTeam ? "match-scoreboard-team--ally" : "match-scoreboard-team--enemy"}`}
                  >
                    <div className="match-scoreboard-team-header flex items-center justify-between gap-3 px-4 py-3">
                      <div className="text-sm font-semibold text-foreground">Team {teamIndex + 1} {team.win ? "— Victory" : "— Defeat"}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        {team.isPlayerTeam ? <Badge variant="outline">Tracked side</Badge> : null}
                        <Badge variant={team.win ? "success" : "error"}>{team.members.length} players</Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 border-b border-border/60 px-4 py-4 md:grid-cols-4">
                      <div className="surface-soft rounded-[1rem] p-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Kills</div>
                        <div className="mt-2 text-2xl font-semibold text-foreground">{team.totalKills}</div>
                      </div>
                      <div className="surface-soft rounded-[1rem] p-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Damage</div>
                        <div className="mt-2 text-2xl font-semibold text-foreground">{formatCompactStat(team.totalDamage)}</div>
                      </div>
                      <div className="surface-soft rounded-[1rem] p-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Gold</div>
                        <div className="mt-2 text-2xl font-semibold text-foreground">{formatCompactStat(team.totalGold)}</div>
                      </div>
                      <div className="surface-soft rounded-[1rem] p-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Heal</div>
                        <div className="mt-2 text-2xl font-semibold text-foreground">{formatCompactStat(team.totalHeal)}</div>
                      </div>
                    </div>

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
                        const visual = getChampionVisual(participant, champions);
                        const isTracked = participant.teamId === playerTeamId;
                        const damageWidth = `${Math.max(((participant.totalDamageDealt ?? 0) / team.maxDamage) * 100, 8)}%`;
                        const takenWidth = `${Math.max(((participant.totalDamageTaken ?? 0) / team.maxTaken) * 100, 8)}%`;

                        return (
                          <div key={`${participant.puuid ?? index}-${participant.championId ?? index}`} className={`match-scoreboard-row px-4 py-2 ${isTracked ? "match-scoreboard-row--tracked" : ""}`}>
                            <div className="match-scoreboard-player min-w-0">
                              {visual.icon ? <img src={visual.icon} alt={visual.name} className="h-10 w-10 rounded-xl object-cover" /> : null}
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-foreground">{participant.summonerName ?? participant.riotIdGameName ?? "Unknown"}</div>
                                <div className="truncate text-xs text-muted-foreground">{visual.name}</div>
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
                              <div className="match-scoreboard-bar match-scoreboard-bar--damage"><span style={{ width: damageWidth }} /></div>
                              <div className="text-xs font-semibold text-foreground">{formatCompactStat(participant.totalDamageDealt)}</div>
                            </div>

                            <div className="match-scoreboard-statbar">
                              <div className="match-scoreboard-bar match-scoreboard-bar--taken"><span style={{ width: takenWidth }} /></div>
                              <div className="text-xs font-semibold text-foreground">{formatCompactStat(participant.totalDamageTaken)}</div>
                            </div>

                            <div className="match-scoreboard-metric text-sm font-semibold text-foreground">{formatCompactStat(participant.goldEarned)}</div>
                            <div className="match-scoreboard-metric text-sm font-semibold text-emerald-400">{formatCompactStat(participant.totalHeal)}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-border/60 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                        {team.members.flatMap((participant) => participant.augments).length
                          ? team.members.flatMap((participant) => participant.augments).map((augmentId, index) => <AugmentIcon key={`${team.teamId}-augment-${augmentId}-${index}`} augmentId={augmentId} augments={augments} size={20} />)
                          : <span className="text-xs text-muted-foreground">No augments</span>}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}