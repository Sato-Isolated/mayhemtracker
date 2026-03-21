import { Link } from "react-router-dom";
import { AugmentIcon } from "@/components/features/augment-icon";
import { ItemIcon } from "@/components/features/item-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Surface } from "@/components/ui/surface";
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
    <div className="flex min-w-0 items-center gap-1.5 pl-1">
      {filledItems.map((itemId, itemIndex) => (
        <div key={`${rowKey}-item-${itemId}-${itemIndex}`} className="relative -translate-y-px">
          <ItemIcon itemId={itemId} items={items} size={48} />
        </div>
      ))}
      {Array.from({ length: emptySlots }, (_, slotIndex) => (
        <div key={`${rowKey}-item-empty-${slotIndex}`} className="relative -translate-y-px">
          <ItemIcon itemId="0" items={items} size={48} />
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
    <div className="flex min-w-0 items-center gap-1.5 pl-1">
      {augmentIds.map((augmentId, augmentIndex) => (
        <div key={`${rowKey}-augment-${augmentId}-${augmentIndex}`} className="relative -translate-y-px">
          <AugmentIcon augmentId={augmentId} augments={augments} size={48} />
        </div>
      ))}
    </div>
  );
}

export function RecentMatchFeed({ matches, champions, items, augments }: RecentMatchFeedProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Recent Matches</CardTitle>
            <CardDescription>Quick read on the latest games, builds, and augments for the tracked player.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/history">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {matches.length ? (
          matches.map((entry) => {
            const { match, participant } = entry;
            const visual = getChampionVisual(participant, champions);
            const isWin = participant.win === true;
            const rowKey = `${match.matchId}-${participant.puuid ?? participant.summonerName ?? visual.name}`;

            return (
              <Link key={match.matchId} to={`/history/${match.matchId}`} className="block transition-transform hover:-translate-y-0.5">
                <Surface
                  variant="subtle"
                  className={`overflow-hidden rounded-[1rem] border px-3.5 py-3.5 ${isWin ? "border-[color-mix(in_oklch,var(--success)_35%,var(--border))] bg-[color-mix(in_oklch,var(--success)_8%,var(--card))]" : "border-[color-mix(in_oklch,var(--error)_30%,var(--border))] bg-[color-mix(in_oklch,var(--error)_8%,var(--card))]"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3.5">
                      {visual.icon ? (
                        <div className="relative ml-1">
                          <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-[1.1rem] bg-[color-mix(in_oklch,var(--accent)_18%,transparent)] blur-[1px]" />
                          <img src={visual.icon} alt={visual.name} className="relative h-12 w-12 shrink-0 rounded-[0.95rem] object-cover ring-1 ring-white/10" />
                        </div>
                      ) : (
                        <div className="ml-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.95rem] bg-muted text-xs text-muted-foreground ring-1 ring-white/10">?</div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-semibold text-foreground">{visual.name}</div>
                          <Badge variant={isWin ? "success" : "error"}>{isWin ? "Win" : "Loss"}</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{formatDate(match.gameCreation ?? match.retrievedAt)}</span>
                          <span>{match.gameMode ?? "League"}</span>
                          <span>{formatDuration(match.gameDuration)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid min-w-[280px] gap-2 text-sm sm:grid-cols-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">KDA</div>
                        <div className="mt-1 font-semibold text-foreground">{participant.kills ?? 0}/{participant.deaths ?? 0}/{participant.assists ?? 0}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Damage</div>
                        <div className="mt-1 font-semibold text-foreground">{formatCompactStat(participant.totalDamageDealt)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Gold</div>
                        <div className="mt-1 font-semibold text-foreground">{formatCompactStat(participant.goldEarned)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Heal</div>
                        <div className="mt-1 font-semibold text-success">{formatCompactStat(participant.totalHeal)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                    <div className="min-w-0 rounded-[0.95rem] border border-border/60 bg-card/70 px-3 py-2.5">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Items</div>
                      {renderItemSlots(participant.items, items, rowKey)}
                    </div>
                    <div className="min-w-0 rounded-[0.95rem] border border-border/60 bg-card/70 px-3 py-2.5">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Augments</div>
                      {renderAugments(participant.augments, augments, rowKey)}
                    </div>
                  </div>
                </Surface>
              </Link>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
            No tracked matches yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
