import { ActivityHeatmap } from "@/components/features/activity-heatmap";
import { RecentMatchFeed } from "@/components/features/recent-match-feed";
import { StatsOverview } from "@/components/features/stats-overview";
import { Button } from "@/components/ui/button";
import { useTrackerAppData, useTrackerMatchData } from "@/state/tracker-data";

export function DashboardPage() {
  const { dashboard, champions, items, augments, loadDashboard } = useTrackerAppData();
  const { syncMatches } = useTrackerMatchData();

  if (!dashboard.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Loading dashboard data…</p>
        <Button onClick={() => void loadDashboard()}>Reload</Button>
      </div>
    );
  }

  const { overview, recentSession, streak, activity, recentMatches } = dashboard.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {overview.trackedPlayerName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {overview.totalMatches} matches tracked
          </p>
        </div>
        <Button size="sm" onClick={() => void syncMatches()}>
          Synchronize
        </Button>
      </div>

      <StatsOverview overview={overview} session={recentSession} streak={streak} />

      <ActivityHeatmap items={activity} variant="embedded" showStats={false} />

      <RecentMatchFeed
        matches={recentMatches}
        champions={champions ?? []}
        items={items ?? []}
        augments={augments ?? []}
      />
    </div>
  );
}
