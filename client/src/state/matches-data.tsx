import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { MatchDetail, MatchListItem, MatchSyncResponse } from "@/lib/types";
import { debugLog } from "@/lib/debug-log";
import { sendNotification } from "@/lib/notifications";
import { useAnalytics } from "@/state/analytics-data";
import { useShellSettings } from "@/state/shell-settings";
import { initialAsyncState, useAsyncAction, type AsyncState } from "@/state/shared";

type MatchesState = {
  items: MatchListItem[];
  total: number;
  page: number;
  pageSize: number;
};

type MatchSyncReason = "manual" | "reconnect" | "heartbeat" | "match-ended";

interface MatchSyncOptions {
  origin?: "manual" | "auto";
  reason?: MatchSyncReason;
  silent?: boolean;
}

interface MatchesContextValue {
  matches: AsyncState<MatchesState>;
  matchDetail: AsyncState<MatchDetail>;
  selectedMatchId: string | null;
  matchPage: number;
  matchPageSize: number;
  loadMatches: (page?: number, pageSize?: number) => Promise<void>;
  loadMatchDetail: (matchId: string) => Promise<void>;
  setMatchPage: (page: number) => Promise<void>;
  syncMatches: (options?: MatchSyncOptions) => Promise<MatchSyncResponse>;
  clearMatches: () => Promise<void>;
}

const MatchesContext = createContext<MatchesContextValue | undefined>(undefined);

export function MatchesProvider({ children }: { children: ReactNode }) {
  const { refreshAnalytics } = useAnalytics();
  const { notificationsEnabled } = useShellSettings();
  const [matches, setMatches] = useState<AsyncState<MatchesState>>(initialAsyncState<MatchesState>());
  const [matchDetail, setMatchDetail] = useState<AsyncState<MatchDetail>>(initialAsyncState<MatchDetail>());
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchPage, setMatchPageState] = useState(1);
  const [matchPageSize] = useState(12);
  const selectedMatchIdRef = useRef<string | null>(null);
  const requestedMatchDetailIdRef = useRef<string | null>(null);
  const matchPageRef = useRef(1);
  const { runAction } = useAsyncAction("matches");

  useEffect(() => {
    selectedMatchIdRef.current = selectedMatchId;
  }, [selectedMatchId]);

  useEffect(() => {
    matchPageRef.current = matchPage;
  }, [matchPage]);

  const loadMatches = async (page = matchPageRef.current, pageSize = matchPageSize) => {
    const result = await runAction(
      setMatches,
      async () => {
        const response = await api.getMatches(page, pageSize);
        return { items: response.items, total: response.total, page: response.page, pageSize: response.pageSize };
      },
      { actionName: "loadMatches" },
    );

    if (!result) {
      return;
    }

    setMatchPageState(page);

    const nextSelected =
      result.items.find((item) => item.matchId === selectedMatchIdRef.current)?.matchId ??
      result.items[0]?.matchId ??
      null;

    setSelectedMatchId((current) => (current === nextSelected ? current : nextSelected));

    if (!nextSelected) {
      setMatchDetail(initialAsyncState<MatchDetail>());
    }
  };

  const loadMatchDetail = async (matchId: string) => {
    requestedMatchDetailIdRef.current = matchId;
    setSelectedMatchId((current) => (current === matchId ? current : matchId));

    try {
      await runAction(
        setMatchDetail,
        async () => {
          const response = await api.getMatch(matchId);
          if (!response.match) {
            throw new Error("Match detail missing.");
          }
          return response.match;
        },
        { actionName: "loadMatchDetail" },
      );
    } finally {
      if (requestedMatchDetailIdRef.current === matchId) {
        requestedMatchDetailIdRef.current = null;
      }
    }
  };

  async function syncMatches(options: MatchSyncOptions = {}) {
    const origin = options.origin ?? "manual";
    const reason = options.reason ?? (origin === "auto" ? "heartbeat" : "manual");
    const silent = options.silent ?? origin === "auto";
    const payload = await api.syncMatches();
    const hasStoredMatches = payload.result.stored > 0;
    const syncLabel = reason === "manual" ? "Sync" : "Auto-sync";
    const syncMessage = `${syncLabel}: ${payload.result.stored} new, ${payload.result.updated} updated`;

    if (!silent) {
      toast.success(syncMessage);
    }

    if (hasStoredMatches && notificationsEnabled) {
      sendNotification("Mayhem Tracker", { body: syncMessage });
    }

    const activeMatchId = selectedMatchIdRef.current;
    const shouldRefreshDetail = Boolean(
      activeMatchId &&
      (matchPageRef.current === 1 || payload.result.matches.some((match) => match.matchId === activeMatchId)),
    );

    await Promise.all([loadMatches(), refreshAnalytics()]);

    if (shouldRefreshDetail && activeMatchId) {
      await loadMatchDetail(activeMatchId);
    }

    return payload;
  }

  async function clearMatches() {
    await api.clearMatches();
    toast.success("Local matches deleted");
    setMatches({ loading: false, data: { items: [], total: 0, page: 1, pageSize: matchPageSize } });
    setSelectedMatchId(null);
    setMatchDetail(initialAsyncState<MatchDetail>());
    setMatchPageState(1);
    await refreshAnalytics();
  }

  async function setMatchPage(page: number) {
    const nextPage = Math.max(page, 1);
    await loadMatches(nextPage, matchPageSize);
  }

  useEffect(() => {
    void loadMatches();
  }, []);

  useEffect(() => {
    if (!selectedMatchId || requestedMatchDetailIdRef.current === selectedMatchId) {
      return;
    }

    debugLog.debug("matches", "selectedMatchId:changed", { selectedMatchId });
    void loadMatchDetail(selectedMatchId);
  }, [selectedMatchId]);

  const value = useMemo(
    () => ({
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
    }),
    [matchDetail, matchPage, matchPageSize, matches, selectedMatchId],
  );

  return <MatchesContext value={value}>{children}</MatchesContext>;
}

export function useMatches() {
  const context = useContext(MatchesContext);

  if (!context) {
    throw new Error("useMatches must be used inside MatchesProvider");
  }

  return context;
}
