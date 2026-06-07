import { ChevronRight } from "lucide-react";
import { useState } from "react";
import type { MatchListItem, StaticDataEntry, TeammateStats } from "@/lib/types";
import { EmptyState } from "@/components/features/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCompactStat, formatKdaRatio } from "@/lib/stats-utils";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";
import { cn } from "@/lib/utils";

interface FriendsListProps {
  teammates: TeammateStats[];
  selectedPuuid: string | null;
  notes: Record<string, string>;
  savingPuuid: string | null;
  matches: MatchListItem[];
  trackedPuuid?: string;
  champions: StaticDataEntry[];
  matchesLoading: boolean;
  matchesError?: string;
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
  matches,
  trackedPuuid,
  champions,
  matchesLoading,
  matchesError,
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
          const avatar = getPlayerAvatar(entry);
          const teammateMatches = getTeammateMatches(matches, entry.puuid, trackedPuuid);

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
                <div className="flex min-w-0 items-center gap-2.5">
                  <PlayerAvatar entry={entry} avatar={avatar} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{entry.summonerName}</div>
                    <div className="mt-0.5 text-[0.72rem] text-muted-foreground">
                      {entry.lastSeenAt ? new Date(entry.lastSeenAt).toLocaleDateString("en-US") : "No recent date"}
                    </div>
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
                      <FriendMatches
                        className="mt-3"
                        matches={teammateMatches}
                        champions={champions}
                        loading={matchesLoading}
                        error={matchesError}
                      />
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

function getTeammateMatches(matches: MatchListItem[], puuid: string, trackedPuuid?: string) {
  return matches
    .map((match) => {
      const teammate = match.participants.find((participant) => participant.puuid === puuid);
      const tracked = trackedPuuid
        ? match.participants.find((participant) => participant.puuid === trackedPuuid)
        : undefined;
      if (!teammate) {
        return undefined;
      }

      return { match, teammate, tracked };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function FriendMatches({
  matches,
  champions,
  loading,
  error,
  className,
}: {
  matches: ReturnType<typeof getTeammateMatches>;
  champions: StaticDataEntry[];
  loading: boolean;
  error?: string;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={cn("rounded-md border border-dashed border-border/70 px-3 py-8 text-center text-sm text-muted-foreground", className)}>
        Loading teammate matches...
      </div>
    );
  }

  if (error) {
    return <div className={cn("rounded-md border border-error/35 bg-error/10 px-3 py-3 text-sm text-error", className)}>{error}</div>;
  }

  if (!matches.length) {
    return (
      <div className={cn("rounded-md border border-dashed border-border/70 px-3 py-8 text-center text-sm text-muted-foreground", className)}>
        No stored matches found for this teammate.
      </div>
    );
  }

  return (
    <div className={cn("divide-y divide-border/55 rounded-md border border-border/60 bg-[color-mix(in_oklch,var(--background)_54%,var(--card))]", className)} data-testid="friend-match-list">
      <div className="grid grid-cols-[5.2rem_minmax(12rem,1fr)_5.2rem_5.8rem_5.4rem_8.8rem] items-center gap-3 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground max-lg:grid-cols-[5.2rem_minmax(0,1fr)_5.2rem_5.4rem] max-lg:[&_.friend-match-wide]:hidden max-sm:grid-cols-[4.8rem_minmax(0,1fr)_5.2rem] max-sm:[&_.friend-match-mid]:hidden">
        <span>Result</span>
        <span>Champion / Match</span>
        <span className="text-right">KDA</span>
        <span className="friend-match-mid text-right">Damage</span>
        <span className="friend-match-wide text-right">Gold</span>
        <span className="friend-match-wide text-right">Date</span>
      </div>
      {matches.map(({ match, teammate, tracked }) => {
        const visual = getChampionVisual(teammate, champions);
        const won = tracked?.win ?? teammate.win;

        return (
          <div
            key={`${match.matchId}-${teammate.puuid}`}
            data-testid="friend-match-row"
            className="grid grid-cols-[5.2rem_minmax(12rem,1fr)_5.2rem_5.8rem_5.4rem_8.8rem] items-center gap-3 px-3 py-2.5 max-lg:grid-cols-[5.2rem_minmax(0,1fr)_5.2rem_5.4rem] max-lg:[&_.friend-match-wide]:hidden max-sm:grid-cols-[4.8rem_minmax(0,1fr)_5.2rem] max-sm:[&_.friend-match-mid]:hidden"
          >
            <div className={won ? "text-xs font-semibold text-success" : "text-xs font-semibold text-error"}>
              {won ? "Victory" : "Defeat"}
              <div className="mt-0.5 font-normal text-muted-foreground">{formatDuration(match.gameDuration)}</div>
            </div>
            <div className="flex min-w-0 items-center gap-2.5">
              {visual.icon ? (
                <img src={visual.icon} alt="" className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-1 ring-white/10">?</div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">{visual.name}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{match.summary}</div>
              </div>
            </div>
            <div className="text-right tabular-nums">
              <div className="text-sm font-semibold text-foreground">{teammate.kills ?? 0}/{teammate.deaths ?? 0}/{teammate.assists ?? 0}</div>
              <div className="text-xs text-muted-foreground">{formatKdaRatio(teammate.kills, teammate.deaths, teammate.assists).toFixed(2)}</div>
            </div>
            <div className="friend-match-mid text-right text-sm text-foreground tabular-nums">{formatCompactStat(teammate.totalDamageDealt)}</div>
            <div className="friend-match-wide text-right text-sm text-muted-foreground tabular-nums">{formatCompactStat(teammate.goldEarned)}</div>
            <div className="friend-match-wide whitespace-nowrap text-right text-xs text-muted-foreground">{formatDate(match.gameCreation ?? match.retrievedAt)}</div>
          </div>
        );
      })}
    </div>
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

const avatarStyles = [
  "border-cyan-400/35 bg-cyan-400/12",
  "border-emerald-400/35 bg-emerald-400/12",
  "border-amber-300/35 bg-amber-300/12",
  "border-rose-400/35 bg-rose-400/12",
  "border-violet-400/35 bg-violet-400/12",
  "border-sky-400/35 bg-sky-400/12",
  "border-lime-300/35 bg-lime-300/12",
  "border-fuchsia-400/35 bg-fuchsia-400/12",
];

function getPlayerAvatar(entry: TeammateStats) {
  const name = entry.summonerName.trim() || "Player";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const seed = Array.from(entry.puuid || name).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    initials: initials || "?",
    className: avatarStyles[seed % avatarStyles.length],
  };
}

function PlayerAvatar({
  entry,
  avatar,
}: {
  entry: TeammateStats;
  avatar: ReturnType<typeof getPlayerAvatar>;
}) {
  const [failed, setFailed] = useState(false);
  const profileIconUrl = entry.profileIconId && !failed
    ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${entry.profileIconId}.jpg`
    : undefined;

  if (profileIconUrl) {
    return (
      <img
        src={profileIconUrl}
        alt=""
        className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/15"
        onError={() => setFailed(true)}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.08em] text-foreground ring-1 ring-white/10",
        avatar.className,
      )}
      aria-hidden="true"
    >
      {avatar.initials}
    </div>
  );
}
