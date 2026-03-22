import { createContext, useContext, useEffect, useEffectEvent, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { debugLog } from "@/lib/debug-log";
import { useMatches } from "@/state/matches-data";
import { useShellSettings } from "@/state/shell-settings";

interface LeagueConnectionContextValue {
  leagueConnected: boolean;
}

const LeagueConnectionContext = createContext<LeagueConnectionContextValue | undefined>(undefined);
const HEARTBEAT_INTERVAL_MS = 10_000;

function parseAutoSyncIntervalSeconds(value: string | undefined) {
  return value === "30" || value === "60" ? Number(value) : 10;
}

function isTrackedInGamePhase(phase: string | null) {
  if (!phase) {
    return false;
  }

  const normalized = phase.trim().toLowerCase();
  return normalized === "gamestart" || normalized === "inprogress" || normalized === "reconnect";
}

export function LeagueConnectionProvider({ children }: { children: ReactNode }) {
  const { syncMatches } = useMatches();
  const { settingMap } = useShellSettings();
  const [leagueConnected, setLeagueConnected] = useState(false);
  const previousConnectionRef = useRef(false);
  const previousPhaseRef = useRef<string | null>(null);
  const leagueConnectedRef = useRef(false);
  const isAutoSyncRunningRef = useRef(false);
  const lastAutoSyncAtRef = useRef(0);
  const autoSyncEnabled = settingMap.autoSyncEnabled !== "false";
  const autoSyncIntervalMs = parseAutoSyncIntervalSeconds(settingMap.autoSyncIntervalSeconds) * 1000;

  const runAutoSync = useEffectEvent(async (reason: "reconnect" | "heartbeat" | "match-ended") => {
    if (!autoSyncEnabled || isAutoSyncRunningRef.current) {
      return;
    }

    const now = Date.now();
    if (reason === "heartbeat" && now - lastAutoSyncAtRef.current < HEARTBEAT_INTERVAL_MS) {
      return;
    }

    debugLog.info("league-connection", "autoSync:start", { reason });
    isAutoSyncRunningRef.current = true;
    lastAutoSyncAtRef.current = now;

    try {
      await syncMatches({ origin: "auto", reason, silent: true });
    } catch (error) {
      debugLog.error("league-connection", "autoSync:error", { reason, error });
    } finally {
      isAutoSyncRunningRef.current = false;
    }
  });

  const pollLeagueState = useEffectEvent(async () => {
    const [connection, gameflow] = await Promise.all([
      api.getLeagueConnection(),
      api.getLeagueGameflow(),
    ]);

    const wasConnected = previousConnectionRef.current;
    const isConnected = connection.connected;
    const previousPhase = previousPhaseRef.current;
    const nextPhase = gameflow.connected && !gameflow.errorCode ? gameflow.phase ?? null : null;
    const wasInGame = isTrackedInGamePhase(previousPhase);
    const isInGame = gameflow.connected && !gameflow.errorCode ? gameflow.isInGame : false;

    previousConnectionRef.current = isConnected;
    leagueConnectedRef.current = isConnected;
    setLeagueConnected(isConnected);

    if (!wasConnected && isConnected) {
      debugLog.info("league-connection", "reconnected");
      void runAutoSync("reconnect");
    }

    if (previousPhase && wasInGame && !isInGame) {
      debugLog.info("league-connection", "match-ended", { previousPhase, nextPhase });
      void runAutoSync("match-ended");
    }

    previousPhaseRef.current = nextPhase;
  });

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        await pollLeagueState();
      } catch (error) {
        if (!active) {
          return;
        }

        debugLog.error("league-connection", "poll:error", error);
        previousConnectionRef.current = false;
        previousPhaseRef.current = null;
        leagueConnectedRef.current = false;
        setLeagueConnected(false);
      }
    }

    void poll();
    const pollIntervalId = window.setInterval(() => void poll(), autoSyncIntervalMs);
    const heartbeatIntervalId = window.setInterval(() => {
      if (!leagueConnectedRef.current) {
        return;
      }

      void runAutoSync("heartbeat");
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(pollIntervalId);
      window.clearInterval(heartbeatIntervalId);
    };
  }, [autoSyncIntervalMs]);

  const value = useMemo(() => ({ leagueConnected }), [leagueConnected]);

  return <LeagueConnectionContext value={value}>{children}</LeagueConnectionContext>;
}

export function useLeagueConnection() {
  const context = useContext(LeagueConnectionContext);

  if (!context) {
    throw new Error("useLeagueConnection must be used inside LeagueConnectionProvider");
  }

  return context;
}
