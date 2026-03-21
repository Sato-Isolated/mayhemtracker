import { ChevronRight } from "lucide-react";
import { MatchDetailPanel } from "@/components/features/match-detail-panel";
import { AugmentIcon } from "@/components/features/augment-icon";
import { ItemIcon } from "@/components/features/item-icon";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";
import type { MatchDetail, MatchListItem, StaticDataEntry } from "@/lib/types";

interface MatchHistoryRowProps {
  match: MatchListItem;
  trackedPuuid?: string;
  isExpanded: boolean;
  detail?: MatchDetail;
  champions: StaticDataEntry[];
  items: StaticDataEntry[];
  augments: StaticDataEntry[];
  onToggle: () => void;
}

export function MatchHistoryRow({
  match,
  trackedPuuid,
  isExpanded,
  detail,
  champions,
  items,
  augments,
  onToggle,
}: MatchHistoryRowProps) {
  const trackedParticipant = trackedPuuid
    ? match.participants.find((participant) => participant.puuid === trackedPuuid) ?? match.participants[0]
    : match.participants[0];
  const visual = trackedParticipant ? getChampionVisual(trackedParticipant, champions) : { name: "Unknown", icon: "" };

  return (
    <div data-testid={`match-history-row-${match.matchId}`}>
      <Surface asChild variant={isExpanded ? undefined : "soft"} className={`history-row relative w-full overflow-hidden rounded-[1.05rem] px-3.5 py-3 text-left transition ${isExpanded ? "border border-primary/45 bg-accent/18" : "hover:border-primary/35 hover:bg-accent/14"}`}>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={`match-history-inline-${match.matchId}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onToggle}
        >
          <div className="pointer-events-none absolute -right-4 top-4 h-14 w-14 rounded-full bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] blur-[10px]" />
          <div className="relative z-[1] flex flex-wrap items-center gap-3 xl:gap-4 max-[1100px]:items-start">
            <div className="flex min-w-[4.4rem] shrink-0 flex-col gap-1 rounded-xl border border-border/60 bg-card/85 px-2.5 py-2 text-center">
              <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${trackedParticipant?.win ? "text-success" : "text-error"}`}>
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

            <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
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
      </Surface>

      <div className={`grid transition-[grid-template-rows] duration-200 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {isExpanded ? (
            <div id={`match-history-inline-${match.matchId}`} className="mx-2 rounded-b-[1.05rem] border border-t-0 border-border/70 bg-card/76 p-4 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--border)_55%,transparent)]" data-testid={`match-history-inline-${match.matchId}`}>
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
