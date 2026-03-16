import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/tracker-utils";
import type { MatchListItem, MatchParticipantSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentMatchItemProps {
  match: MatchListItem;
  participant: MatchParticipantSummary;
  championIcon?: string;
  championName: string;
}

export function RecentMatchItem({
  match,
  participant,
  championIcon,
  championName,
}: RecentMatchItemProps) {
  const isWin = participant.win === true;
  const kda = `${participant.kills ?? 0}/${participant.deaths ?? 0}/${participant.assists ?? 0}`;

  return (
    <Link
      to={`/history/${match.matchId}`}
      className={cn(
        "flex items-center gap-3 rounded-lg border-l-[3px] px-4 py-3 transition-colors hover:bg-accent/30",
        isWin
          ? "border-l-success bg-[color-mix(in_oklch,var(--success)_14%,var(--card))]"
          : "border-l-error bg-[color-mix(in_oklch,var(--error)_14%,var(--card))]",
      )}
    >
      {championIcon ? (
        <img
          src={championIcon}
          alt={championName}
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
          ?
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{championName}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(match.gameCreation ?? match.retrievedAt)}
          {match.gameMode ? ` · ${match.gameMode}` : ""}
        </p>
      </div>

      <p className="text-sm font-medium text-foreground">{kda}</p>

      <Badge variant={isWin ? "success" : "error"}>
        {isWin ? "Win" : "Loss"}
      </Badge>
    </Link>
  );
}
