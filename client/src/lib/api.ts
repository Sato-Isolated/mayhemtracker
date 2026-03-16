import type {
  AugmentStatsResponse,
  ChampionStatsResponse,
  DashboardResponse,
  LeagueAuthResponse,
  LeagueConnectionResponse,
  MatchDetailResponse,
  MatchListResponse,
  MatchSyncResponse,
  PowerShellResponse,
  ProfileResponse,
  RatingUpdateResponse,
  RatingsResponse,
  SettingUpdateResponse,
  SettingsResponse,
  StaticListResponse,
  StaticSyncResponse,
  StatusResponse,
  SummonerResponse,
  TeammateStatsResponse,
} from "./types";
import { debugLog } from "./debug-log";

async function request<T>(input: string, init?: RequestInit) {
  const startedAt = performance.now();
  debugLog.info("api", "request:start", {
    input,
    method: init?.method ?? "GET",
    body: init?.body,
  });

  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = (await response.json()) as T & { error?: string };
  debugLog.info("api", "request:response", {
    input,
    method: init?.method ?? "GET",
    status: response.status,
    ok: response.ok,
    durationMs: Math.round(performance.now() - startedAt),
    payload,
  });

  if (!response.ok) {
    debugLog.error("api", "request:error", { input, status: response.status, payload });
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return payload;
}

export const api = {
  getStatus: () => request<StatusResponse>("/api/status"),
  getLeagueConnection: () => request<LeagueConnectionResponse>("/api/league/connection"),
  getLeagueAuth: () => request<LeagueAuthResponse>("/api/league/auth"),
  getCurrentSummoner: () => request<SummonerResponse>("/api/league/summoner"),
  getPowerShellTest: () => request<PowerShellResponse>("/api/system/powershell-test"),
  syncStaticData: () => request<StaticSyncResponse>("/api/static-data/sync", { method: "POST" }),
  getChampions: () => request<StaticListResponse>("/api/static-data/champions"),
  getAugments: () => request<StaticListResponse>("/api/static-data/augments"),
  getItems: () => request<StaticListResponse>("/api/static-data/items"),
  syncMatches: () => request<MatchSyncResponse>("/api/matches/sync-current", { method: "POST" }),
  getMatches: (page = 1, pageSize = 20) => request<MatchListResponse>(`/api/matches?page=${page}&pageSize=${pageSize}`),
  getMatch: (matchId: string) => request<MatchDetailResponse>(`/api/matches/${matchId}`),
  clearMatches: () => request<{ ok: boolean; message: string }>("/api/matches/clear", { method: "DELETE" }),
  getDashboard: () => request<DashboardResponse>("/api/analytics/dashboard"),
  getProfile: () => request<ProfileResponse>("/api/analytics/profile"),
  getChampionStats: () => request<ChampionStatsResponse>("/api/analytics/champions"),
  getAugmentStats: () => request<AugmentStatsResponse>("/api/analytics/augments"),
  getTeammates: () => request<TeammateStatsResponse>("/api/analytics/teammates"),
  getSettings: () => request<SettingsResponse>("/api/settings"),
  updateSetting: (key: string, value: string) =>
    request<SettingUpdateResponse>("/api/settings", {
      method: "PUT",
      body: JSON.stringify({ key, value }),
    }),
  getRatings: () => request<RatingsResponse>("/api/ratings"),
  updateRating: (targetPuuid: string, summonerName: string | undefined, rating: number | undefined, note: string | undefined) =>
    request<RatingUpdateResponse>("/api/ratings", {
      method: "PUT",
      body: JSON.stringify({ targetPuuid, summonerName, rating, note }),
    }),
};
