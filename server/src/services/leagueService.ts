import { authenticate, createHttp1Request, type Credentials, type HttpRequestOptions } from "league-connect";
import { runtimeConfig } from "../config/runtime.js";
import { LcuConnectionError } from "../errors/app-error.js";
import type { CurrentSummonerDto, LeagueCredentialsDto, LeagueGameflowDto } from "../types/league.js";
import { logger } from "../utils/logger.js";

let credentials: Credentials | null = null;

function withTimeout<T>(task: Promise<T>, timeoutMs: number, timeoutFactory: () => Error) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(timeoutFactory()), timeoutMs);
    task
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function classifyLeagueError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("lockfile") || message.includes("league client") || message.includes("process not found")) {
    return new LcuConnectionError("client_not_running", "League client is not running.", { cause: message });
  }

  if (message.includes("401") || message.includes("403") || message.includes("unauthorized") || message.includes("forbidden")) {
    return new LcuConnectionError("auth_failed", "League client authentication failed.", { cause: message });
  }

  if (message.includes("404")) {
    return new LcuConnectionError("endpoint_unavailable", "League endpoint is unavailable.", { cause: message });
  }

  if (message.includes("timeout") || message.includes("econnrefused") || message.includes("fetch failed") || message.includes("socket")) {
    return new LcuConnectionError("lcu_unreachable", "League client is unreachable.", { cause: message });
  }

  if (error instanceof LcuConnectionError) {
    return error;
  }

  return new LcuConnectionError("unexpected_payload", "Unexpected response from League client.", { cause: message });
}

function requireRecord(payload: unknown, message: string) {
  if (!payload || typeof payload !== "object") {
    throw new LcuConnectionError("unexpected_payload", message);
  }

  return payload as Record<string, unknown>;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function isInGamePhase(phase: string | undefined) {
  if (!phase) {
    return false;
  }

  const normalized = phase.trim().toLowerCase();
  return normalized === "gamestart" || normalized === "inprogress" || normalized === "reconnect";
}

function extractGameflowDetails(payload: unknown) {
  const session = readRecord(payload);
  const gameData = readRecord(session?.gameData);
  const queue = readRecord(gameData?.queue);
  const gameDodge = readRecord(gameData?.gameDodge);

  return {
    gameId:
      readNumber(session?.gameId) ??
      readNumber(gameData?.gameId) ??
      readNumber(gameData?.id),
    queueId:
      readNumber(session?.queueId) ??
      readNumber(gameData?.queueId) ??
      readNumber(queue?.id) ??
      readNumber(queue?.queueId) ??
      readNumber(gameDodge?.queueId),
  };
}

async function connect(forceRefresh = false) {
  if (credentials && !forceRefresh) {
    return credentials;
  }

  try {
    credentials = await withTimeout(
      authenticate({ windowsShell: "powershell" }),
      runtimeConfig.leagueRequestTimeoutMs,
      () => new LcuConnectionError("lcu_unreachable", "Timed out while connecting to the League client."),
    );
    return credentials;
  } catch (error) {
    credentials = null;
    throw classifyLeagueError(error);
  }
}

async function requestJson<T>(url: string, method: HttpRequestOptions["method"] = "GET") {
  const activeCredentials = await connect();

  const response = await withTimeout(
    createHttp1Request({ url, method }, activeCredentials),
    runtimeConfig.leagueRequestTimeoutMs,
    () => new LcuConnectionError("lcu_unreachable", `Timed out while calling ${url}.`),
  );

  if (response.status === 401 || response.status === 403) {
    throw new LcuConnectionError("auth_failed", `League client rejected ${url}.`, { status: response.status });
  }

  if (response.status === 404) {
    throw new LcuConnectionError("endpoint_unavailable", `League endpoint ${url} is unavailable.`, { status: response.status });
  }

  if (!response.ok) {
    throw new LcuConnectionError("lcu_unreachable", `LCU request failed for ${url}.`, { status: response.status });
  }

  return (await response.json()) as T;
}

async function leagueRequest<T>(url: string, method: HttpRequestOptions["method"] = "GET") {
  try {
    return await requestJson<T>(url, method);
  } catch (error) {
    const classified = classifyLeagueError(error);
    if (classified.code === "auth_failed" || classified.code === "lcu_unreachable") {
      logger.warn("league", "request:retry", { url, code: classified.code });
      credentials = null;
      try {
        await connect(true);
        return await requestJson<T>(url, method);
      } catch (retryError) {
        throw classifyLeagueError(retryError);
      }
    }

    throw classified;
  }
}

export class LeagueService {
  async getConnectionStatus() {
    try {
      await connect(true);
      return { connected: true as const };
    } catch (error) {
      const classified = classifyLeagueError(error);
      return {
        connected: false as const,
        errorCode: classified.code,
        errorMessage: classified.message,
      };
    }
  }

  async getAuth(): Promise<LeagueCredentialsDto> {
    const activeCredentials = await connect(true);
    return {
      port: activeCredentials.port,
      username: "riot",
      password: activeCredentials.password,
      address: `https://127.0.0.1:${activeCredentials.port}`,
      authorizationHeader: `Basic ${Buffer.from(`riot:${activeCredentials.password}`).toString("base64")}`,
    };
  }

  async getCurrentSummoner(): Promise<CurrentSummonerDto> {
    const payload = requireRecord(
      await leagueRequest<unknown>("/lol-summoner/v1/current-summoner"),
      "League did not return a valid current summoner payload.",
    );

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

  async getGameflowState(): Promise<LeagueGameflowDto> {
    try {
      await connect(true);
    } catch (error) {
      const classified = classifyLeagueError(error);
      return {
        connected: false,
        isInGame: false,
        errorCode: classified.code,
        errorMessage: classified.message,
      };
    }

    let phase: string | undefined;

    try {
      const phasePayload = await leagueRequest<unknown>("/lol-gameflow/v1/gameflow-phase");
      phase = readString(phasePayload) ?? readString(readRecord(phasePayload)?.phase);
    } catch (error) {
      const classified = classifyLeagueError(error);
      return {
        connected: classified.code === "endpoint_unavailable",
        phase,
        isInGame: false,
        errorCode: classified.code,
        errorMessage: classified.message,
      };
    }

    try {
      const sessionPayload = await leagueRequest<unknown>("/lol-gameflow/v1/session");
      const details = extractGameflowDetails(sessionPayload);

      return {
        connected: true,
        phase,
        isInGame: isInGamePhase(phase),
        gameId: details.gameId,
        queueId: details.queueId,
      };
    } catch (error) {
      const classified = classifyLeagueError(error);

      if (classified.code !== "endpoint_unavailable") {
        return {
          connected: false,
          phase,
          isInGame: isInGamePhase(phase),
          errorCode: classified.code,
          errorMessage: classified.message,
        };
      }

      return {
        connected: true,
        phase,
        isInGame: isInGamePhase(phase),
        errorCode: classified.code,
        errorMessage: classified.message,
      };
    }
  }

  async getMatchHistory() {
    const currentSummoner = await this.getCurrentSummoner();
    if (!currentSummoner.puuid) {
      throw new LcuConnectionError("unexpected_payload", "No current summoner PUUID available.");
    }

    const endIndex = Math.max(runtimeConfig.matchHistoryBegIndex, runtimeConfig.matchHistoryEndIndex);

    try {
      return requireRecord(
        await leagueRequest<unknown>(
          `/lol-match-history/v1/products/lol/${currentSummoner.puuid}/matches?begIndex=${runtimeConfig.matchHistoryBegIndex}&endIndex=${endIndex}`,
        ),
        "League did not return a valid match history payload.",
      );
    } catch (error) {
      const classified = classifyLeagueError(error);
      if (classified.code !== "endpoint_unavailable") {
        throw classified;
      }

      return requireRecord(
        await leagueRequest<unknown>(
          `/lol-match-history/v1/products/lol/current-summoner/matches?begIndex=${runtimeConfig.matchHistoryBegIndex}&endIndex=${endIndex}`,
        ),
        "League did not return a valid current-summoner match history payload.",
      );
    }
  }

  async getGameDetails(gameId: number) {
    return requireRecord(
      await leagueRequest<unknown>(`/lol-match-history/v1/games/${gameId}`),
      `League did not return valid details for game ${gameId}.`,
    );
  }

  async safeGetGameDetails(gameId: number) {
    try {
      return await this.getGameDetails(gameId);
    } catch (error) {
      logger.warn("league", "game-details:failed", { gameId, error: classifyLeagueError(error).code });
      return null;
    }
  }
}

export const leagueService = new LeagueService();
export { classifyLeagueError, isInGamePhase };
