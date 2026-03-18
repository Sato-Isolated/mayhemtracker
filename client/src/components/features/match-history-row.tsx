import { ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { MatchDetail, MatchListItem, StaticDataEntry } from "@/lib/types";
import { AugmentIcon } from "@/components/features/augment-icon";
import { ItemIcon } from "@/components/features/item-icon";
import { MatchPlayerScoreboard, type ScoreboardTeam } from "@/components/features/match-player-scoreboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";

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
    ? match.participants.find((p) => p.puuid === trackedPuuid) ?? match.participants[0]
    : match.participants[0];
  const visual = trackedParticipant ? getChampionVisual(trackedParticipant, champions) : { name: "Unknown", icon: "" };

  const scoreTeams: ScoreboardTeam[] = detail?.teams.map((team, teamIndex) => {
    const members = detail.participants.filter((p) => p.teamId === team.teamId);
    const maxDamage = Math.max(...members.map((p) => p.totalDamageDealt ?? 0), 1);
    const maxTaken = Math.max(...members.map((p) => p.totalDamageTaken ?? 0), 1);
    return {
      ...team,
      label: `Team ${teamIndex + 1}`,
      members,
      maxDamage,
      maxTaken,
    };
  }) ?? [];

  return (
    <div data-testid={`match-history-row-${match.matchId}`}>
      <Surface asChild variant={isExpanded ? undefined : "soft"} className={`relative overflow-hidden w-full rounded-[1.35rem] px-4 py-4 text-left transition ${isExpanded ? "border border-primary/45 bg-accent/20" : "hover:border-primary/35 hover:bg-accent/18"}`}>
      <button
        type="button"
        onClick={onToggle}
      >
        <div className="pointer-events-none absolute -right-4 top-4 h-16 w-16 rounded-full bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] blur-[10px]" />
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

          <div className="items-center flex flex-wrap gap-2 max-sm:w-full">
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
            <div className="mx-2 rounded-b-[1.35rem] border border-t-0 border-border/70 bg-card/76 p-4 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--border)_55%,transparent)]" data-testid={`match-history-inline-${match.matchId}`}>
              {detail ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Inline scoreboard</div>
                      <div className="text-xs text-muted-foreground">Lecture par équipe avec colonnes fixes et barres comparatives, puis bascule possible vers l'analyse complète.</div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link to={`/history/${match.matchId}`}><ExternalLink className="h-4 w-4" /> Full analysis</Link>
                    </Button>
                  </div>

                  <div className="items-stretch grid gap-3 md:grid-cols-3">
                    <Surface className="rounded-[1rem] p-4">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Tracked line</div>
                      <div className="mt-2 text-lg font-semibold text-foreground">{trackedParticipant?.kills ?? 0}/{trackedParticipant?.deaths ?? 0}/{trackedParticipant?.assists ?? 0}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Immediate read for the followed player.</div>
                    </Surface>
                    <Surface className="rounded-[1rem] p-4">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Queue</div>
                      <div className="mt-2 text-lg font-semibold text-foreground">{detail.gameMode ?? "League"}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Patch {detail.gameVersion ?? "unknown"}</div>
                    </Surface>
                    <Surface className="rounded-[1rem] p-4">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Duration</div>
                      <div className="mt-2 text-lg font-semibold text-foreground">{formatDuration(detail.gameDuration)}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Expanded detail without leaving the queue.</div>
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
              ) : (
                <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">Chargement du détail…</div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
