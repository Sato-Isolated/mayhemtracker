import { Bell, MonitorCog, Palette, PanelsTopLeft, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { getNotificationPermission, requestNotificationPermission } from "@/lib/notifications";
import { MetricTile } from "@/components/features/metric-tile";
import { PageIntro } from "@/components/features/page-intro";
import { SettingCard } from "@/components/features/setting-card";
import { ThemeOptionCard } from "@/components/features/theme-option-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoBox } from "@/components/ui/info-box";
import { SectionLabel } from "@/components/ui/section-label";
import { Surface } from "@/components/ui/surface";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useShellSettings } from "@/state/tracker-data";

const themeOptions = [
  {
    value: "ember",
    label: "Ember",
    tone: "Light / warm",
    description: "Warm sand, copper, and cream tones close to the current identity.",
    swatches: ["oklch(0.956 0.026 78)", "oklch(0.56 0.148 32)", "oklch(0.868 0.072 74)"],
  },
  {
    value: "atlas",
    label: "Atlas",
    tone: "Light / analytic",
    description: "Cooler mineral palette built for dense analytical views.",
    swatches: ["oklch(0.952 0.028 228)", "oklch(0.52 0.162 247)", "oklch(0.856 0.070 216)"],
  },
  {
    value: "midnight",
    label: "Midnight",
    tone: "Dark / dashboard",
    description: "Deep slate base with bright text and warm accents.",
    swatches: ["oklch(0.182 0.032 264)", "oklch(0.74 0.165 72)", "oklch(0.465 0.100 226)"],
  },
  {
    value: "tide",
    label: "Tide",
    tone: "Dark / cool",
    description: "Petrol blue palette with cooler technical accents.",
    swatches: ["oklch(0.172 0.036 208)", "oklch(0.76 0.148 186)", "oklch(0.462 0.110 194)"],
  },
] as const;

export function SettingsPage() {
  const { settingMap, updateSetting } = useShellSettings();
  const activeTheme = themeOptions.find((option) => option.value === (settingMap.theme ?? "ember")) ?? themeOptions[0];
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(getNotificationPermission);
  const notifEnabled = settingMap.nativeNotifications === "true";
  const dataDensity = settingMap.dataDensity ?? "comfortable";
  const showPageDescriptions = settingMap.showPageDescriptions ?? "true";
  const stickyToolbars = settingMap.stickyToolbars ?? "true";
  const defaultHistoryView = settingMap.defaultHistoryView ?? "split";

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
      updateSetting("theme", "ember"),
      updateSetting("accentMode", "warm"),
      updateSetting("density", "comfortable"),
      updateSetting("dataDensity", "comfortable"),
      updateSetting("compactSidebar", "false"),
      updateSetting("showPageDescriptions", "true"),
      updateSetting("stickyToolbars", "true"),
      updateSetting("defaultHistoryView", "split"),
    ]);
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Settings"
        title="Local interface preferences"
        description="Persistent desktop-first preferences for shell density, toolbars, reading flow, and local visual polish."
        actions={<Button variant="outline" onClick={() => void resetDefaults()}>Reset defaults</Button>}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Theme" value={<span className="capitalize">{settingMap.theme ?? "ember"}</span>} icon={<Palette className="h-4 w-4" />} />
        <MetricTile label="Accent" value={<span className="capitalize">{settingMap.accentMode ?? "warm"}</span>} icon={<Palette className="h-4 w-4" />} />
        <MetricTile label="Density" value={<span className="capitalize">{settingMap.density ?? "comfortable"}</span>} icon={<SlidersHorizontal className="h-4 w-4" />} />
        <MetricTile label="Data density" value={<span className="capitalize">{dataDensity}</span>} icon={<SlidersHorizontal className="h-4 w-4" />} />
        <MetricTile label="Sidebar" value={settingMap.compactSidebar === "true" ? "Compact" : "Expanded"} icon={<PanelsTopLeft className="h-4 w-4" />} />
        <MetricTile label="Descriptions" value={showPageDescriptions === "true" ? "Visible" : "Hidden"} icon={<PanelsTopLeft className="h-4 w-4" />} />
        <MetricTile label="Toolbars" value={stickyToolbars === "true" ? "Sticky" : "Inline"} icon={<PanelsTopLeft className="h-4 w-4" />} />
        <MetricTile label="History view" value={<span className="capitalize">{defaultHistoryView}</span>} icon={<MonitorCog className="h-4 w-4" />} />
        <MetricTile label="Notifications" value={notifEnabled ? "On" : "Off"} icon={<Bell className="h-4 w-4" />} />
        <MetricTile label="Scope" value="Stored locally" icon={<MonitorCog className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
        <SettingCard
          title="Theme"
          description="Four complete palettes with reliable hierarchy in both light and dark surfaces."
          hint="Each theme redefines background, text, surfaces, borders, and states so the app stays readable in dense analytical views."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {themeOptions.map((option) => (
              <ThemeOptionCard
                key={option.value}
                option={option}
                isActive={settingMap.theme === option.value}
                onSelect={() => void updateSetting("theme", option.value)}
              />
            ))}
          </div>
        </SettingCard>

        <SettingCard
          title="Accent mode"
          description="Balance warmth versus strict product contrast."
          hint="Warm keeps the current tone. Contrast increases the gap between primary and accent for a firmer hierarchy."
        >
          <ToggleGroup
            options={[{ value: "warm", label: "Warm" }, { value: "contrast", label: "Contrast" }]}
            value={(settingMap.accentMode as "warm" | "contrast") ?? "warm"}
            onValueChange={(value) => void updateSetting("accentMode", value)}
          />
        </SettingCard>

        <SettingCard
          title="Density"
          description="Controls the overall shell spacing."
          hint="Compact tightens shared shell spacing. This is the broad interface density, not the dedicated data-density mode."
        >
          <ToggleGroup
            options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]}
            value={(settingMap.density as "comfortable" | "compact") ?? "comfortable"}
            onValueChange={(value) => void updateSetting("density", value)}
          />
        </SettingCard>

        <SettingCard
          title="Data density"
          description="Applies a denser reading mode to tables, cards, rows, and analytical panels."
          hint="Use dense when the goal is to fit more information on screen without turning the whole shell tiny."
        >
          <ToggleGroup
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
              { value: "dense", label: "Dense" },
            ]}
            value={dataDensity as "comfortable" | "compact" | "dense"}
            onValueChange={(value) => void updateSetting("dataDensity", value)}
          />
        </SettingCard>

        <SettingCard
          title="Sidebar mode"
          description="Reduces the amount of persistent navigation copy."
          hint="Compact hides secondary lines in the navigation so the shell behaves more like a dense local utility."
        >
          <ToggleGroup
            options={[{ value: "false", label: "Expanded" }, { value: "true", label: "Compact" }]}
            value={(settingMap.compactSidebar ?? "false") as "false" | "true"}
            onValueChange={(value) => void updateSetting("compactSidebar", value)}
          />
        </SettingCard>

        <SettingCard
          title="Page descriptions"
          description="Shows or hides secondary copy in page headers and shell surfaces."
          hint="Hide descriptions when you want a tighter, more tool-like surface with stronger focus on data."
        >
          <ToggleGroup
            options={[{ value: "true", label: "Visible" }, { value: "false", label: "Hidden" }]}
            value={showPageDescriptions as "true" | "false"}
            onValueChange={(value) => void updateSetting("showPageDescriptions", value)}
          />
        </SettingCard>

        <SettingCard
          title="Toolbar behavior"
          description="Controls whether analytical toolbars stay pinned while you scroll."
          hint="Sticky is recommended for dense desktop reading because filters and actions remain available without extra travel."
        >
          <ToggleGroup
            options={[{ value: "true", label: "Sticky" }, { value: "false", label: "Inline" }]}
            value={stickyToolbars as "true" | "false"}
            onValueChange={(value) => void updateSetting("stickyToolbars", value)}
          />
        </SettingCard>

        <SettingCard
          title="History default view"
          description="Chooses the default reading flow for the stored match archive."
          hint="Split keeps the list on the left and the selected match on the right. Inline expands rows directly in the queue."
        >
          <ToggleGroup
            options={[{ value: "split", label: "Split" }, { value: "inline", label: "Inline" }]}
            value={defaultHistoryView as "split" | "inline"}
            onValueChange={(value) => void updateSetting("defaultHistoryView", value)}
          />
        </SettingCard>

        <SettingCard
          title={<span className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</span>}
          description="Native Windows notifications for match sync activity."
          hint={
            notifPermission === "unsupported"
              ? "Your browser does not support native notifications."
              : notifPermission === "denied"
                ? "Notifications were blocked by the browser. Re-enable them in the site permissions."
                : "Receive a Windows notification when auto-sync or manual sync finds new matches."
          }
        >
          <div className="flex items-center gap-3">
            <Button
              variant={notifEnabled ? "default" : "outline"}
              disabled={notifPermission === "unsupported" || notifPermission === "denied"}
              onClick={() => void toggleNotifications()}
            >
              {notifEnabled ? "Enabled" : "Disabled"}
            </Button>
            {notifPermission === "denied" && <Badge variant="error">Blocked</Badge>}
            {notifEnabled && notifPermission === "granted" && <Badge variant="success">Active</Badge>}
          </div>
        </SettingCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Quick read of the current interface state driven by local desktop preferences.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="relative min-h-[220px] overflow-hidden rounded-[1rem] border border-[color-mix(in_oklch,var(--border)_80%,transparent)] bg-[linear-gradient(160deg,color-mix(in_oklch,var(--topbar)_84%,var(--card)),color-mix(in_oklch,var(--page-end)_86%,var(--background)))] p-4" data-testid="theme-preview-board">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--accent)_18%,transparent),transparent_42%),radial-gradient(circle_at_bottom_right,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_44%)]" />
            <div className="relative z-10 grid h-full gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col justify-between rounded-[0.9rem] border border-border/70 bg-card/78 p-4 shadow-[0_16px_40px_-30px_color-mix(in_oklch,var(--foreground)_18%,transparent)]">
                <div>
                  <SectionLabel>Theme stack</SectionLabel>
                  <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                    <span className="inline-flex h-3 w-3 rounded-full bg-primary" />
                    <span>{settingMap.theme ?? "ember"} / {settingMap.accentMode ?? "warm"}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-start gap-2">
                  <span className="inline-flex items-center gap-[0.55rem] rounded-full border border-border/60 bg-[color-mix(in_oklch,var(--card)_68%,var(--primary))] px-[0.72rem] py-[0.42rem] text-[0.76rem] text-primary-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_45%,transparent)]">Primary</span>
                  <span className="inline-flex items-center gap-[0.55rem] rounded-full border border-border/60 bg-[color-mix(in_oklch,var(--card)_76%,var(--secondary))] px-[0.72rem] py-[0.42rem] text-[0.76rem] text-muted-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_45%,transparent)]">Muted</span>
                  <span className="inline-flex items-center gap-[0.55rem] rounded-full border border-border/60 bg-[color-mix(in_oklch,var(--card)_76%,var(--secondary))] px-[0.72rem] py-[0.42rem] text-[0.76rem] text-muted-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_45%,transparent)]">Surface</span>
                </div>
              </div>

              <div className="grid gap-3">
                <Surface variant="elevated" className="rounded-[1rem] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <SectionLabel>Preview card</SectionLabel>
                      <div className="mt-2 text-base font-semibold text-foreground">Readable by design</div>
                    </div>
                    <span className="inline-flex h-9 w-9 rounded-full bg-primary/18 ring-1 ring-border/60" />
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">Primary text, surfaces, and accents stay separated even when the theme turns dark.</div>
                </Surface>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-[0.9rem] border border-border/70 bg-background/80 p-3">
                    <div className="h-2 rounded-full bg-primary/80" />
                    <div className="mt-2 h-2 rounded-full bg-accent/70" />
                  </div>
                  <div className="rounded-[0.9rem] border border-border/70 bg-card/85 p-3">
                    <div className="h-2 rounded-full bg-foreground/85" />
                    <div className="mt-2 h-2 rounded-full bg-muted-foreground/70" />
                  </div>
                  <div className="rounded-[0.9rem] border border-border/70 bg-secondary/70 p-3">
                    <div className="h-2 rounded-full bg-primary/65" />
                    <div className="mt-2 h-2 rounded-full bg-accent/65" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <InfoBox>
              <SectionLabel>Information density</SectionLabel>
              <div className="mt-3 text-sm text-foreground">Shell: <strong>{settingMap.density ?? "comfortable"}</strong> / Data: <strong>{dataDensity}</strong></div>
            </InfoBox>
            <InfoBox>
              <SectionLabel>Navigation mode</SectionLabel>
              <div className="mt-3 text-sm text-foreground">Sidebar copy is <strong>{settingMap.compactSidebar === "true" ? "hidden" : "visible"}</strong></div>
            </InfoBox>
            <InfoBox>
              <SectionLabel>Theme intent</SectionLabel>
              <div className="mt-3 text-sm text-foreground">{activeTheme.description}</div>
            </InfoBox>
            <InfoBox>
              <SectionLabel>Reading flow</SectionLabel>
              <div className="mt-3 text-sm text-foreground">{defaultHistoryView === "split" ? "History opens in split review by default." : "History expands rows inline by default."}</div>
            </InfoBox>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="theme-diagnostics-card">
        <CardHeader>
          <CardTitle>Theme diagnostics</CardTitle>
          <CardDescription>Quick contrast checks for the most sensitive components before leaving the page.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <Surface variant="elevated" className="rounded-[1rem] p-4">
              <SectionLabel>Controls</SectionLabel>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button>Primary action</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="error">Error</Badge>
              </div>
            </Surface>

            <Alert>
              <AlertTitle>Hierarchy check</AlertTitle>
              <AlertDescription>Muted text, borders, and surfaces should stay distinct without competing with primary actions.</AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertTitle>Critical state</AlertTitle>
              <AlertDescription>Destructive color must remain visible without breaking the global readability of the theme.</AlertDescription>
            </Alert>
          </div>

          <Tabs defaultValue="table">
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="states">States</TabsTrigger>
            </TabsList>
            <TabsContent value="table">
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Signal</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Primary contrast</TableCell>
                      <TableCell>Pass</TableCell>
                      <TableCell><Badge variant="success">Stable</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Muted copy</TableCell>
                      <TableCell>Checked</TableCell>
                      <TableCell><Badge variant="outline">Review</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Destructive state</TableCell>
                      <TableCell>Visible</TableCell>
                      <TableCell><Badge variant="error">Critical</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="states">
              <div className="grid gap-3 sm:grid-cols-2">
                <Surface className="rounded-[1rem] p-4">
                  <SectionLabel>Surface</SectionLabel>
                  <div className="mt-2 text-base font-semibold text-foreground">Foreground remains clear</div>
                  <div className="mt-2 text-sm text-muted-foreground">Primary and secondary copy must keep a clear visual gap.</div>
                </Surface>
                <Surface variant="subtle" className="rounded-[1rem] p-4">
                  <SectionLabel>Accent</SectionLabel>
                  <div className="mt-2 text-base font-semibold text-foreground">Accent does not overpower</div>
                  <div className="mt-2 text-sm text-muted-foreground">Hover and accent surfaces should remain readable even in dark mode.</div>
                </Surface>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
