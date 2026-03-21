import type { ReactNode } from "react";
import { AnalyticsProvider, useAnalytics } from "@/state/analytics-data";
import { DiagnosticsProvider, useDiagnostics } from "@/state/diagnostics-data";
import { LeagueConnectionProvider, useLeagueConnection } from "@/state/league-connection";
import { MatchesProvider, useMatches } from "@/state/matches-data";
import { ShellSettingsProvider, useShellSettings } from "@/state/shell-settings";
import { StaticDataProvider, useStaticData } from "@/state/static-data";

export function TrackerDataProvider({ children }: { children: ReactNode }) {
  return (
    <DiagnosticsProvider>
      <ShellSettingsProvider>
        <StaticDataProvider>
          <AnalyticsProvider>
            <MatchesProvider>
              <LeagueConnectionProvider>{children}</LeagueConnectionProvider>
            </MatchesProvider>
          </AnalyticsProvider>
        </StaticDataProvider>
      </ShellSettingsProvider>
    </DiagnosticsProvider>
  );
}

export function useTrackerAppData() {
  return {
    ...useDiagnostics(),
    ...useShellSettings(),
    ...useStaticData(),
    ...useAnalytics(),
    ...useLeagueConnection(),
  };
}

export function useTrackerMatchData() {
  return useMatches();
}

export { useAnalytics, useDiagnostics, useLeagueConnection, useMatches, useShellSettings, useStaticData };
