import type { ReactNode } from "react";
import type { MatchParticipantSummary, StaticDataEntry } from "@/lib/types";
import { AugmentIcon } from "@/components/features/augment-icon";
import { ItemIcon } from "@/components/features/item-icon";
import { Badge } from "@/components/ui/badge";
import { formatCompactStat, formatKdaRatio } from "@/lib/stats-utils";
import { getChampionVisual } from "@/lib/tracker-utils";

export interface ScoreboardTeam {
  teamId: number;
  label: string;
  win?: boolean;
  members: MatchParticipantSummary[];
  maxDamage: number;
  maxTaken: number;
}

interface MatchScoreboardProps {
  teams: ScoreboardTeam[];
  trackedIdentifier: {
    puuid?: string;
    summonerName?: string;
    teamId?: number;
  };
  champions: StaticDataEntry[];
  items: StaticDataEntry[];
  augments: StaticDataEntry[];
  teamSummary?: (team: ScoreboardTeam) => ReactNode;
  maxAugments?: number;
}

function isTrackedParticipant(
  participant: MatchParticipantSummary,
  tracked: MatchScoreboardProps["trackedIdentifier"],
) {
  if (tracked.puuid && participant.puuid) {
    return participant.puuid === tracked.puuid;
  }
  return participant.summonerName === tracked.summonerName;
}

export function MatchScoreboard({
  teams,
  trackedIdentifier,
  champions,
  items,
  augments,
  teamSummary,
  maxAugments,
}: MatchScoreboardProps) {
  return (
    <div className="space-y-4">
      {teams.map((team) => {
        const allAugments = team.members.flatMap((p) => p.augments);
        const displayAugments = maxAugments ? allAugments.slice(0, maxAugments) : allAugments;

        return (
          <section
            key={team.teamId}
            className={`overflow-hidden rounded-[1.2rem] border bg-[color-mix(in_oklch,var(--card)_88%,transparent)] ${team.teamId === trackedIdentifier.teamId ? "border-[color-mix(in_oklch,var(--primary)_34%,var(--border))]" : "border-[color-mix(in_oklch,var(--destructive)_22%,var(--border))]"}`}
          >
            <div className={`flex items-center justify-between gap-3 px-4 py-3 ${team.teamId === trackedIdentifier.teamId ? "bg-[color-mix(in_oklch,var(--primary)_18%,var(--muted))]" : "bg-[color-mix(in_oklch,var(--destructive)_10%,var(--muted))]"}`}>
              <div className="text-sm font-semibold text-foreground">{team.label} {team.win ? "— Victory" : "— Defeat"}</div>
              <div className="flex flex-wrap items-center gap-2">
                {team.teamId === trackedIdentifier.teamId ? <Badge variant="outline">Tracked side</Badge> : null}
                <Badge variant={team.win ? "success" : "error"}>{team.members.length} players</Badge>
              </div>
            </div>

            {teamSummary ? teamSummary(team) : null}

            <div className="match-scoreboard-columns px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <div>Player</div>
              <div>KDA</div>
              <div>Damage</div>
              <div>Taken</div>
              <div>Gold</div>
              <div>Heal</div>
            </div>

            <div>
              {team.members.map((participant, index) => {
                const visual = getChampionVisual(participant, champions);
                const tracked = isTrackedParticipant(participant, trackedIdentifier);
                const damageWidth = `${Math.max(((participant.totalDamageDealt ?? 0) / team.maxDamage) * 100, 8)}%`;
                const takenWidth = `${Math.max(((participant.totalDamageTaken ?? 0) / team.maxTaken) * 100, 8)}%`;

                return (
                  <div
                    key={`${participant.puuid ?? index}-${participant.championId ?? index}`}
                    className={`match-scoreboard-row px-4 py-2 ${tracked ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]" : ""}`}
                  >
                    <div className="match-scoreboard-player min-w-0">
                      {visual.icon ? <img src={visual.icon} alt={visual.name} className="h-10 w-10 rounded-xl object-cover" /> : null}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{participant.summonerName ?? participant.riotIdGameName ?? "Unknown"}</div>
                        <div className="truncate text-xs text-muted-foreground">{visual.name}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {participant.items.length
                            ? participant.items.map((itemId, itemIndex) => (
                              <ItemIcon key={`${participant.puuid ?? index}-item-${itemId}-${itemIndex}`} itemId={itemId} items={items} size={18} />
                            ))
                            : <span className="text-[11px] text-muted-foreground">No items</span>}
                        </div>
                      </div>
                    </div>

                    <div className="match-scoreboard-kda">
                      <div className="text-sm font-semibold text-foreground">{participant.kills ?? 0} / {participant.deaths ?? 0} / {participant.assists ?? 0}</div>
                      <div className="text-xs text-muted-foreground">{formatKdaRatio(participant.kills, participant.deaths, participant.assists).toFixed(2)}</div>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <div className="match-scoreboard-bar match-scoreboard-bar--damage"><span style={{ width: damageWidth }} /></div>
                      <div className="text-xs font-semibold text-foreground">{formatCompactStat(participant.totalDamageDealt)}</div>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <div className="match-scoreboard-bar match-scoreboard-bar--taken"><span style={{ width: takenWidth }} /></div>
                      <div className="text-xs font-semibold text-foreground">{formatCompactStat(participant.totalDamageTaken)}</div>
                    </div>

                    <div className="match-scoreboard-metric text-sm font-semibold text-foreground">{formatCompactStat(participant.goldEarned)}</div>
                    <div className="match-scoreboard-metric text-sm font-semibold text-success">{formatCompactStat(participant.totalHeal)}</div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border/60 px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                {displayAugments.length
                  ? displayAugments.map((augmentId, index) => <AugmentIcon key={`${team.teamId}-augment-${augmentId}-${index}`} augmentId={augmentId} augments={augments} size={20} />)
                  : <span className="text-xs text-muted-foreground">No augments</span>}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
