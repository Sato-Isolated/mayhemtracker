import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { AppSetting } from "@/lib/types";
import { initialAsyncState, useAsyncAction, type AsyncState } from "@/state/shared";

type SettingMap = Record<string, string>;

interface ShellSettingsContextValue {
  settings: AsyncState<AppSetting[]>;
  settingMap: SettingMap;
  notificationsEnabled: boolean;
  loadSettings: () => Promise<AppSetting[] | undefined>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

const ShellSettingsContext = createContext<ShellSettingsContextValue | undefined>(undefined);

function buildSettingMap(items: AppSetting[] | undefined): SettingMap {
  return Object.fromEntries((items ?? []).map((entry) => [entry.key, entry.value]));
}

export function ShellSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AsyncState<AppSetting[]>>(initialAsyncState<AppSetting[]>());
  const { runAction } = useAsyncAction("shell-settings");

  const loadSettings = async () =>
    runAction(setSettings, async () => (await api.getSettings()).items, {
      actionName: "loadSettings",
    });

  async function updateSetting(key: string, value: string) {
    const payload = await api.updateSetting(key, value);

    setSettings((current) => {
      const existing = current.data ?? [];
      const next = existing
        .filter((entry) => entry.key !== key)
        .concat(payload.item)
        .sort((left, right) => left.key.localeCompare(right.key));

      return { loading: false, data: next };
    });

    toast.success("Préférence enregistrée");
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  const settingMap = useMemo(() => buildSettingMap(settings.data), [settings.data]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settingMap.theme ?? "ember";
    root.dataset.density = settingMap.density ?? "comfortable";
    root.dataset.accentMode = settingMap.accentMode ?? "warm";
    root.dataset.compactSidebar = settingMap.compactSidebar ?? "false";
  }, [settingMap]);

  const value = useMemo(
    () => ({
      settings,
      settingMap,
      notificationsEnabled: settingMap.nativeNotifications === "true",
      loadSettings,
      updateSetting,
    }),
    [settingMap, settings],
  );

  return <ShellSettingsContext value={value}>{children}</ShellSettingsContext>;
}

export function useShellSettings() {
  const context = useContext(ShellSettingsContext);

  if (!context) {
    throw new Error("useShellSettings must be used inside ShellSettingsProvider");
  }

  return context;
}
