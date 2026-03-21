import { createContext, useContext, useEffect, useEffectEvent, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { debugLog } from "@/lib/debug-log";
import { useMatches } from "@/state/matches-data";

interface LeagueConnectionContextValue {
  leagueConnected: boolean;
}

const LeagueConnectionContext = createContext<LeagueConnectionContextValue | undefined>(undefined);

export function LeagueConnectionProvider({ children }: { children: ReactNode }) {
  const { syncMatches } = useMatches();
  const [leagueConnected, setLeagueConnected] = useState(false);
  const previousConnectionRef = useRef(false);

  const handleReconnect = useEffectEvent(async () => {
    debugLog.info("league-connection", "reconnected");

    try {
      await syncMatches({ origin: "auto" });
    } catch (error) {
      debugLog.error("league-connection", "autoSync:error", error);
    }
  });

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const response = await api.getLeagueConnection();

        if (!active) {
          return;
        }

        const wasConnected = previousConnectionRef.current;
        const isConnected = response.connected;
        previousConnectionRef.current = isConnected;
        setLeagueConnected(isConnected);

        if (!wasConnected && isConnected) {
          await handleReconnect();
        }
      } catch {
        if (!active) {
          return;
        }

        previousConnectionRef.current = false;
        setLeagueConnected(false);
      }
    }

    void poll();
    const intervalId = window.setInterval(() => void poll(), 10_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

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
