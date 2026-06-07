import { Bell, Clock3, History, RefreshCcw, RotateCcw } from "lucide-react";
import { useState } from "react";
import { PageIntro } from "@/components/features/page-intro";
import { SettingCard } from "@/components/features/setting-card";
import { StatusBadge } from "@/components/features/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { getNotificationPermission, requestNotificationPermission } from "@/lib/notifications";
import { useShellSettings } from "@/state/tracker-data";

export function SettingsPage() {
  const { settingMap, updateSetting } = useShellSettings();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(getNotificationPermission);

  const notifEnabled = settingMap.nativeNotifications === "true";
  const autoSyncEnabled = settingMap.autoSyncEnabled !== "false";
  const autoSyncIntervalSeconds = settingMap.autoSyncIntervalSeconds ?? "10";
  const dataDensity = settingMap.dataDensity ?? "comfortable";

  async function toggleNotifications() {
    if (notifEnabled) {
      await updateSetting("nativeNotifications", "false");
      return;
    }

    let permission = getNotificationPermission();
    if (permission !== "granted") {
      permission = await requestNotificationPermission();
      setNotifPermission(permission);
    }

    if (permission === "granted") {
      await updateSetting("nativeNotifications", "true");
      setNotifPermission("granted");
    }
  }

  async function resetDefaults() {
    await Promise.all([
      updateSetting("theme", "darkPremium"),
      updateSetting("accentMode", "electricBlue"),
      updateSetting("density", "comfortable"),
      updateSetting("dataDensity", "comfortable"),
      updateSetting("compactSidebar", "false"),
      updateSetting("showPageDescriptions", "true"),
      updateSetting("stickyToolbars", "true"),
      updateSetting("defaultHistoryView", "inline"),
      updateSetting("autoSyncEnabled", "true"),
      updateSetting("autoSyncIntervalSeconds", "10"),
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Settings"
        title="Settings"
        description="Only the settings that affect daily tracking are shown here."
        actions={(
          <Button variant="outline" size="sm" onClick={() => void resetDefaults()}>
            <RotateCcw className="size-4" />
            Reset defaults
          </Button>
        )}
      />

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <SettingCard
          title={<span className="flex items-center gap-2"><RefreshCcw className="size-4 text-primary" /> Auto-sync</span>}
          description="Keep local matches fresh when the League client is available."
          className="min-h-full"
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={autoSyncEnabled ? "success" : "neutral"}>{autoSyncEnabled ? "Enabled" : "Disabled"}</StatusBadge>
              <StatusBadge>{autoSyncIntervalSeconds}s interval</StatusBadge>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Status</div>
              <ToggleGroup
                options={[{ value: "true", label: "Enabled" }, { value: "false", label: "Disabled" }]}
                value={(autoSyncEnabled ? "true" : "false") as "true" | "false"}
                onValueChange={(value) => void updateSetting("autoSyncEnabled", value)}
                className="flex-wrap"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock3 className="size-4 text-muted-foreground" />
                Polling interval
              </div>
              <ToggleGroup
                options={[
                  { value: "10", label: "10s", disabled: !autoSyncEnabled },
                  { value: "30", label: "30s", disabled: !autoSyncEnabled },
                  { value: "60", label: "60s", disabled: !autoSyncEnabled },
                ]}
                value={autoSyncIntervalSeconds as "10" | "30" | "60"}
                onValueChange={(value) => void updateSetting("autoSyncIntervalSeconds", value)}
                className="flex-wrap"
              />
            </div>
          </div>
        </SettingCard>

        <SettingCard
          title={<span className="flex items-center gap-2"><History className="size-4 text-primary" /> Review defaults</span>}
          description="Choose how dense the archive feels when you open History."
          className="min-h-full"
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Data density</div>
              <ToggleGroup
                options={[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" },
                  { value: "dense", label: "Dense" },
                ]}
                value={dataDensity as "comfortable" | "compact" | "dense"}
                onValueChange={(value) => void updateSetting("dataDensity", value)}
                className="flex-wrap"
              />
            </div>
          </div>
        </SettingCard>
      </section>

      <SettingCard
        title={<span className="flex items-center gap-2"><Bell className="size-4 text-primary" /> Notifications</span>}
        description="Native Windows notifications for match sync activity."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {notifEnabled && notifPermission === "granted" ? <Badge variant="success">Active</Badge> : null}
            {notifPermission === "denied" ? <Badge variant="error">Blocked</Badge> : null}
            {notifPermission === "unsupported" ? <Badge variant="outline">Unsupported</Badge> : null}
            {!notifEnabled && notifPermission !== "denied" && notifPermission !== "unsupported" ? <StatusBadge>Optional</StatusBadge> : null}
          </div>
          <Button
            variant={notifEnabled ? "default" : "outline"}
            disabled={notifPermission === "unsupported" || notifPermission === "denied"}
            onClick={() => void toggleNotifications()}
          >
            {notifEnabled ? "Disable notifications" : "Enable notifications"}
          </Button>
        </div>
      </SettingCard>
    </div>
  );
}
