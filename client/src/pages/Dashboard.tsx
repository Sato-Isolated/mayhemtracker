import { useEffect } from "react";
import { ActivityHeatmap } from "@/components/features/activity-heatmap";
import { PageIntro } from "@/components/features/page-intro";
import { RecentMatchFeed } from "@/components/features/recent-match-feed";
import { StatsOverview } from "@/components/features/stats-overview";
import { Button } from "@/components/ui/button";
import { useAnalytics, useMatches, useStaticData } from "@/state/tracker-data";

export function DashboardPage() {
  const { dashboard, loadDashboard } = useAnalytics();
  const { champions, items, augments } = useStaticData();
  const { syncMatches } = useMatches();

  useEffect(() => {
    if (!dashboard.data && !dashboard.loading) {
      void loadDashboard();
    }
  }, [dashboard.data, dashboard.loading, loadDashboard]);

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
      <PageIntro
        eyebrow="Operational dashboard"
        title={overview.trackedPlayerName}
        description={`${overview.totalMatches} matches tracked`}
        actions={<Button size="sm" onClick={() => void syncMatches()}>Synchronize</Button>}
      />

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
