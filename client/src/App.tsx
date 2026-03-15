import { AppShell } from "@/components/layout/app-shell";
import { Navigate, Route, Routes } from "react-router-dom";
import { AugmentsPage } from "@/pages/Augments";
import { ChampionsPage } from "@/pages/Champions";
import { DashboardPage } from "@/pages/Dashboard";
import { DebugPage } from "@/pages/Debug";
import { FriendsPage } from "@/pages/Friends";
import { GameAnalysisPage } from "@/pages/GameAnalysis";
import { MatchHistoryPage } from "@/pages/MatchHistory";
import { ProfilePage } from "@/pages/Profile";
import { SettingsPage } from "@/pages/Settings";
import { TrackerDataProvider } from "@/state/tracker-data";

export default function App() {
  return (
    <TrackerDataProvider>
      <AppShell>
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
      </AppShell>
    </TrackerDataProvider>
  );
}
