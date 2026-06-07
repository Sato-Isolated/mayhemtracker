import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChampionsPage } from "@/pages/Champions";

vi.mock("@/lib/api", () => ({
  api: {
    getMatches: vi.fn(async () => ({
      ok: true,
      page: 1,
      pageSize: 100,
      total: 1,
      items: [
        {
          matchId: "match-lux",
          gameMode: "ARAM",
          gameModeMutators: [],
          gameCreation: 1710000000000,
          gameDuration: 1210,
          retrievedAt: 1710000000000,
          summary: "Lux victory",
          participants: [
            {
              puuid: "tracked-puuid",
              championId: 1,
              championName: "Lux",
              summonerName: "Tracked",
              kills: 12,
              deaths: 3,
              assists: 18,
              totalDamageDealt: 32000,
              goldEarned: 15000,
              win: true,
              items: [],
              augments: [],
            },
          ],
        },
      ],
    })),
  },
}));

vi.mock("@/state/tracker-data", () => ({
  useAnalytics: () => ({
    dashboard: {
      loading: false,
      data: {
        overview: {
          trackedPlayerPuuid: "tracked-puuid",
        },
      },
    },
    championStats: {
      loading: false,
      data: [
        {
          championId: 1,
          championName: "Lux",
          matches: 8,
          wins: 5,
          losses: 3,
          winRate: 63,
          averageKda: 4.2,
          averageDamage: 18234,
          averageGold: 12654,
        },
        {
          championId: 2,
          championName: "Garen",
          matches: 4,
          wins: 2,
          losses: 2,
          winRate: 50,
          averageKda: 2.1,
          averageDamage: 14000,
          averageGold: 11000,
        },
      ],
    },
    loadChampionStats: vi.fn(),
    loadDashboard: vi.fn(),
  }),
  useShellSettings: () => ({
    settingMap: {
      showPageDescriptions: "true",
      stickyToolbars: "true",
      dataDensity: "dense",
      density: "comfortable",
    },
  }),
  useStaticData: () => ({
    champions: [
      {
        id: "Lux",
        name: "Lux",
        icon_path: "/lux.png",
        version: "test",
        numeric_id: 1,
      },
      {
        id: "Garen",
        name: "Garen",
        icon_path: "/garen.png",
        version: "test",
        numeric_id: 2,
      },
    ],
    loadStaticLists: vi.fn(),
  }),
}));

describe("ChampionsPage", () => {
  it("filters champions and opens inline details from a focusable row", async () => {
    const user = userEvent.setup();

    render(<ChampionsPage />);

    expect(screen.getByTestId("champions-toolbar")).toHaveAttribute("data-density", "dense");

    await user.type(screen.getByLabelText(/search champion/i), "lux");

    expect(screen.getByRole("button", { name: /Lux/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Garen/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Lux/i }));

    expect(await screen.findByText(/Lux victory/i)).toBeInTheDocument();
    expect(screen.getByText(/12\/3\/18/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Victory/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lux").length).toBeGreaterThan(0);
  });
});
