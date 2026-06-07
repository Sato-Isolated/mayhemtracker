import { ChevronRight } from "lucide-react";
import type { TeammateStats } from "@/lib/types";
import { EmptyState } from "@/components/features/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FriendsListProps {
  teammates: TeammateStats[];
  selectedPuuid: string | null;
  notes: Record<string, string>;
  savingPuuid: string | null;
  onSelect: (puuid: string | null) => void;
  onNoteChange: (puuid: string, value: string) => void;
  onSave: (entry: TeammateStats) => void;
  onRevert: (entry: TeammateStats) => void;
  onRate: (entry: TeammateStats, value: number) => void;
}

export function FriendsList({
  teammates,
  selectedPuuid,
  notes,
  savingPuuid,
  onSelect,
  onNoteChange,
  onSave,
  onRevert,
  onRate,
}: FriendsListProps) {
  return (
    <>
      <div className="app-scrollbar max-h-[calc(100vh-18.5rem)] overflow-y-auto max-xl:max-h-none">
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(10rem,1fr)_4.5rem_4.5rem_4.8rem_5rem_5.6rem_1.5rem] gap-3 border-b border-border/60 bg-card/95 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground backdrop-blur max-lg:grid-cols-[minmax(0,1fr)_4.5rem_4.8rem_1.5rem] max-lg:[&_.friend-wide]:hidden max-sm:grid-cols-[minmax(0,1fr)_4.5rem_1.5rem] max-sm:[&_.friend-mid]:hidden">
          <span>Player</span>
          <span className="text-right">Games</span>
          <span className="friend-mid text-center">WR</span>
          <span className="friend-wide text-right">30d</span>
          <span className="friend-wide text-right">KDA</span>
          <span className="friend-wide text-center">Rating</span>
          <span />
        </div>
        {teammates.length > 0 ? teammates.map((entry) => {
          const selected = selectedPuuid === entry.puuid;
          const draftNote = notes[entry.puuid] ?? entry.note ?? "";

          return (
            <div key={entry.puuid} className="border-b border-border/55 last:border-b-0">
              <button
                type="button"
                aria-expanded={selected}
                aria-controls={`friend-inline-${entry.puuid}`}
                className={cn(
                  "grid w-full grid-cols-[minmax(10rem,1fr)_4.5rem_4.5rem_4.8rem_5rem_5.6rem_1.5rem] items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "max-lg:grid-cols-[minmax(0,1fr)_4.5rem_4.8rem_1.5rem] max-lg:[&_.friend-wide]:hidden",
                  "max-sm:grid-cols-[minmax(0,1fr)_4.5rem_1.5rem] max-sm:[&_.friend-mid]:hidden",
                  selected ? "bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))] shadow-[inset_3px_0_0_var(--primary)]" : "hover:bg-[color-mix(in_oklch,var(--primary)_5%,transparent)]",
                )}
                onClick={() => onSelect(selected ? null : entry.puuid)}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{entry.summonerName}</div>
                  <div className="mt-0.5 text-[0.72rem] text-muted-foreground">
                    {entry.lastSeenAt ? new Date(entry.lastSeenAt).toLocaleDateString("en-US") : "No recent date"}
                  </div>
                </div>
                <div className="text-right text-sm text-foreground tabular-nums">{entry.matches}</div>
                <div className="friend-mid text-center"><Badge variant={entry.winRateTogether >= 50 ? "success" : "outline"}>{entry.winRateTogether}%</Badge></div>
                <div className="friend-wide text-right text-sm text-foreground tabular-nums">{entry.recentMatchesTogether}</div>
                <div className="friend-wide text-right text-sm text-foreground tabular-nums">{entry.averageKdaTogether}</div>
                <div className="friend-wide text-center">{entry.rating ? <Badge>{entry.rating}/5</Badge> : <Badge variant="outline">Unrated</Badge>}</div>
                <div className="flex items-center justify-end text-muted-foreground">
                  <ChevronRight className={cn("size-4 transition-transform", selected && "rotate-90 text-primary")} />
                </div>
              </button>

              <div className={`grid transition-[grid-template-rows] duration-200 ${selected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  {selected ? (
                    <div id={`friend-inline-${entry.puuid}`} className="border-t border-border/60 bg-card/75 p-3">
                      <div className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <InlineMetric label="Record" value={`${entry.winsTogether}W - ${entry.lossesTogether}L`} />
                          <InlineMetric label="Recent games" value={`${entry.recentMatchesTogether}`} />
                          <InlineMetric label="Average KDA" value={`${entry.averageKdaTogether}`} />
                          <InlineMetric label="Last seen" value={entry.lastSeenAt ? new Date(entry.lastSeenAt).toLocaleDateString("en-US") : "-"} />
                        </div>
                        <div className="grid gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[0.68rem] font-semibold uppercase text-muted-foreground">Quick rate</span>
                            {[1, 2, 3, 4, 5].map((value) => (
                              <Button
                                key={value}
                                size="sm"
                                variant={entry.rating === value ? "default" : "outline"}
                                className="h-7 w-7 px-0 text-xs"
                                onClick={() => onRate(entry, value)}
                                aria-label={`Set rating ${value} for ${entry.summonerName}`}
                              >
                                {value}
                              </Button>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <label htmlFor={`friend-note-${entry.puuid}`} className="text-[0.68rem] font-semibold uppercase text-muted-foreground">
                              Local note
                            </label>
                            <textarea
                              id={`friend-note-${entry.puuid}`}
                              value={draftNote}
                              onChange={(event) => onNoteChange(entry.puuid, event.target.value)}
                              placeholder="Add context on communication, role fit, and duo comfort."
                              className="min-h-24 w-full rounded-md border border-border/75 bg-[color-mix(in_oklch,var(--card)_90%,var(--surface-2))] px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={() => onSave(entry)} disabled={savingPuuid === entry.puuid}>
                              {savingPuuid === entry.puuid ? "Saving..." : "Save note"}
                            </Button>
                            <Button variant="outline" onClick={() => onRevert(entry)} disabled={savingPuuid === entry.puuid}>
                              Revert draft
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        }) : (
          <EmptyState title="No teammate data yet" description="Play a few games together to populate this page." className="m-3 min-h-72" />
        )}
      </div>
    </>
  );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-[color-mix(in_oklch,var(--background)_62%,var(--card))] px-3 py-2">
      <div className="text-[0.68rem] font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
