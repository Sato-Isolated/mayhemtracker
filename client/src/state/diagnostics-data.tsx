import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type {
  LeagueAuthResponse,
  PowerShellResponse,
  StatusResponse,
  SummonerResponse,
} from "@/lib/types";
import { initialAsyncState, useAsyncAction, type AsyncState } from "@/state/shared";

interface DiagnosticsContextValue {
  status: AsyncState<StatusResponse>;
  auth: AsyncState<LeagueAuthResponse>;
  summoner: AsyncState<SummonerResponse>;
  powerShell: AsyncState<PowerShellResponse>;
  testStatus: () => Promise<StatusResponse | undefined>;
  loadLeagueAuth: () => Promise<LeagueAuthResponse | undefined>;
  loadCurrentSummoner: () => Promise<SummonerResponse | undefined>;
  runPowerShellTest: () => Promise<PowerShellResponse | undefined>;
}

const DiagnosticsContext = createContext<DiagnosticsContextValue | undefined>(undefined);

export function DiagnosticsProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AsyncState<StatusResponse>>(initialAsyncState<StatusResponse>());
  const [auth, setAuth] = useState<AsyncState<LeagueAuthResponse>>(initialAsyncState<LeagueAuthResponse>());
  const [summoner, setSummoner] = useState<AsyncState<SummonerResponse>>(initialAsyncState<SummonerResponse>());
  const [powerShell, setPowerShell] = useState<AsyncState<PowerShellResponse>>(initialAsyncState<PowerShellResponse>());
  const { runAction } = useAsyncAction("diagnostics");

  const testStatus = () =>
    runAction(setStatus, api.getStatus, {
      actionName: "testStatus",
      successMessage: "Backend joignable",
    });

  const loadLeagueAuth = () =>
    runAction(setAuth, api.getLeagueAuth, {
      actionName: "loadLeagueAuth",
      successMessage: "Authentification League chargée",
    });

  const loadCurrentSummoner = () =>
    runAction(setSummoner, api.getCurrentSummoner, {
      actionName: "loadCurrentSummoner",
      successMessage: "Summoner chargé",
    });

  const runPowerShellTest = () =>
    runAction(setPowerShell, api.getPowerShellTest, {
      actionName: "runPowerShellTest",
      successMessage: "Test PowerShell exécuté",
    });

  const value = useMemo(
    () => ({
      status,
      auth,
      summoner,
      powerShell,
      testStatus,
      loadLeagueAuth,
      loadCurrentSummoner,
      runPowerShellTest,
    }),
    [auth, powerShell, status, summoner],
  );

  return <DiagnosticsContext value={value}>{children}</DiagnosticsContext>;
}

export function useDiagnostics() {
  const context = useContext(DiagnosticsContext);

  if (!context) {
    throw new Error("useDiagnostics must be used inside DiagnosticsProvider");
  }

  return context;
}
