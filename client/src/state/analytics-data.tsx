import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type {
  AugmentStats,
  ChampionStats,
  DashboardAnalytics,
  ProfileAnalytics,
  TeammateStats,
} from "@/lib/types";
import { initialAsyncState, useAsyncAction, type AsyncState } from "@/state/shared";

interface AnalyticsContextValue {
  dashboard: AsyncState<DashboardAnalytics>;
  profile: AsyncState<ProfileAnalytics>;
  championStats: AsyncState<ChampionStats[]>;
  augmentStats: AsyncState<AugmentStats[]>;
  teammates: AsyncState<TeammateStats[]>;
  loadDashboard: () => Promise<DashboardAnalytics | undefined>;
  loadProfile: () => Promise<ProfileAnalytics | undefined>;
  loadChampionStats: () => Promise<ChampionStats[] | undefined>;
  loadAugmentStats: () => Promise<AugmentStats[] | undefined>;
  loadTeammates: () => Promise<TeammateStats[] | undefined>;
  refreshAnalytics: () => Promise<void>;
  updatePlayerRating: (targetPuuid: string, summonerName: string | undefined, rating: number | undefined, note?: string) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [dashboard, setDashboard] = useState<AsyncState<DashboardAnalytics>>(initialAsyncState<DashboardAnalytics>());
  const [profile, setProfile] = useState<AsyncState<ProfileAnalytics>>(initialAsyncState<ProfileAnalytics>());
  const [championStats, setChampionStats] = useState<AsyncState<ChampionStats[]>>(initialAsyncState<ChampionStats[]>());
  const [augmentStats, setAugmentStats] = useState<AsyncState<AugmentStats[]>>(initialAsyncState<AugmentStats[]>());
  const [teammates, setTeammates] = useState<AsyncState<TeammateStats[]>>(initialAsyncState<TeammateStats[]>());
  const { runAction } = useAsyncAction("analytics");

  const loadDashboard = async () =>
    runAction(setDashboard, async () => (await api.getDashboard()).dashboard, {
      actionName: "loadDashboard",
    });

  const loadProfile = async () =>
    runAction(setProfile, async () => (await api.getProfile()).profile, {
      actionName: "loadProfile",
    });

  const loadChampionStats = async () =>
    runAction(setChampionStats, async () => (await api.getChampionStats()).items, {
      actionName: "loadChampionStats",
    });

  const loadAugmentStats = async () =>
    runAction(setAugmentStats, async () => (await api.getAugmentStats()).items, {
      actionName: "loadAugmentStats",
    });

  const loadTeammates = async () =>
    runAction(setTeammates, async () => (await api.getTeammates()).items, {
      actionName: "loadTeammates",
    });

  async function refreshAnalytics() {
    await Promise.all([loadDashboard(), loadProfile(), loadChampionStats(), loadAugmentStats(), loadTeammates()]);
  }

  async function updatePlayerRating(targetPuuid: string, summonerName: string | undefined, rating: number | undefined, note?: string) {
    await api.updateRating(targetPuuid, summonerName, rating, note);
    toast.success("Évaluation enregistrée");
    await loadTeammates();
  }

  const value = useMemo(
    () => ({
      dashboard,
      profile,
      championStats,
      augmentStats,
      teammates,
      loadDashboard,
      loadProfile,
      loadChampionStats,
      loadAugmentStats,
      loadTeammates,
      refreshAnalytics,
      updatePlayerRating,
    }),
    [augmentStats, championStats, dashboard, profile, teammates],
  );

  return <AnalyticsContext value={value}>{children}</AnalyticsContext>;
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error("useAnalytics must be used inside AnalyticsProvider");
  }

  return context;
}
