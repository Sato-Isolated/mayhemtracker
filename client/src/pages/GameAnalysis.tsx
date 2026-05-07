import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { MatchPlayerScoreboard, type ScoreboardTeam } from "@/components/features/match-player-scoreboard";
import { PageIntro } from "@/components/features/page-intro";
import { PageSection } from "@/components/features/page-section";
import { PageToolbar } from "@/components/features/page-toolbar";
import { TeamSnapshotCard } from "@/components/features/team-snapshot-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Surface } from "@/components/ui/surface";
import { formatCompactStat } from "@/lib/stats-utils";
import { formatDate, formatDuration } from "@/lib/tracker-utils";
import { useAnalytics, useMatches, useStaticData } from "@/state/tracker-data";

export function GameAnalysisPage() {
  const { matchId } = useParams();
  const { champions, items, augments } = useStaticData();
  const { dashboard, loadDashboard } = useAnalytics();
  const trackedPuuid = dashboard.data?.overview.trackedPlayerPuuid;
  const { matchDetail, loadMatchDetail } = useMatches();

  useEffect(() => {
    if (matchId && matchDetail.data?.matchId !== matchId && !matchDetail.loading) {
      void loadMatchDetail(matchId);
    }
    if (!dashboard.data && !dashboard.loading) {
      void loadDashboard();
    }
  }, [dashboard.data, dashboard.loading, loadDashboard, loadMatchDetail, matchDetail.data?.matchId, matchDetail.loading, matchId]);

  const match = matchDetail.data;
  const trackedParticipant = trackedPuuid
    ? match?.participants.find((p) => p.puuid === trackedPuuid)
    : match?.participants[0];
  const playerTeamId = trackedParticipant?.teamId;
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

  const scoreboardTeams: ScoreboardTeam[] = teamSnapshots?.map((team, index) => ({
    teamId: team.teamId,
    label: `Team ${index + 1}`,
    win: team.win,
    members: team.members,
    maxDamage: team.maxDamage,
    maxTaken: team.maxTaken,
  })) ?? [];

  return (
    <div className="space-y-3.5">
      <PageIntro
        eyebrow="Game analysis"
        title={match ? match.summary : "Match analysis"}
        description={match ? `${formatDate(match.gameCreation ?? match.retrievedAt)} · ${formatDuration(match.gameDuration)} · ${match.gameVersion ?? "unknown version"}` : "Loading match details."}
        actions={match ? (
          <>
            <Badge variant="default">{match.gameMode ?? "League"}</Badge>
            <Badge variant="outline">Queue {match.queueId ?? "-"}</Badge>
          </>
        ) : undefined}
      />

      {match ? (
        <div className="space-y-3.5">
          <PageToolbar
            testId="game-analysis-toolbar"
            meta={(
              <>
                <Badge variant="outline">Map {match.mapId ?? "-"}</Badge>
                <Badge variant="outline">{formatDuration(match.gameDuration)}</Badge>
                {match.gameModeMutators.map((mutator) => <Badge key={mutator} variant="secondary">{mutator}</Badge>)}
              </>
            )}
          />

          <PageSection title="Team snapshots" description="Quick comparison of both teams before diving into the scoreboard.">
            <div className="grid gap-3 lg:grid-cols-2">
              {teamSnapshots?.map((team) => (
                <TeamSnapshotCard
                  key={team.teamId}
                  teamId={team.teamId}
                  win={team.win}
                  isPlayerTeam={team.isPlayerTeam}
                  totalKills={team.totalKills}
                  totalDamage={team.totalDamage}
                  totalGold={team.totalGold}
                />
              ))}
            </div>
          </PageSection>

          <Card data-testid="game-analysis-scoreboard-card" className="border-[color-mix(in_oklch,var(--border)_86%,var(--primary))]">
            <CardHeader className="pb-3">
              <CardTitle>Scoreboard</CardTitle>
              <CardDescription>Detailed read with a team summary aligned to the density of the analytics pages.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <MatchPlayerScoreboard
                teams={scoreboardTeams}
                trackedIdentifier={{ puuid: trackedPuuid, teamId: playerTeamId }}
                champions={champions}
                items={items}
                augments={augments}
                teamSummary={(team) => {
                  const snapshot = teamSnapshots?.find((t) => t.teamId === team.teamId);
                  if (!snapshot) return null;
                  return (
                    <div className="grid gap-2.5 border-b border-border/60 px-4 py-3.5 md:grid-cols-4">
                      <Surface className="rounded-[1rem] p-3.5">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Kills</div>
                        <div className="mt-1.5 text-xl font-semibold text-foreground">{snapshot.totalKills}</div>
                      </Surface>
                      <Surface className="rounded-[1rem] p-3.5">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Damage</div>
                        <div className="mt-1.5 text-xl font-semibold text-foreground">{formatCompactStat(snapshot.totalDamage)}</div>
                      </Surface>
                      <Surface className="rounded-[1rem] p-3.5">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Gold</div>
                        <div className="mt-1.5 text-xl font-semibold text-foreground">{formatCompactStat(snapshot.totalGold)}</div>
                      </Surface>
                      <Surface className="rounded-[1rem] p-3.5">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Heal</div>
                        <div className="mt-1.5 text-xl font-semibold text-foreground">{formatCompactStat(snapshot.totalHeal)}</div>
                      </Surface>
                    </div>
                  );
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
