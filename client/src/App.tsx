import { Suspense, lazy } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Navigate, Route, Routes } from "react-router-dom";
import { TrackerDataProvider } from "@/state/tracker-data";

const AugmentsPage = lazy(async () => ({ default: (await import("@/pages/Augments")).AugmentsPage }));
const ChampionsPage = lazy(async () => ({ default: (await import("@/pages/Champions")).ChampionsPage }));
const DashboardPage = lazy(async () => ({ default: (await import("@/pages/Dashboard")).DashboardPage }));
const DebugPage = lazy(async () => ({ default: (await import("@/pages/Debug")).DebugPage }));
const FriendsPage = lazy(async () => ({ default: (await import("@/pages/Friends")).FriendsPage }));
const GameAnalysisPage = lazy(async () => ({ default: (await import("@/pages/GameAnalysis")).GameAnalysisPage }));
const MatchHistoryPage = lazy(async () => ({ default: (await import("@/pages/MatchHistory")).MatchHistoryPage }));
const ProfilePage = lazy(async () => ({ default: (await import("@/pages/Profile")).ProfilePage }));
const SettingsPage = lazy(async () => ({ default: (await import("@/pages/Settings")).SettingsPage }));

function RouteFallback() {
  return (
    <div className="space-y-6">
      <section className="panel-surface route-fallback-shell rounded-[1.6rem] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Loading route</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Preparing the next view</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Route-level code splitting keeps the initial bundle lighter while the shell stays responsive.
        </p>
        <div className="route-fallback-grid mt-6">
          <div className="route-fallback-card" />
          <div className="route-fallback-card" />
          <div className="route-fallback-card route-fallback-card-wide" />
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <TrackerDataProvider>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/history" element={<MatchHistoryPage />} />
            <Route path="/history/:matchId" element={<GameAnalysisPage />} />
            <Route path="/champions" element={<ChampionsPage />} />
            <Route path="/augments" element={<AugmentsPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/debug" element={<DebugPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </TrackerDataProvider>
  );
}
