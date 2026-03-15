import { authenticate, createHttp1Request, type Credentials, type HttpRequestOptions } from "league-connect";
import type { CurrentSummonerDto, LeagueCredentialsDto } from "../types/league.js";

let credentials: Credentials | null = null;

async function connect() {
  credentials = await authenticate({ windowsShell: "powershell" });
  return credentials;
}

async function leagueRequest<T>(url: string, method: HttpRequestOptions["method"] = "GET") {
  if (!credentials) {
    await connect();
  }

  const response = await createHttp1Request({ url, method }, credentials!);
  if (!response.ok) {
    throw new Error(`LCU request failed: ${response.status} ${url}`);
  }

  return (await response.json()) as T;
}

export class LeagueService {
  async getAuth(): Promise<LeagueCredentialsDto> {
    const activeCredentials = await connect();
    return {
      port: activeCredentials.port,
      username: "riot",
      password: activeCredentials.password,
      address: `https://127.0.0.1:${activeCredentials.port}`,
      authorizationHeader: `Basic ${Buffer.from(`riot:${activeCredentials.password}`).toString("base64")}`,
    };
  }

  async getCurrentSummoner(): Promise<CurrentSummonerDto> {
    const payload = await leagueRequest<Record<string, unknown>>("/lol-summoner/v1/current-summoner");

    return {
      displayName: String(payload.displayName ?? payload.gameName ?? "Unknown"),
      gameName: payload.gameName ? String(payload.gameName) : undefined,
      tagLine: payload.tagLine ? String(payload.tagLine) : undefined,
      profileIconId: typeof payload.profileIconId === "number" ? payload.profileIconId : undefined,
      summonerId: typeof payload.summonerId === "number" ? payload.summonerId : undefined,
      puuid: payload.puuid ? String(payload.puuid) : undefined,
      summonerLevel: typeof payload.summonerLevel === "number" ? payload.summonerLevel : undefined,
      raw: payload,
    };
  }

  async getMatchHistory() {
    const currentSummoner = await this.getCurrentSummoner();
    if (!currentSummoner.puuid) {
      throw new Error("No current summoner PUUID available.");
    }

    try {
      return await leagueRequest<Record<string, unknown>>(
        `/lol-match-history/v1/products/lol/${currentSummoner.puuid}/matches?begIndex=0&endIndex=19`,
      );
    } catch {
      return leagueRequest<Record<string, unknown>>(
        "/lol-match-history/v1/products/lol/current-summoner/matches?begIndex=0&endIndex=19",
      );
    }
  }

  async getGameDetails(gameId: number) {
    return leagueRequest<Record<string, unknown>>(`/lol-match-history/v1/games/${gameId}`);
  }

  async safeGetGameDetails(gameId: number) {
    try {
      return await this.getGameDetails(gameId);
    } catch {
      return null;
    }
  }
}

export const leagueService = new LeagueService();
