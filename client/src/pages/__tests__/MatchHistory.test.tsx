import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { MatchHistoryPage } from "@/pages/MatchHistory";

const loadMatchDetail = vi.fn().mockResolvedValue(undefined);

vi.mock("@/state/tracker-data", () => ({
  useStaticData: () => ({
    champions: [{ id: "266", name: "Aatrox", icon_path: "", version: "1" }],
    items: [],
    augments: [],
  }),
  useShellSettings: () => ({
    settingMap: {
      showPageDescriptions: "true",
      stickyToolbars: "true",
      dataDensity: "dense",
      density: "comfortable",
      defaultHistoryView: "split",
    },
  }),
  useAnalytics: () => ({
    dashboard: {
      loading: false,
      data: {
        overview: {
          trackedPlayerName: "Player",
          trackedPlayerPuuid: "tracked-puuid",
          totalMatches: 1,
          wins: 1,
          losses: 0,
          winRate: 100,
          averageDurationSeconds: 900,
          averageKda: 3.2,
        },
      },
    },
    loadDashboard: vi.fn(),
  }),
  useMatches: () => ({
    matches: {
      loading: false,
      data: {
        items: [
          {
            matchId: "match-1",
            queueId: 450,
            gameMode: "ARAM",
            gameVersion: "15.1",
            gameModeMutators: [],
            gameCreation: 1_700_000_000_000,
            gameDuration: 900,
            retrievedAt: 1_700_000_000_000,
            summary: "Aatrox carry",
            participants: [
              {
                puuid: "tracked-puuid",
                summonerName: "Player",
                teamId: 100,
                championId: 266,
                championName: "Aatrox",
                kills: 10,
                deaths: 4,
                assists: 8,
                win: true,
                items: [],
                augments: [],
              },
              {
                puuid: "ally-puuid",
                summonerName: "Ally",
                teamId: 200,
                championId: 103,
                championName: "Ahri",
                kills: 4,
                deaths: 8,
                assists: 7,
                win: false,
                items: [],
                augments: [],
              },
            ],
          },
        ],
        total: 1,
        page: 1,
        pageSize: 12,
      },
    },
    matchPage: 1,
    matchPageSize: 12,
    setMatchPage: vi.fn().mockResolvedValue(undefined),
    selectedMatchId: "match-1",
    matchDetail: {
      loading: false,
      data: {
        matchId: "match-1",
        queueId: 450,
        gameMode: "ARAM",
        gameVersion: "15.1",
        gameModeMutators: [],
        gameCreation: 1_700_000_000_000,
        gameDuration: 900,
        retrievedAt: 1_700_000_000_000,
        summary: "Aatrox carry",
        mapId: 12,
        teams: [
          { teamId: 100, win: true, objectives: {}, rawPayload: "{}" },
          { teamId: 200, win: false, objectives: {}, rawPayload: "{}" },
        ],
        rawPayload: {},
        participants: [
          {
            puuid: "tracked-puuid",
            summonerName: "Player",
            teamId: 100,
            championId: 266,
            championName: "Aatrox",
            kills: 10,
            deaths: 4,
            assists: 8,
            totalDamageDealt: 20000,
            totalDamageTaken: 12000,
            goldEarned: 14000,
            totalHeal: 5000,
            championLevel: 18,
            items: [],
            augments: [],
            win: true,
          },
          {
            puuid: "ally-puuid",
            summonerName: "Ally",
            teamId: 200,
            championId: 103,
            championName: "Ahri",
            kills: 4,
            deaths: 8,
            assists: 7,
            totalDamageDealt: 12000,
            totalDamageTaken: 15000,
            goldEarned: 11000,
            totalHeal: 1000,
            championLevel: 16,
            items: [],
            augments: [],
            win: false,
          },
        ],
      },
    },
    loadMatchDetail,
  }),
}));

describe("MatchHistoryPage", () => {
  it("opens a stored match inside the split review panel", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MatchHistoryPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /aatrox/i }));

    const detailPanel = screen.getByTestId("match-history-detail-panel");

    expect(detailPanel).toBeInTheDocument();
    expect(within(detailPanel).getByText(/team scoreboard/i)).toBeInTheDocument();
    expect(within(detailPanel).getByRole("link", { name: /full analysis/i })).toHaveAttribute("href", "/history/match-1");
  });
});
