import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "@/pages/Settings";

const updateSetting = vi.fn<(...args: string[]) => Promise<void>>().mockResolvedValue(undefined);

vi.mock("@/state/tracker-data", () => ({
  useShellSettings: () => ({
    settingMap: {
      theme: "ember",
      accentMode: "warm",
      density: "comfortable",
      compactSidebar: "false",
      nativeNotifications: "false",
    },
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
  });

  it("resets local shell defaults from the reset action", async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: /reset defaults/i }));

    await waitFor(() => expect(updateSetting).toHaveBeenCalledTimes(4));
    expect(updateSetting).toHaveBeenCalledWith("theme", "ember");
    expect(updateSetting).toHaveBeenCalledWith("accentMode", "warm");
    expect(updateSetting).toHaveBeenCalledWith("density", "comfortable");
    expect(updateSetting).toHaveBeenCalledWith("compactSidebar", "false");
  });
});
