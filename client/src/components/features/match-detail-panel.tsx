import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { MatchPlayerScoreboard, type ScoreboardTeam } from "@/components/features/match-player-scoreboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { formatDuration } from "@/lib/tracker-utils";
import type { MatchDetail, MatchListItem, StaticDataEntry } from "@/lib/types";

interface MatchDetailPanelProps {
  match: MatchListItem;
  detail?: MatchDetail;
  trackedPuuid?: string;
  champions: StaticDataEntry[];
  items: StaticDataEntry[];
  augments: StaticDataEntry[];
  variant?: "inline" | "panel";
}

export function MatchDetailPanel({
  match,
  detail,
  trackedPuuid,
  champions,
  items,
  augments,
  variant = "inline",
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
    return <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">Loading match detail...</div>;
  }

  const title = variant === "panel" ? "Selected match" : "Inline scoreboard";
  const description = variant === "panel"
    ? "Split review keeps the list stable while the detail stays readable on the right."
    : "Compact team-by-team read with a fast jump to the full analysis.";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <Badge variant={trackedParticipant?.win ? "success" : "error"}>{trackedParticipant?.win ? "Win" : "Loss"}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/history/${match.matchId}`}>
            <ExternalLink className="h-4 w-4" />
            Full analysis
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Surface className="rounded-[0.95rem] px-3.5 py-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Tracked line</div>
          <div className="mt-2 text-base font-semibold text-foreground">
            {trackedParticipant?.kills ?? 0}/{trackedParticipant?.deaths ?? 0}/{trackedParticipant?.assists ?? 0}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Immediate read for the followed player.</div>
        </Surface>
        <Surface className="rounded-[0.95rem] px-3.5 py-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Queue</div>
          <div className="mt-2 text-base font-semibold text-foreground">{detail.gameMode ?? "League"}</div>
          <div className="mt-1 text-xs text-muted-foreground">Patch {detail.gameVersion ?? "unknown"}</div>
        </Surface>
        <Surface className="rounded-[0.95rem] px-3.5 py-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Duration</div>
          <div className="mt-2 text-base font-semibold text-foreground">{formatDuration(detail.gameDuration)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Expanded detail without losing the browsing context.</div>
        </Surface>
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
