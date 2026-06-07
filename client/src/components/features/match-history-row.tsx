import { ChevronRight } from "lucide-react";
import { MatchDetailPanel } from "@/components/features/match-detail-panel";
import { formatKdaRatio } from "@/lib/stats-utils";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";
import { cn } from "@/lib/utils";
import type { MatchDetail, MatchListItem, StaticDataEntry } from "@/lib/types";

interface MatchHistoryRowProps {
  match: MatchListItem;
  trackedPuuid?: string;
  isExpanded: boolean;
  isActive?: boolean;
  detail?: MatchDetail;
  champions: StaticDataEntry[];
  items: StaticDataEntry[];
  augments: StaticDataEntry[];
  density?: "comfortable" | "compact" | "dense";
  onToggle: () => void;
}

export function MatchHistoryRow({
  match,
  trackedPuuid,
  isExpanded,
  isActive = false,
  detail,
  champions,
  items,
  augments,
  density = "comfortable",
  onToggle,
}: MatchHistoryRowProps) {
  const trackedParticipant = trackedPuuid
    ? match.participants.find((participant) => participant.puuid === trackedPuuid) ?? match.participants[0]
    : match.participants[0];
  const visual = trackedParticipant ? getChampionVisual(trackedParticipant, champions) : { name: "Unknown", icon: "" };
  const kdaRatio = formatKdaRatio(trackedParticipant?.kills, trackedParticipant?.deaths, trackedParticipant?.assists);
  const active = isActive || isExpanded;
  const isWin = trackedParticipant?.win === true;
  const compact = density !== "comfortable";

  return (
    <div className="border-b border-border/55 last:border-b-0" data-testid={`match-history-row-${match.matchId}`}>
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`match-history-inline-${match.matchId}`}
        className={cn(
          "grid w-full grid-cols-[5.8rem_minmax(10rem,1fr)_minmax(5rem,0.56fr)_minmax(7.2rem,0.68fr)_auto] items-center gap-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "px-3 py-2" : "px-3 py-2.5",
          active ? "bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))] shadow-[inset_3px_0_0_var(--primary)]" : "hover:bg-[color-mix(in_oklch,var(--primary)_5%,transparent)]",
          "max-lg:grid-cols-[5.4rem_minmax(0,1fr)_minmax(5rem,0.6fr)_auto] max-lg:[&_.history-date]:hidden max-sm:grid-cols-[4.8rem_minmax(0,1fr)_auto] max-sm:[&_.history-kda]:hidden",
        )}
        onClick={onToggle}
      >
        <div className={cn("text-[0.78rem] font-semibold", isWin ? "text-success" : "text-error")}>
          {isWin ? "Victory" : "Defeat"}
          <div className="mt-0.5 text-[0.68rem] font-normal text-muted-foreground">{formatDuration(match.gameDuration)}</div>
        </div>

        <div className="flex min-w-0 items-center gap-2.5">
          {visual.icon ? (
            <img src={visual.icon} alt={visual.name} className="size-10 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-1 ring-white/10">?</div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{visual.name}</div>
            <div className="mt-0.5 truncate text-[0.72rem] text-muted-foreground">{match.gameMode ?? "League"} - {match.participants.length} players</div>
          </div>
        </div>

        <div className="history-kda">
          <div className="text-sm font-semibold text-foreground">{trackedParticipant?.kills ?? 0}/{trackedParticipant?.deaths ?? 0}/{trackedParticipant?.assists ?? 0}</div>
          <div className={cn("text-[0.7rem]", kdaRatio >= 3 ? "text-primary" : "text-muted-foreground")}>{kdaRatio.toFixed(2)} KDA</div>
        </div>

        <div className="history-date text-xs text-muted-foreground">
          <div>{formatDate(match.gameCreation ?? match.retrievedAt)}</div>
          <div>{match.gameVersion ?? "Unknown patch"}</div>
        </div>

        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span className="max-sm:hidden">{active ? "Selected" : "Open"}</span>
          <ChevronRight className={cn("size-4 transition-transform", active ? "rotate-90 text-primary" : "rotate-0")} />
        </div>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-200 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {isExpanded ? (
            <div id={`match-history-inline-${match.matchId}`} className="border-t border-border/60 bg-card/75 p-3" data-testid={`match-history-inline-${match.matchId}`}>
              <MatchDetailPanel
                match={match}
                detail={detail}
                trackedPuuid={trackedPuuid}
                champions={champions}
                items={items}
                augments={augments}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
