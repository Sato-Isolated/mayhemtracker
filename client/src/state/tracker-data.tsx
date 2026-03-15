import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { debugLog } from "@/lib/debug-log";
import type {
  AppSetting,
  AugmentStats,
  ChampionStats,
  DashboardAnalytics,
  LeagueAuthResponse,
  MatchDetail,
  MatchListItem,
  MatchSyncResponse,
  PowerShellResponse,
  ProfileAnalytics,
  StaticDataEntry,
  StaticSyncResponse,
  StatusResponse,
  SummonerResponse,
  TeammateStats,
} from "@/lib/types";

export type AsyncState<T> = {
  loading: boolean;
  data?: T;
  error?: string;
};

const initialState = <T,>(): AsyncState<T> => ({ loading: false });

type MatchesState = { items: MatchListItem[]; total: number; page: number; pageSize: number };

interface TrackerAppDataContextValue {
  status: AsyncState<StatusResponse>;
  auth: AsyncState<LeagueAuthResponse>;
  summoner: AsyncState<SummonerResponse>;
  powerShell: AsyncState<PowerShellResponse>;
  staticSync: AsyncState<StaticSyncResponse>;
  dashboard: AsyncState<DashboardAnalytics>;
  profile: AsyncState<ProfileAnalytics>;
  championStats: AsyncState<ChampionStats[]>;
  augmentStats: AsyncState<AugmentStats[]>;
  teammates: AsyncState<TeammateStats[]>;
  settings: AsyncState<AppSetting[]>;
  champions: StaticDataEntry[];
  items: StaticDataEntry[];
  augments: StaticDataEntry[];
  loadStaticLists: () => Promise<void>;
  loadDashboard: () => Promise<DashboardAnalytics | undefined>;
  loadProfile: () => Promise<ProfileAnalytics | undefined>;
  loadChampionStats: () => Promise<ChampionStats[] | undefined>;
  loadAugmentStats: () => Promise<AugmentStats[] | undefined>;
  loadTeammates: () => Promise<TeammateStats[] | undefined>;
  loadSettings: () => Promise<AppSetting[] | undefined>;
  updateSetting: (key: string, value: string) => Promise<void>;
  updatePlayerRating: (targetPuuid: string, summonerName: string | undefined, rating: number | undefined, note?: string) => Promise<void>;
  testStatus: () => Promise<StatusResponse | undefined>;
  loadLeagueAuth: () => Promise<LeagueAuthResponse | undefined>;
  loadCurrentSummoner: () => Promise<SummonerResponse | undefined>;
  runPowerShellTest: () => Promise<PowerShellResponse | undefined>;
  syncStaticData: () => Promise<StaticSyncResponse | undefined>;
}

interface TrackerMatchDataContextValue {
  matches: AsyncState<MatchesState>;
  matchDetail: AsyncState<MatchDetail>;
  selectedMatchId: string | null;
  matchPage: number;
  matchPageSize: number;
  loadMatches: (page?: number, pageSize?: number) => Promise<void>;
  loadMatchDetail: (matchId: string) => Promise<void>;
  setMatchPage: (page: number) => Promise<void>;
  syncMatches: () => Promise<MatchSyncResponse>;
  clearMatches: () => Promise<void>;
}

const TrackerAppDataContext = createContext<TrackerAppDataContextValue | undefined>(undefined);
const TrackerMatchDataContext = createContext<TrackerMatchDataContextValue | undefined>(undefined);

export function TrackerDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AsyncState<StatusResponse>>(initialState<StatusResponse>());
  const [auth, setAuth] = useState<AsyncState<LeagueAuthResponse>>(initialState<LeagueAuthResponse>());
  const [summoner, setSummoner] = useState<AsyncState<SummonerResponse>>(initialState<SummonerResponse>());
  const [powerShell, setPowerShell] = useState<AsyncState<PowerShellResponse>>(initialState<PowerShellResponse>());
  const [staticSync, setStaticSync] = useState<AsyncState<StaticSyncResponse>>(initialState<StaticSyncResponse>());
  const [dashboard, setDashboard] = useState<AsyncState<DashboardAnalytics>>(initialState<DashboardAnalytics>());
  const [profile, setProfile] = useState<AsyncState<ProfileAnalytics>>(initialState<ProfileAnalytics>());
  const [championStats, setChampionStats] = useState<AsyncState<ChampionStats[]>>(initialState<ChampionStats[]>());
  const [augmentStats, setAugmentStats] = useState<AsyncState<AugmentStats[]>>(initialState<AugmentStats[]>());
  const [teammates, setTeammates] = useState<AsyncState<TeammateStats[]>>(initialState<TeammateStats[]>());
  const [settings, setSettings] = useState<AsyncState<AppSetting[]>>(initialState<AppSetting[]>());
  const [champions, setChampions] = useState<StaticDataEntry[]>([]);
  const [items, setItems] = useState<StaticDataEntry[]>([]);
  const [augments, setAugments] = useState<StaticDataEntry[]>([]);
  const [matches, setMatches] = useState<AsyncState<MatchesState>>(initialState<MatchesState>());
  const [matchDetail, setMatchDetail] = useState<AsyncState<MatchDetail>>(initialState<MatchDetail>());
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchPage, setMatchPageState] = useState(1);
  const [matchPageSize] = useState(12);
  const selectedMatchIdRef = useRef<string | null>(null);
  const requestedMatchDetailIdRef = useRef<string | null>(null);
  const matchPageRef = useRef(1);

  useEffect(() => {
    selectedMatchIdRef.current = selectedMatchId;
  }, [selectedMatchId]);

  useEffect(() => {
    matchPageRef.current = matchPage;
  }, [matchPage]);

  const runAction = useCallback(async function runAction<T>(setState: (value: AsyncState<T>) => void, action: () => Promise<T>, successMessage?: string) {
    debugLog.info("tracker-data", "runAction:start", { successMessage });
    setState({ loading: true });
    try {
      const data = await action();
      debugLog.info("tracker-data", "runAction:success", { successMessage, data });
      setState({ loading: false, data });
      if (successMessage) {
        toast.success(successMessage);
      }
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      debugLog.error("tracker-data", "runAction:error", { successMessage, message, error });
      setState({ loading: false, error: message });
      toast.error(message);
      return undefined;
    }
  }, []);

  const loadStaticLists = useCallback(async function loadStaticLists() {
    try {
      debugLog.info("tracker-data", "loadStaticLists:start");
      const [championsResponse, augmentsResponse, itemsResponse] = await Promise.all([
        api.getChampions(),
        api.getAugments(),
        api.getItems(),
      ]);
      debugLog.info("tracker-data", "loadStaticLists:success", {
        champions: championsResponse.items.length,
        augments: augmentsResponse.items.length,
        items: itemsResponse.items.length,
        sampleAugment: augmentsResponse.items[0],
      });
      setChampions(championsResponse.items);
      setAugments(augmentsResponse.items);
      setItems(itemsResponse.items);
    } catch (error) {
      debugLog.error("tracker-data", "loadStaticLists:error", error);
      toast.error(error instanceof Error ? error.message : "Unable to load static data lists.");
    }
  }, []);

  const loadDashboard = useCallback(async function loadDashboard() {
    const result = await runAction(setDashboard, async () => (await api.getDashboard()).dashboard);
    return result;
  }, [runAction]);

  const loadProfile = useCallback(async function loadProfile() {
    return runAction(setProfile, async () => (await api.getProfile()).profile);
  }, [runAction]);

  const loadChampionStats = useCallback(async function loadChampionStats() {
    return runAction(setChampionStats, async () => (await api.getChampionStats()).items);
  }, [runAction]);

  const loadAugmentStats = useCallback(async function loadAugmentStats() {
    return runAction(setAugmentStats, async () => (await api.getAugmentStats()).items);
  }, [runAction]);

  const loadTeammates = useCallback(async function loadTeammates() {
    return runAction(setTeammates, async () => (await api.getTeammates()).items);
  }, [runAction]);

  const loadSettings = useCallback(async function loadSettings() {
    return runAction(setSettings, async () => (await api.getSettings()).items);
  }, [runAction]);

  const refreshAnalytics = useCallback(async function refreshAnalytics() {
    await Promise.all([loadDashboard(), loadProfile(), loadChampionStats(), loadAugmentStats(), loadTeammates()]);
  }, [loadAugmentStats, loadChampionStats, loadDashboard, loadProfile, loadTeammates]);

  const loadMatches = useCallback(async function loadMatches(page = matchPageRef.current, pageSize = matchPageSize) {
    debugLog.info("tracker-data", "loadMatches:start", { page, pageSize, selectedMatchId: selectedMatchIdRef.current });
    const result = await runAction(setMatches, async () => {
      const response = await api.getMatches(page, pageSize);
      return { items: response.items, total: response.total, page: response.page, pageSize: response.pageSize };
    });

    if (!result) {
      return;
    }

    setMatchPageState(page);

    const nextSelected = result.items.find((item) => item.matchId === selectedMatchIdRef.current)?.matchId ?? result.items[0]?.matchId ?? null;
  debugLog.info("tracker-data", "loadMatches:selection", { nextSelected, total: result.total, page: result.page });
    setSelectedMatchId((current) => (current === nextSelected ? current : nextSelected));

    if (!nextSelected) {
      setMatchDetail(initialState<MatchDetail>());
    }
  }, [matchPageSize, runAction]);

  const loadMatchDetail = useCallback(async function loadMatchDetail(matchId: string) {
    debugLog.info("tracker-data", "loadMatchDetail:start", { matchId });
    requestedMatchDetailIdRef.current = matchId;
    setSelectedMatchId((current) => (current === matchId ? current : matchId));
    try {
      await runAction(setMatchDetail, async () => {
        const response = await api.getMatch(matchId);
        if (!response.match) {
          throw new Error("Match detail missing.");
        }
        return response.match;
      });
    } finally {
      if (requestedMatchDetailIdRef.current === matchId) {
        requestedMatchDetailIdRef.current = null;
      }
    }
  }, [runAction]);

  const syncStaticData = useCallback(async function syncStaticData() {
    debugLog.info("tracker-data", "syncStaticData:start");
    const data = await runAction(setStaticSync, api.syncStaticData, "Static data synchronized");
    if (data) {
      debugLog.info("tracker-data", "syncStaticData:reload-static-lists");
      await loadStaticLists();
    }
    return data;
  }, [loadStaticLists, runAction]);

  const syncMatches = useCallback(async function syncMatches() {
    debugLog.info("tracker-data", "syncMatches:start");
    const payload = await api.syncMatches();
    debugLog.info("tracker-data", "syncMatches:success", payload.result);
    toast.success(`Sync matchs: ${payload.result.stored} nouveaux, ${payload.result.updated} mis à jour`);
    await Promise.all([loadMatches(), refreshAnalytics()]);
    return payload;
  }, [loadMatches, refreshAnalytics]);

  const clearMatches = useCallback(async function clearMatches() {
    await api.clearMatches();
    toast.success("Stored matches cleared");
    setMatches({ loading: false, data: { items: [], total: 0, page: 1, pageSize: matchPageSize } });
    setSelectedMatchId(null);
    setMatchDetail(initialState<MatchDetail>());
    setMatchPageState(1);
    await refreshAnalytics();
  }, [matchPageSize, refreshAnalytics]);

  const setMatchPage = useCallback(async function setMatchPage(page: number) {
    const nextPage = Math.max(page, 1);
    await loadMatches(nextPage, matchPageSize);
  }, [loadMatches, matchPageSize]);

  const updateSetting = useCallback(async function updateSetting(key: string, value: string) {
    const payload = await api.updateSetting(key, value);
    setSettings((current) => {
      const existing = current.data ?? [];
      const next = existing.filter((entry) => entry.key !== key).concat(payload.item).sort((left, right) => left.key.localeCompare(right.key));
      return { loading: false, data: next };
    });
    toast.success("Préférence enregistrée");
  }, []);

  const updatePlayerRating = useCallback(async function updatePlayerRating(targetPuuid: string, summonerName: string | undefined, rating: number | undefined, note?: string) {
    await api.updateRating(targetPuuid, summonerName, rating, note);
    toast.success("Évaluation enregistrée");
    await loadTeammates();
  }, [loadTeammates]);

  const testStatus = useCallback(() => runAction(setStatus, api.getStatus, "Backend reachable"), [runAction]);
  const loadLeagueAuth = useCallback(() => runAction(setAuth, api.getLeagueAuth, "League auth loaded"), [runAction]);
  const loadCurrentSummoner = useCallback(() => runAction(setSummoner, api.getCurrentSummoner, "Summoner loaded"), [runAction]);
  const runPowerShellTest = useCallback(() => runAction(setPowerShell, api.getPowerShellTest, "PowerShell test executed"), [runAction]);

  useEffect(() => {
    debugLog.info("tracker-data", "bootstrap:start");
    void loadStaticLists();
    void loadMatches();
    void refreshAnalytics();
    void loadSettings();
  }, [loadMatches, loadSettings, loadStaticLists, refreshAnalytics]);

  useEffect(() => {
    if (selectedMatchId) {
      if (requestedMatchDetailIdRef.current === selectedMatchId) {
        return;
      }

      debugLog.debug("tracker-data", "selectedMatchId:changed", { selectedMatchId });
      void loadMatchDetail(selectedMatchId);
    }
  }, [loadMatchDetail, selectedMatchId]);

  const appValue: TrackerAppDataContextValue = useMemo(() => ({
    status,
    auth,
    summoner,
    powerShell,
    staticSync,
    dashboard,
    profile,
    championStats,
    augmentStats,
    teammates,
    settings,
    champions,
    items,
    augments,
    loadStaticLists,
    loadDashboard,
    loadProfile,
    loadChampionStats,
    loadAugmentStats,
    loadTeammates,
    loadSettings,
    updateSetting,
    updatePlayerRating,
    testStatus,
    loadLeagueAuth,
    loadCurrentSummoner,
    runPowerShellTest,
    syncStaticData,
  }), [
    auth,
    augmentStats,
    augments,
    championStats,
    champions,
    dashboard,
    items,
    loadAugmentStats,
    loadChampionStats,
    loadCurrentSummoner,
    loadDashboard,
    loadLeagueAuth,
    loadProfile,
    loadSettings,
    loadStaticLists,
    loadTeammates,
    powerShell,
    profile,
    settings,
    staticSync,
    status,
    summoner,
    syncStaticData,
    teammates,
    testStatus,
    runPowerShellTest,
    updatePlayerRating,
    updateSetting,
  ]);

  const matchValue: TrackerMatchDataContextValue = useMemo(() => ({
    matches,
    matchDetail,
    selectedMatchId,
    matchPage,
    matchPageSize,
    loadMatches,
    loadMatchDetail,
    setMatchPage,
    syncMatches,
    clearMatches,
  }), [
    clearMatches,
    loadMatchDetail,
    loadMatches,
    matchDetail,
    matchPage,
    matchPageSize,
    matches,
    selectedMatchId,
    setMatchPage,
    syncMatches,
  ]);

  return (
    <TrackerAppDataContext value={appValue}>
      <TrackerMatchDataContext value={matchValue}>{children}</TrackerMatchDataContext>
    </TrackerAppDataContext>
  );
}

export function useTrackerAppData() {
  const context = useContext(TrackerAppDataContext);
  if (!context) {
    throw new Error("useTrackerAppData must be used inside TrackerDataProvider");
  }

  return context;
}

export function useTrackerMatchData() {
  const context = useContext(TrackerMatchDataContext);
  if (!context) {
    throw new Error("useTrackerMatchData must be used inside TrackerDataProvider");
  }

  return context;
}