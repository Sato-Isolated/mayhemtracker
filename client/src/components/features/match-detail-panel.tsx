import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { MatchPlayerScoreboard, type ScoreboardTeam } from "@/components/features/match-player-scoreboard";
import { Button } from "@/components/ui/button";
import type { MatchDetail, MatchListItem, StaticDataEntry } from "@/lib/types";

interface MatchDetailPanelProps {
  match: MatchListItem;
  detail?: MatchDetail;
  trackedPuuid?: string;
  champions: StaticDataEntry[];
  items: StaticDataEntry[];
  augments: StaticDataEntry[];
}

export function MatchDetailPanel({
  match,
  detail,
  trackedPuuid,
  champions,
  items,
  augments,
}: MatchDetailPanelProps) {
  const trackedParticipant = trackedPuuid
    ? match.participants.find((participant) => participant.puuid === trackedPuuid) ?? match.participants[0]
    : match.participants[0];

  const scoreTeams: ScoreboardTeam[] = detail?.teams.map((team, teamIndex) => {
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

  if (!detail) {
    return (
      <div className="history-spotlight-empty flex min-h-[12rem] items-center justify-center rounded-[0.95rem] text-sm text-muted-foreground">
        Loading details...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link to={`/history/${match.matchId}`}>
            <ExternalLink className="h-4 w-4" />
            Full analysis
          </Link>
        </Button>
      </div>

      <div className="space-y-1">
        <div>
          <div className="text-sm font-semibold text-foreground">Team scoreboard</div>
          <div className="mt-1 text-xs text-muted-foreground">Compact team-by-team breakdown for the selected match.</div>
        </div>
      </div>

      <MatchPlayerScoreboard
        teams={scoreTeams}
        trackedIdentifier={{
          puuid: trackedParticipant?.puuid,
          summonerName: trackedParticipant?.summonerName,
          teamId: trackedParticipant?.teamId,
        }}
        champions={champions}
        items={items}
        augments={augments}
      />
    </div>
  );
}
