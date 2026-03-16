import { StatCard } from "@/components/features/stat-card";
import { formatDuration } from "@/lib/tracker-utils";
import type { DashboardOverview, SessionSnapshot, StreakSnapshot } from "@/lib/types";

interface StatsOverviewProps {
  overview: DashboardOverview;
  session: SessionSnapshot;
  streak: StreakSnapshot;
}

export function StatsOverview({ overview, session, streak }: StatsOverviewProps) {
  const sessionDiff = session.winRate - overview.winRate;
  const sessionHint =
    sessionDiff > 0
      ? `+${sessionDiff.toFixed(1)}% vs session`
      : sessionDiff < 0
        ? `${sessionDiff.toFixed(1)}% vs session`
        : "Same as session";

  const streakLabel =
    streak.type === "neutral"
      ? "No active streak"
      : `${streak.type === "win" ? "Win" : "Loss"} streak`;

  const streakValue =
    streak.type === "neutral"
      ? "—"
      : `${streak.value}${streak.type === "win" ? "W" : "L"}`;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        label="Win Rate"
        value={`${overview.winRate}%`}
        hint={sessionHint}
      />
      <StatCard
        label="Average KDA"
        value={overview.averageKda.toFixed(2)}
        hint={`${formatDuration(overview.averageDurationSeconds)} avg duration`}
      />
      <StatCard
        label="Current Streak"
        value={streakValue}
        hint={streakLabel}
      />
      <StatCard
        label="Tracked"
        value={overview.totalMatches}
        hint={`${overview.wins}W · ${overview.losses}L`}
      />
    </div>
  );
}
