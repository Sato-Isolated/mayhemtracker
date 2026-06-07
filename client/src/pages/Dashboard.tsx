import { useEffect } from "react";
import { ActivityHeatmap } from "@/components/features/activity-heatmap";
import { DataPanel } from "@/components/features/data-panel";
import { LoadingState } from "@/components/features/loading-state";
import { PageIntro } from "@/components/features/page-intro";
import { PageToolbar } from "@/components/features/page-toolbar";
import { RecentMatchFeed } from "@/components/features/recent-match-feed";
import { StatsOverview } from "@/components/features/stats-overview";
import { StatusBadge } from "@/components/features/status-badge";
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
      <LoadingState label="Loading dashboard data..." />
    );
  }

  const { overview, recentSession, streak, activity, recentMatches } = dashboard.data;

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Operational dashboard"
        title="Dashboard"
        description={`Tracked player: ${overview.trackedPlayerName} - ${overview.totalMatches} matches tracked locally.`}
      />

      <PageToolbar
        testId="dashboard-toolbar"
        meta={(
          <>
            <StatusBadge>{overview.totalMatches} tracked</StatusBadge>
            <StatusBadge tone="info">{recentSession.matches} this session</StatusBadge>
            <StatusBadge>{recentMatches.length} recent rows</StatusBadge>
          </>
        )}
        actions={<Button size="sm" onClick={() => void syncMatches()}>Sync now</Button>}
      />

      <StatsOverview overview={overview} session={recentSession} streak={streak} />

      <DataPanel
        title="Activity pace"
        description="A compact yearly rhythm view for local match volume."
        contentClassName="p-0"
      >
        <ActivityHeatmap items={activity} variant="embedded" showStats={false} />
      </DataPanel>

      <RecentMatchFeed
        matches={recentMatches}
        champions={champions ?? []}
        items={items ?? []}
        augments={augments ?? []}
      />
    </div>
  );
}
