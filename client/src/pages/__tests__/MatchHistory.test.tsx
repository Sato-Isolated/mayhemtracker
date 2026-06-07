import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MatchHistoryPage } from "@/pages/MatchHistory";
import type { MatchListItem } from "@/lib/types";

const loadMatchDetail = vi.fn().mockResolvedValue(undefined);
const setMatchPage = vi.fn().mockResolvedValue(undefined);
const baseMatch: MatchListItem = {
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
};
let matchItems: MatchListItem[] = [baseMatch];
let matchTotal = 1;
let matchPage = 1;
let selectedMatchId: string | null = "match-1";

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
      defaultHistoryView: "inline",
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
        items: matchItems,
        total: matchTotal,
        page: matchPage,
        pageSize: 12,
      },
    },
    matchPage,
    matchPageSize: 12,
    setMatchPage,
    selectedMatchId,
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
  beforeEach(() => {
    loadMatchDetail.mockClear();
    setMatchPage.mockClear();
    matchItems = [baseMatch];
    matchTotal = 1;
    matchPage = 1;
    selectedMatchId = "match-1";
  });

  it("opens a stored match inline in the archive", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MatchHistoryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/stored matches/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search champion/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /aatrox/i }));

    const detailPanel = screen.getByTestId("match-history-inline-match-1");

    expect(detailPanel).toBeInTheDocument();
    expect(within(detailPanel).getByText(/team scoreboard/i)).toBeInTheDocument();
    expect(within(detailPanel).queryByRole("link", { name: /full analysis/i })).not.toBeInTheDocument();
    expect(within(detailPanel).getAllByText(/damage/i).length).toBeGreaterThan(0);
  });

  it("renders an empty archive state and disables pagination", () => {
    matchItems = [];
    matchTotal = 0;
    selectedMatchId = null;

    render(
      <MemoryRouter>
        <MatchHistoryPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /no local matches/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});
