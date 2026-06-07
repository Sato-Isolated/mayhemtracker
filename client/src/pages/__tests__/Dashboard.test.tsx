import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "@/pages/Dashboard";

vi.mock("@/state/tracker-data", () => ({
  useShellSettings: () => ({
    settingMap: {
      showPageDescriptions: "true",
      dataDensity: "comfortable",
      density: "comfortable",
    },
  }),
  useAnalytics: () => ({
    dashboard: {
      loading: false,
      data: {
        overview: {
          trackedPlayerName: "Player",
          trackedPlayerPuuid: "tracked-puuid",
          totalMatches: 24,
          wins: 14,
          losses: 10,
          winRate: 58,
          averageDurationSeconds: 960,
          averageKda: 3.25,
        },
        recentSession: {
          matches: 4,
          wins: 3,
          losses: 1,
          winRate: 75,
          averageKda: 4.1,
        },
        streak: { type: "win", value: 2 },
        activity: [
          { key: "2026-06-01", label: "01/06", matches: 2, intensity: 4 },
          { key: "2026-06-02", label: "02/06", matches: 1, intensity: 2 },
        ],
        recentMatches: [],
        trend: [],
        topChampions: [],
        topAugments: [],
      },
    },
    loadDashboard: vi.fn(),
  }),
  useMatches: () => ({
    syncMatches: vi.fn().mockResolvedValue(undefined),
  }),
  useStaticData: () => ({
    champions: [],
    items: [],
    augments: [],
  }),
}));

describe("DashboardPage", () => {
  it("renders the dashboard metrics, activity, and recent match panel", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText(/tracked player: player/i)).toBeInTheDocument();
    expect(screen.getByText("Win Rate")).toBeInTheDocument();
    expect(screen.getByText("Average KDA")).toBeInTheDocument();
    expect(screen.getByTestId("activity-heatmap-card")).toBeInTheDocument();
    expect(screen.getByText("Recent Matches")).toBeInTheDocument();
  });
});
