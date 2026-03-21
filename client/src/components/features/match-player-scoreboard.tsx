import type { ReactNode } from "react";
import { AugmentIcon } from "@/components/features/augment-icon";
import { ItemIcon } from "@/components/features/item-icon";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { formatCompactStat, formatKdaRatio } from "@/lib/stats-utils";
import { getChampionVisual } from "@/lib/tracker-utils";
import type { MatchParticipantSummary, StaticDataEntry } from "@/lib/types";

export interface ScoreboardTeam {
  teamId: number;
  label: string;
  win?: boolean;
  members: MatchParticipantSummary[];
  maxDamage: number;
  maxTaken: number;
}

interface MatchPlayerScoreboardProps {
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
}

const scoreboardGridColumns = "minmax(250px,2.2fr) minmax(82px,0.7fr) minmax(92px,0.8fr) minmax(180px,1.25fr) minmax(180px,1.25fr) minmax(72px,0.5fr) minmax(84px,0.55fr) minmax(84px,0.55fr) minmax(196px,1.5fr) minmax(170px,1.35fr)";

function isTrackedParticipant(
  participant: MatchParticipantSummary,
  tracked: MatchPlayerScoreboardProps["trackedIdentifier"],
) {
  if (tracked.puuid && participant.puuid) {
    return participant.puuid === tracked.puuid;
  }

  return participant.summonerName === tracked.summonerName;
}

function formatSpellLabel(spellId?: number) {
  return spellId ? `S${spellId}` : "-";
}

function renderItemSlots(participant: MatchParticipantSummary, items: StaticDataEntry[], rowKey: string) {
  const filledItems = participant.items.slice(0, 6);
  const emptySlots = Math.max(6 - filledItems.length, 0);

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {filledItems.map((itemId, itemIndex) => (
        <ItemIcon key={`${rowKey}-item-${itemId}-${itemIndex}`} itemId={itemId} items={items} size={22} />
      ))}
      {Array.from({ length: emptySlots }, (_, slotIndex) => (
        <ItemIcon key={`${rowKey}-item-empty-${slotIndex}`} itemId="0" items={items} size={22} />
      ))}
    </div>
  );
}

function renderAugmentSlots(participant: MatchParticipantSummary, augments: StaticDataEntry[], rowKey: string) {
  if (!participant.augments.length) {
    return <span className="text-xs text-muted-foreground">No augment</span>;
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {participant.augments.map((augmentId, augmentIndex) => (
        <AugmentIcon key={`${rowKey}-augment-${augmentId}-${augmentIndex}`} augmentId={augmentId} augments={augments} size={18} />
      ))}
    </div>
  );
}

function StatBar({ value, maxValue, tone }: { value?: number; maxValue: number; tone: "damage" | "taken" }) {
  const safeValue = value ?? 0;
  const width = `${Math.max((safeValue / Math.max(maxValue, 1)) * 100, safeValue > 0 ? 8 : 0)}%`;
  const barClass = tone === "damage"
    ? "bg-gradient-to-r from-[color-mix(in_oklch,var(--error)_88%,#fb7185)] to-[color-mix(in_oklch,var(--error)_58%,#fecdd3)]"
    : "bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_82%,#38bdf8)] to-[color-mix(in_oklch,var(--accent)_68%,#bae6fd)]";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <div className="h-4.5 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--muted)_72%,transparent)]">
        <span className={`block h-full rounded-full ${barClass}`} style={{ width }} />
      </div>
      <div className="text-xs font-semibold text-foreground">{formatCompactStat(safeValue)}</div>
    </div>
  );
}

export function MatchPlayerScoreboard({
  teams,
  trackedIdentifier,
  champions,
  items,
  augments,
  teamSummary,
}: MatchPlayerScoreboardProps) {
  return (
    <div className="space-y-4">
      {teams.map((team) => {
        const trackedTeam = team.teamId === trackedIdentifier.teamId;

        return (
          <section
            key={team.teamId}
            className={`overflow-hidden rounded-[1.05rem] border bg-[color-mix(in_oklch,var(--card)_88%,transparent)] ${trackedTeam ? "border-[color-mix(in_oklch,var(--primary)_34%,var(--border))]" : "border-[color-mix(in_oklch,var(--destructive)_22%,var(--border))]"}`}
          >
            <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 ${trackedTeam ? "bg-[color-mix(in_oklch,var(--primary)_16%,var(--muted))]" : "bg-[color-mix(in_oklch,var(--destructive)_10%,var(--muted))]"}`}>
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{team.label}</div>
                  <div className="text-xs text-muted-foreground">{team.win ? "Victory" : "Defeat"}</div>
                </div>
                <Badge variant={team.win ? "success" : "error"}>{team.members.length} players</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {trackedTeam ? <Badge variant="outline">Tracked side</Badge> : null}
              </div>
            </div>

            {teamSummary ? teamSummary(team) : null}

            <div className="overflow-x-auto px-4 pb-4 pt-3">
              <div className="min-w-[1480px]">
                <div
                  className="grid gap-3 border-b border-border/60 px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                  style={{ gridTemplateColumns: scoreboardGridColumns }}
                >
                  <div>Player</div>
                  <div>Spells</div>
                  <div>KDA</div>
                  <div>Damage</div>
                  <div>Taken</div>
                  <div>Lvl.</div>
                  <div>Gold</div>
                  <div>Heal</div>
                  <div>Items</div>
                  <div>Augments</div>
                </div>

                <div className="divide-y divide-border/60">
                  {team.members.map((participant, index) => {
                    const visual = getChampionVisual(participant, champions);
                    const tracked = isTrackedParticipant(participant, trackedIdentifier);
                    const rowKey = `${participant.puuid ?? participant.summonerName ?? index}-${participant.championId ?? index}`;

                    return (
                      <div
                        key={rowKey}
                        className={`grid gap-3 px-2 py-2.5 ${tracked ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]" : ""}`}
                        style={{ gridTemplateColumns: scoreboardGridColumns }}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {visual.icon ? <img src={visual.icon} alt={visual.name} className="h-12 w-12 rounded-2xl object-cover" /> : <div className="h-12 w-12 rounded-2xl bg-secondary/70" />}
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-sm font-semibold text-foreground">{participant.summonerName ?? participant.riotIdGameName ?? "Unknown"}</div>
                              {tracked ? <Badge variant="secondary" className="px-2 py-0.5 text-[0.58rem]">Tracked</Badge> : null}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{visual.name}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Surface variant="subtle" className="flex min-w-[36px] items-center justify-center rounded-xl px-2 py-1 text-xs font-semibold text-foreground">
                            {formatSpellLabel(participant.spell1Id)}
                          </Surface>
                          <Surface variant="subtle" className="flex min-w-[36px] items-center justify-center rounded-xl px-2 py-1 text-xs font-semibold text-foreground">
                            {formatSpellLabel(participant.spell2Id)}
                          </Surface>
                        </div>

                        <div className="flex flex-col justify-center">
                          <div className="text-sm font-semibold text-foreground">{participant.kills ?? 0} / {participant.deaths ?? 0} / {participant.assists ?? 0}</div>
                          <div className="text-xs text-muted-foreground">{formatKdaRatio(participant.kills, participant.deaths, participant.assists).toFixed(2)}</div>
                        </div>

                        <StatBar value={participant.totalDamageDealt} maxValue={team.maxDamage} tone="damage" />

                        <StatBar value={participant.totalDamageTaken} maxValue={team.maxTaken} tone="taken" />

                        <div className="flex items-center text-sm font-semibold text-foreground">{participant.championLevel ?? "-"}</div>

                        <div className="flex items-center text-sm font-semibold text-foreground">{formatCompactStat(participant.goldEarned)}</div>

                        <div className="flex items-center text-sm font-semibold text-success">{formatCompactStat(participant.totalHeal)}</div>

                        <div className="flex items-center">{renderItemSlots(participant, items, rowKey)}</div>

                        <div className="flex items-center">{renderAugmentSlots(participant, augments, rowKey)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
