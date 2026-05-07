import { ChevronRight } from "lucide-react";
import { MatchDetailPanel } from "@/components/features/match-detail-panel";
import { AugmentIcon } from "@/components/features/augment-icon";
import { ItemIcon } from "@/components/features/item-icon";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { formatCompactStat, formatKdaRatio } from "@/lib/stats-utils";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";
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
  const resultTone = trackedParticipant?.win ? "win" : "loss";
  const kdaRatio = formatKdaRatio(trackedParticipant?.kills, trackedParticipant?.deaths, trackedParticipant?.assists);
  const active = isActive || isExpanded;
  const compact = density !== "comfortable";

  return (
    <div data-testid={`match-history-row-${match.matchId}`}>
      <Surface
        asChild
        variant="soft"
        className={cn(
          "w-full rounded-[1rem] border text-left transition-[border-color,background-color,box-shadow] duration-200",
          compact && "rounded-[0.95rem]",
          active
            ? "bg-[color-mix(in_oklch,var(--card)_92%,var(--accent))] shadow-[0_18px_34px_-30px_color-mix(in_oklch,var(--foreground)_18%,transparent)]"
            : "bg-[color-mix(in_oklch,var(--card)_96%,var(--surface-1))]",
          active && resultTone === "win"
            ? "border-[color-mix(in_oklch,var(--success)_38%,var(--primary))]"
            : active && resultTone === "loss"
              ? "border-[color-mix(in_oklch,var(--error)_34%,var(--primary))]"
              : active
                ? "border-[color-mix(in_oklch,var(--primary)_44%,var(--border))]"
                : "border-[color-mix(in_oklch,var(--border)_84%,var(--primary))]",
        )}
        data-active={active}
        data-result={resultTone}
      >
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={`match-history-inline-${match.matchId}`}
          className={cn(
            "relative w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            compact ? "px-3 py-[0.7rem]" : "px-3.5 py-3",
          )}
          onClick={onToggle}
        >
          <div className="relative z-[1] space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="min-w-[4.5rem] shrink-0 rounded-[0.8rem] border border-[color-mix(in_oklch,var(--border)_82%,transparent)] bg-[color-mix(in_oklch,var(--surface-2)_92%,var(--card))] px-2.5 py-2 text-center">
                  <div className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${trackedParticipant?.win ? "text-success" : "text-error"}`}>
                    {trackedParticipant?.win ? "Victory" : "Defeat"}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{formatDuration(match.gameDuration)}</div>
                </div>

                {visual.icon ? (
                  <img src={visual.icon} alt={visual.name} className="h-12 w-12 shrink-0 rounded-[0.9rem] object-cover ring-1 ring-white/10" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-muted text-sm text-muted-foreground ring-1 ring-white/10">?</div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-base font-semibold tracking-[-0.03em] text-foreground">{visual.name}</div>
                    <Badge variant={trackedParticipant?.win ? "success" : "error"}>{trackedParticipant?.win ? "Victory" : "Defeat"}</Badge>
                    <span className="text-xs text-muted-foreground">{match.gameMode ?? "League"}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatDate(match.gameCreation ?? match.retrievedAt)}</span>
                    <span>{match.gameVersion ?? "Unknown patch"}</span>
                    <span>{match.participants.length} players</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-end gap-2">
                      <div className="text-[clamp(1.2rem,1.02rem+0.42vw,1.55rem)] font-semibold leading-none tracking-[-0.04em] text-foreground">
                        {trackedParticipant?.kills ?? 0}/{trackedParticipant?.deaths ?? 0}/{trackedParticipant?.assists ?? 0}
                      </div>
                      <div className="pb-0.5 text-xs font-medium text-muted-foreground">{kdaRatio.toFixed(2)} KDA</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>DGT {formatCompactStat(trackedParticipant?.totalDamageDealt)}</span>
                      <span>Gold {formatCompactStat(trackedParticipant?.goldEarned)}</span>
                      <span>Heal {formatCompactStat(trackedParticipant?.totalHeal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <span>{active ? "Selected" : "Open details"}</span>
                <ChevronRight className={cn("h-4 w-4 transition duration-200 motion-reduce:transition-none", active ? "rotate-90" : "rotate-0")} />
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="rounded-[0.85rem] border border-[color-mix(in_oklch,var(--border)_84%,transparent)] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-2))] px-2.5 py-2">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Augments</div>
                <div className="flex min-h-[1.6rem] flex-wrap items-center gap-1.5">
                  {trackedParticipant?.augments.length ? trackedParticipant.augments.slice(0, 4).map((augmentId) => (
                    <AugmentIcon key={augmentId} augmentId={augmentId} augments={augments} size={24} />
                  )) : <span className="text-xs text-muted-foreground">No augment</span>}
                </div>
              </div>

              <div className="rounded-[0.85rem] border border-[color-mix(in_oklch,var(--border)_84%,transparent)] bg-[color-mix(in_oklch,var(--card)_94%,var(--surface-2))] px-2.5 py-2">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Items</div>
                <div className="flex min-h-[1.6rem] flex-wrap items-center gap-1.5">
                  {trackedParticipant?.items.length ? trackedParticipant.items.slice(0, 6).map((itemId) => (
                    <ItemIcon key={itemId} itemId={itemId} items={items} size={24} />
                  )) : <span className="text-xs text-muted-foreground">No item snapshot</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="sr-only">{visual.name}</div>
        </button>
      </Surface>

      <div className={`grid transition-[grid-template-rows] duration-200 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {isExpanded ? (
            <div id={`match-history-inline-${match.matchId}`} className="mx-1.5 rounded-b-[1rem] border border-t-0 border-border/70 bg-card/78 p-3" data-testid={`match-history-inline-${match.matchId}`}>
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
