import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { AugmentIcon } from "@/components/features/augment-icon";
import { ItemIcon } from "@/components/features/item-icon";
import { StatusBadge } from "@/components/features/status-badge";
import { Button } from "@/components/ui/button";
import { formatCompactStat, formatKdaRatio } from "@/lib/stats-utils";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";
import type { MatchDetail, MatchListItem, MatchParticipantSummary, StaticDataEntry } from "@/lib/types";

interface MatchDetailPanelProps {
  match: MatchListItem;
  detail?: MatchDetail;
  trackedPuuid?: string;
  champions: StaticDataEntry[];
  items: StaticDataEntry[];
  augments: StaticDataEntry[];
}

function getTrackedParticipant(match: MatchListItem, trackedPuuid?: string) {
  return trackedPuuid
    ? match.participants.find((participant) => participant.puuid === trackedPuuid) ?? match.participants[0]
    : match.participants[0];
}

function BuildSlots({ participant, items, augments }: { participant?: MatchParticipantSummary; items: StaticDataEntry[]; augments: StaticDataEntry[] }) {
  if (!participant) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <div>
        <div className="mb-2 text-[0.68rem] font-semibold uppercase text-muted-foreground">Items</div>
        <div className="flex flex-wrap gap-1.5">
          {participant.items.slice(0, 6).map((itemId, index) => (
            <ItemIcon key={`${itemId}-${index}`} itemId={itemId} items={items} size={32} />
          ))}
          {Array.from({ length: Math.max(6 - participant.items.length, 0) }).map((_, index) => (
            <ItemIcon key={`empty-item-${index}`} itemId="0" items={items} size={32} />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[0.68rem] font-semibold uppercase text-muted-foreground">Augments</div>
        <div className="flex min-h-9 flex-wrap items-center gap-2">
          {participant.augments.length ? participant.augments.map((augmentId, index) => (
            <AugmentIcon key={`${augmentId}-${index}`} augmentId={augmentId} augments={augments} size={24} />
          )) : <span className="text-xs text-muted-foreground">No augment data</span>}
        </div>
      </div>
    </div>
  );
}

function CompactTeam({
  label,
  win,
  members,
  trackedPuuid,
  champions,
}: {
  label: string;
  win?: boolean;
  members: MatchParticipantSummary[];
  trackedPuuid?: string;
  champions: StaticDataEntry[];
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border/65">
      <div className="flex items-center justify-between gap-2 bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))] px-3 py-2">
        <div>
          <div className="text-sm font-semibold text-foreground">{label}</div>
          <div className={win ? "text-xs text-success" : "text-xs text-error"}>{win ? "Victory" : "Defeat"}</div>
        </div>
        <StatusBadge>{members.length} players</StatusBadge>
      </div>

      <div className="divide-y divide-border/55">
        {members.map((participant, index) => {
          const visual = getChampionVisual(participant, champions);
          const tracked = trackedPuuid ? participant.puuid === trackedPuuid : false;
          const key = `${participant.puuid ?? participant.summonerName ?? index}-${participant.championId ?? index}`;

          return (
            <div key={key} className={tracked ? "grid grid-cols-[minmax(0,1fr)_4.8rem] gap-2 bg-[color-mix(in_oklch,var(--primary)_8%,transparent)] px-3 py-2" : "grid grid-cols-[minmax(0,1fr)_4.8rem] gap-2 px-3 py-2"}>
              <div className="flex min-w-0 items-center gap-2.5">
                {visual.icon ? (
                  <img src={visual.icon} alt={visual.name} className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
                ) : (
                  <div className="size-9 shrink-0 rounded-full bg-muted" />
                )}
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="truncate text-sm font-semibold text-foreground">{participant.summonerName ?? participant.riotIdGameName ?? "Unknown"}</div>
                    {tracked ? <span className="rounded-sm border border-primary/45 px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase text-primary">Tracked</span> : null}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{visual.name} - {formatCompactStat(participant.totalDamageDealt)} damage</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">{participant.kills ?? 0}/{participant.deaths ?? 0}/{participant.assists ?? 0}</div>
                <div className="text-xs text-muted-foreground">{formatKdaRatio(participant.kills, participant.deaths, participant.assists).toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MatchDetailPanel({
  match,
  detail,
  trackedPuuid,
  champions,
  items,
  augments,
}: MatchDetailPanelProps) {
  const trackedParticipant = getTrackedParticipant(match, trackedPuuid);
  const trackedVisual = trackedParticipant ? getChampionVisual(trackedParticipant, champions) : { name: "Unknown", icon: "" };
  const isWin = trackedParticipant?.win === true;
  const kdaRatio = formatKdaRatio(trackedParticipant?.kills, trackedParticipant?.deaths, trackedParticipant?.assists);

  const scoreTeams = detail?.teams.map((team, teamIndex) => ({
    ...team,
    label: `Team ${teamIndex + 1}`,
    members: detail.participants.filter((participant) => participant.teamId === team.teamId),
  })) ?? [];

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--card)_82%,var(--background))] p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {trackedVisual.icon ? (
              <img src={trackedVisual.icon} alt={trackedVisual.name} className="size-14 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-1 ring-white/10">?</div>
            )}
            <div className="min-w-0">
              <div className={isWin ? "text-sm font-semibold text-success" : "text-sm font-semibold text-error"}>{isWin ? "Victory" : "Defeat"}</div>
              <div className="truncate text-xl font-semibold text-foreground">{trackedVisual.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{match.gameMode ?? "League"} - {formatDuration(match.gameDuration)} - {formatDate(match.gameCreation ?? match.retrievedAt)}</div>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link to={`/history/${match.matchId}`}>
              <ExternalLink className="size-4" />
              Full analysis
            </Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-md border border-border/60 bg-background/45 p-2">
            <div className="text-[0.64rem] uppercase text-muted-foreground">KDA</div>
            <div className="mt-1 text-base font-semibold text-foreground">{trackedParticipant?.kills ?? 0}/{trackedParticipant?.deaths ?? 0}/{trackedParticipant?.assists ?? 0}</div>
            <div className="text-xs text-primary">{kdaRatio.toFixed(2)} ratio</div>
          </div>
          <div className="rounded-md border border-border/60 bg-background/45 p-2">
            <div className="text-[0.64rem] uppercase text-muted-foreground">Damage</div>
            <div className="mt-1 text-base font-semibold text-foreground">{formatCompactStat(trackedParticipant?.totalDamageDealt)}</div>
          </div>
          <div className="rounded-md border border-border/60 bg-background/45 p-2">
            <div className="text-[0.64rem] uppercase text-muted-foreground">Gold</div>
            <div className="mt-1 text-base font-semibold text-foreground">{formatCompactStat(trackedParticipant?.goldEarned)}</div>
          </div>
          <div className="rounded-md border border-border/60 bg-background/45 p-2">
            <div className="text-[0.64rem] uppercase text-muted-foreground">Heal</div>
            <div className="mt-1 text-base font-semibold text-success">{formatCompactStat(trackedParticipant?.totalHeal)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--card)_82%,var(--background))] p-3">
        <BuildSlots participant={trackedParticipant} items={items} augments={augments} />
      </div>

      {!detail ? (
        <div className="history-spotlight-empty flex min-h-[12rem] items-center justify-center rounded-md border border-dashed border-border/70 text-sm text-muted-foreground">
          Loading details...
        </div>
      ) : (
        <div className="rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--card)_82%,var(--background))] p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-foreground">Team scoreboard</div>
              <div className="mt-1 text-xs text-muted-foreground">Compact team-by-team breakdown.</div>
            </div>
            <StatusBadge>{detail.participants.length} players</StatusBadge>
          </div>

          <div className="grid gap-3">
            {scoreTeams.map((team) => (
              <CompactTeam
                key={team.teamId}
                label={team.label}
                win={team.win}
                members={team.members}
                trackedPuuid={trackedParticipant?.puuid}
                champions={champions}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
