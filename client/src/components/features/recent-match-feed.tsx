import { Link } from "react-router-dom";
import { AugmentIcon } from "@/components/features/augment-icon";
import { DataPanel } from "@/components/features/data-panel";
import { EmptyState } from "@/components/features/empty-state";
import { ItemIcon } from "@/components/features/item-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCompactStat } from "@/lib/stats-utils";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";
import type { MatchSpotlight, StaticDataEntry } from "@/lib/types";

interface RecentMatchFeedProps {
  matches: MatchSpotlight[];
  champions: StaticDataEntry[];
  items: StaticDataEntry[];
  augments: StaticDataEntry[];
}

function renderItemSlots(itemIds: string[], items: StaticDataEntry[], rowKey: string) {
  const filledItems = itemIds.slice(0, 6);
  const emptySlots = Math.max(6 - filledItems.length, 0);

  return (
    <div className="flex min-w-0 items-center gap-1">
      {filledItems.map((itemId, itemIndex) => (
        <div key={`${rowKey}-item-${itemId}-${itemIndex}`} className="relative">
          <ItemIcon itemId={itemId} items={items} size={30} />
        </div>
      ))}
      {Array.from({ length: emptySlots }, (_, slotIndex) => (
        <div key={`${rowKey}-item-empty-${slotIndex}`} className="relative">
          <ItemIcon itemId="0" items={items} size={30} />
        </div>
      ))}
    </div>
  );
}

function renderAugments(augmentIds: string[], augments: StaticDataEntry[], rowKey: string) {
  if (!augmentIds.length) {
    return <span className="text-xs text-muted-foreground">No augment</span>;
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      {augmentIds.map((augmentId, augmentIndex) => (
        <div key={`${rowKey}-augment-${augmentId}-${augmentIndex}`} className="relative">
          <AugmentIcon augmentId={augmentId} augments={augments} size={24} />
        </div>
      ))}
    </div>
  );
}

export function RecentMatchFeed({ matches, champions, items, augments }: RecentMatchFeedProps) {
  return (
    <DataPanel
      title="Recent Matches"
      description="Quick read on the latest games, builds, and augments for the tracked player."
      actions={(
        <Button variant="outline" size="sm" asChild>
          <Link to="/history">View all</Link>
        </Button>
      )}
      contentClassName="p-0"
    >
        {matches.length ? (
          <div className="divide-y divide-border/60">
          {matches.map((entry) => {
            const { match, participant } = entry;
            const visual = getChampionVisual(participant, champions);
            const isWin = participant.win === true;
            const rowKey = `${match.matchId}-${participant.puuid ?? participant.summonerName ?? visual.name}`;

            return (
              <Link
                key={match.matchId}
                to={`/history/${match.matchId}`}
                className="grid min-h-[4.9rem] grid-cols-[5.6rem_minmax(11rem,1fr)_minmax(10rem,1fr)_repeat(4,minmax(4.2rem,0.46fr))] items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-[color-mix(in_oklch,var(--primary)_8%,transparent)] max-[1180px]:grid-cols-[5.2rem_minmax(11rem,1fr)_repeat(4,minmax(4.2rem,0.5fr))] max-[1180px]:[&_.recent-build]:hidden max-md:grid-cols-[4.7rem_minmax(0,1fr)_auto] max-md:[&_.recent-build]:hidden max-md:[&_.recent-stat]:hidden"
              >
                <div className={`text-[0.78rem] font-semibold ${isWin ? "text-success" : "text-error"}`}>
                  {isWin ? "Victory" : "Defeat"}
                  <div className="mt-0.5 text-[0.68rem] font-normal text-muted-foreground">{formatDate(match.gameCreation ?? match.retrievedAt)}</div>
                </div>

                <div className="flex min-w-0 items-center gap-2.5">
                      {visual.icon ? (
                        <img src={visual.icon} alt={visual.name} className="size-10 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-1 ring-white/10">?</div>
                      )}

                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{visual.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] text-muted-foreground">
                          <Badge variant={isWin ? "success" : "error"}>{isWin ? "Win" : "Loss"}</Badge>
                          <span>{match.gameMode ?? "League"}</span>
                          <span>{formatDuration(match.gameDuration)}</span>
                        </div>
                      </div>
                </div>

                <div className="recent-build flex min-w-0 flex-wrap items-center gap-1.5">
                  {renderItemSlots(participant.items, items, rowKey)}
                  {renderAugments(participant.augments, augments, rowKey)}
                </div>

                <div className="recent-stat">
                  <div className="text-[0.64rem] uppercase text-muted-foreground">KDA</div>
                  <div className="font-semibold text-foreground">{participant.kills ?? 0}/{participant.deaths ?? 0}/{participant.assists ?? 0}</div>
                </div>
                <div className="recent-stat">
                  <div className="text-[0.64rem] uppercase text-muted-foreground">Damage</div>
                  <div className="font-semibold text-foreground">{formatCompactStat(participant.totalDamageDealt)}</div>
                </div>
                <div className="recent-stat">
                  <div className="text-[0.64rem] uppercase text-muted-foreground">Gold</div>
                  <div className="font-semibold text-foreground">{formatCompactStat(participant.goldEarned)}</div>
                </div>
                <div className="recent-stat">
                  <div className="text-[0.64rem] uppercase text-muted-foreground">Heal</div>
                  <div className="font-semibold text-success">{formatCompactStat(participant.totalHeal)}</div>
                </div>
              </Link>
            );
          })}
          </div>
        ) : (
          <EmptyState title="No tracked matches yet" description="Run a match sync to populate the recent feed." className="min-h-40" />
        )}
    </DataPanel>
  );
}
