import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeagueConnectionProvider, useLeagueConnection } from "@/state/league-connection";

const syncMatches = vi.fn();
const getLeagueConnection = vi.fn();
const getLeagueGameflow = vi.fn();
const settingMap = {
  autoSyncEnabled: "true",
  autoSyncIntervalSeconds: "10",
};

vi.mock("@/state/matches-data", () => ({
  useMatches: () => ({
    syncMatches,
  }),
}));

vi.mock("@/state/shell-settings", () => ({
  useShellSettings: () => ({
    settingMap,
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    getLeagueConnection: (...args: unknown[]) => getLeagueConnection(...args),
    getLeagueGameflow: (...args: unknown[]) => getLeagueGameflow(...args),
  },
}));

function Probe() {
  const { leagueConnected } = useLeagueConnection();
  return <div data-testid="league-state">{leagueConnected ? "online" : "offline"}</div>;
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe("LeagueConnectionProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    syncMatches.mockReset();
    getLeagueConnection.mockReset();
    getLeagueGameflow.mockReset();
    settingMap.autoSyncEnabled = "true";
    settingMap.autoSyncIntervalSeconds = "10";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs an auto-sync when the League client reconnects", async () => {
    settingMap.autoSyncIntervalSeconds = "30";
    syncMatches.mockResolvedValue({ ok: true, result: { stored: 0, updated: 0, skipped: 0, matches: [] } });
    getLeagueConnection
      .mockResolvedValueOnce({ ok: true, connected: false })
      .mockResolvedValue({ ok: true, connected: true });
    getLeagueGameflow
      .mockResolvedValueOnce({ ok: true, connected: false, isInGame: false })
      .mockResolvedValue({ ok: true, connected: true, phase: "None", isInGame: false });

    render(
      <LeagueConnectionProvider>
        <Probe />
      </LeagueConnectionProvider>,
    );

    await flush();

    expect(screen.getByTestId("league-state")).toHaveTextContent("offline");

    await advance(30_000);
    await flush();

    expect(syncMatches).toHaveBeenCalledTimes(1);
    expect(syncMatches).toHaveBeenNthCalledWith(1, { origin: "auto", reason: "reconnect", silent: true });
    expect(screen.getByTestId("league-state")).toHaveTextContent("online");
  });

  it("triggers an immediate sync when a tracked game ends", async () => {
    syncMatches.mockResolvedValue({ ok: true, result: { stored: 0, updated: 0, skipped: 0, matches: [] } });
    getLeagueConnection.mockResolvedValue({ ok: true, connected: true });
    getLeagueGameflow
      .mockResolvedValueOnce({ ok: true, connected: true, phase: "InProgress", isInGame: true })
      .mockResolvedValue({ ok: true, connected: true, phase: "None", isInGame: false });

    render(
      <LeagueConnectionProvider>
        <Probe />
      </LeagueConnectionProvider>,
    );

    await flush();

    expect(syncMatches).toHaveBeenCalledTimes(1);
    expect(syncMatches).toHaveBeenNthCalledWith(1, { origin: "auto", reason: "reconnect", silent: true });

    await advance(10_000);
    await flush();

    expect(syncMatches).toHaveBeenCalledTimes(2);
    expect(syncMatches).toHaveBeenNthCalledWith(2, { origin: "auto", reason: "match-ended", silent: true });
  });

  it("does not start duplicate auto-syncs while one is already running", async () => {
    let resolveSync: (() => void) | undefined;
    syncMatches.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSync = () => resolve({ ok: true, result: { stored: 0, updated: 0, skipped: 0, matches: [] } });
        }),
    );
    getLeagueConnection.mockResolvedValue({ ok: true, connected: true });
    getLeagueGameflow.mockResolvedValue({ ok: true, connected: true, phase: "None", isInGame: false });

    render(
      <LeagueConnectionProvider>
        <Probe />
      </LeagueConnectionProvider>,
    );

    await flush();

    expect(syncMatches).toHaveBeenCalledTimes(1);

    await advance(30_000);
    await flush();

    expect(syncMatches).toHaveBeenCalledTimes(1);

    resolveSync?.();
    await flush();
  });
});
