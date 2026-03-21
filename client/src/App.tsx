import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Surface } from "@/components/ui/surface";
import { TrackerDataProvider } from "@/state/tracker-data";

const DashboardPage = lazy(() => import("@/pages/Dashboard").then((module) => ({ default: module.DashboardPage })));
const ProfilePage = lazy(() => import("@/pages/Profile").then((module) => ({ default: module.ProfilePage })));
const MatchHistoryPage = lazy(() => import("@/pages/MatchHistory").then((module) => ({ default: module.MatchHistoryPage })));
const GameAnalysisPage = lazy(() => import("@/pages/GameAnalysis").then((module) => ({ default: module.GameAnalysisPage })));
const ChampionsPage = lazy(() => import("@/pages/Champions").then((module) => ({ default: module.ChampionsPage })));
const AugmentsPage = lazy(() => import("@/pages/Augments").then((module) => ({ default: module.AugmentsPage })));
const FriendsPage = lazy(() => import("@/pages/Friends").then((module) => ({ default: module.FriendsPage })));
const SettingsPage = lazy(() => import("@/pages/Settings").then((module) => ({ default: module.SettingsPage })));
const DebugPage = lazy(() => import("@/pages/Debug").then((module) => ({ default: module.DebugPage })));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Surface className="rounded-[1.25rem] px-5 py-4 text-sm text-muted-foreground">
        Chargement de la vue locale...
      </Surface>
    </div>
  );
}

export default function App() {
  return (
    <TrackerDataProvider>
      <AppShell>
        <Suspense fallback={<RouteLoadingFallback />}>
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
