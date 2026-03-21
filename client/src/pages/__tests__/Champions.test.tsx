import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChampionsPage } from "@/pages/Champions";

vi.mock("@/state/tracker-data", () => ({
  useAnalytics: () => ({
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
  }),
}));

describe("ChampionsPage", () => {
  it("filters champions and opens details from a focusable button", async () => {
    const user = userEvent.setup();

    render(<ChampionsPage />);

    await user.type(screen.getByLabelText(/rechercher un champion/i), "lux");

    expect(screen.getByRole("button", { name: "Lux" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Garen" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Lux" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/lecture compacte des signaux principaux/i)).toBeInTheDocument();
    expect(screen.getAllByText("Lux").length).toBeGreaterThan(0);
  });
});
