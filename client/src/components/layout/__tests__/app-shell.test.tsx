import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";

const syncMatches = vi.fn().mockResolvedValue(undefined);
const syncStaticData = vi.fn().mockResolvedValue(undefined);

const mockSettingMap = {
  showPageDescriptions: "true",
  compactSidebar: "false",
  dataDensity: "comfortable",
  density: "comfortable",
};

vi.mock("@/state/tracker-data", () => ({
  useShellSettings: () => ({ settingMap: mockSettingMap }),
  useLeagueConnection: () => ({ leagueConnected: true }),
  useStaticData: () => ({
    champions: [{ id: "1" }, { id: "2" }],
    items: [{ id: "3" }],
    augments: [{ id: "4" }],
    syncStaticData,
  }),
  useMatches: () => ({
    matches: { data: { total: 42 } },
    syncMatches,
  }),
}));

describe("AppShell", () => {
  beforeEach(() => {
    mockSettingMap.showPageDescriptions = "true";
    mockSettingMap.compactSidebar = "false";
    mockSettingMap.dataDensity = "comfortable";
    mockSettingMap.density = "comfortable";
    syncMatches.mockClear();
    syncStaticData.mockClear();
  });

  it("renders the french shell copy and sync actions", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <AppShell>
          <div>Contenu</div>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Navigation principale")).toBeInTheDocument();
    expect(screen.getAllByText("Historique")).toHaveLength(2);
    expect(screen.getByText(/surface active/i)).toBeInTheDocument();
    expect(screen.getByText(/file dense pour parcourir et revoir les matchs stockes/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /synchroniser les matchs/i }));
    await user.click(screen.getByRole("button", { name: /synchroniser les donnees statiques/i }));

    expect(syncMatches).toHaveBeenCalledTimes(1);
    expect(syncStaticData).toHaveBeenCalledTimes(1);
  });

  it("hides descriptions when shell copy is disabled", () => {
    mockSettingMap.showPageDescriptions = "false";
    mockSettingMap.compactSidebar = "true";

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <AppShell>
          <div>Contenu</div>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Identite locale")).not.toBeInTheDocument();
    expect(screen.queryByText(/resume du compte suivi/i)).not.toBeInTheDocument();
  });
});
