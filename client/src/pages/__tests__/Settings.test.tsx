import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "@/pages/Settings";

const updateSetting = vi.fn<(...args: string[]) => Promise<void>>().mockResolvedValue(undefined);
const settingMap = {
  theme: "darkPremium",
  accentMode: "electricBlue",
  density: "comfortable",
  dataDensity: "comfortable",
  compactSidebar: "false",
  showPageDescriptions: "true",
  stickyToolbars: "true",
  defaultHistoryView: "inline",
  nativeNotifications: "false",
  autoSyncEnabled: "true",
  autoSyncIntervalSeconds: "10",
};

vi.mock("@/state/tracker-data", () => ({
  useShellSettings: () => ({
    settingMap,
    updateSetting,
  }),
}));

vi.mock("@/lib/notifications", () => ({
  getNotificationPermission: () => "granted",
  requestNotificationPermission: vi.fn().mockResolvedValue("granted"),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    updateSetting.mockClear();
    settingMap.autoSyncEnabled = "true";
    settingMap.autoSyncIntervalSeconds = "10";
  });

  it("resets local shell defaults from the reset action", async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: /reset defaults/i }));

    await waitFor(() => expect(updateSetting).toHaveBeenCalledTimes(10));
    expect(updateSetting).toHaveBeenCalledWith("theme", "darkPremium");
    expect(updateSetting).toHaveBeenCalledWith("accentMode", "electricBlue");
    expect(updateSetting).toHaveBeenCalledWith("density", "comfortable");
    expect(updateSetting).toHaveBeenCalledWith("dataDensity", "comfortable");
    expect(updateSetting).toHaveBeenCalledWith("compactSidebar", "false");
    expect(updateSetting).toHaveBeenCalledWith("showPageDescriptions", "true");
    expect(updateSetting).toHaveBeenCalledWith("stickyToolbars", "true");
    expect(updateSetting).toHaveBeenCalledWith("defaultHistoryView", "inline");
    expect(updateSetting).toHaveBeenCalledWith("autoSyncEnabled", "true");
    expect(updateSetting).toHaveBeenCalledWith("autoSyncIntervalSeconds", "10");
  });

  it("updates auto-sync preferences from the settings card", async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    const autoSyncCard = screen.getByRole("heading", { name: /auto-sync/i }).closest(".card-shell");
    expect(autoSyncCard).not.toBeNull();

    await user.click(within(autoSyncCard as HTMLElement).getByRole("button", { name: "30s" }));
    await user.click(within(autoSyncCard as HTMLElement).getByRole("button", { name: "Disabled" }));

    expect(updateSetting).toHaveBeenCalledWith("autoSyncIntervalSeconds", "30");
    expect(updateSetting).toHaveBeenCalledWith("autoSyncEnabled", "false");
  });

  it("updates notification preferences from the focused notifications card", async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    const notificationsCard = screen.getByRole("heading", { name: /notifications/i }).closest(".card-shell");
    expect(notificationsCard).not.toBeNull();

    await user.click(within(notificationsCard as HTMLElement).getByRole("button", { name: /enable notifications/i }));

    expect(updateSetting).toHaveBeenCalledWith("nativeNotifications", "true");
  });
});
