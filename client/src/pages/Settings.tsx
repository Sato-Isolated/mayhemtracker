import { Bell, MonitorCog, Palette, PanelsTopLeft, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
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
import { useTrackerAppData } from "@/state/tracker-data";

const themeOptions = [
  {
    value: "ember",
    label: "Ember",
    tone: "Light / warm",
    description: "Palette sable, cuivre et crème, proche de l'identité actuelle.",
    swatches: ["oklch(0.956 0.026 78)", "oklch(0.56 0.148 32)", "oklch(0.868 0.072 74)"],
  },
  {
    value: "atlas",
    label: "Atlas",
    tone: "Light / analytic",
    description: "Palette minérale plus froide, utile pour les vues denses et analytiques.",
    swatches: ["oklch(0.952 0.028 228)", "oklch(0.52 0.162 247)", "oklch(0.856 0.070 216)"],
  },
  {
    value: "midnight",
    label: "Midnight",
    tone: "Dark / dashboard",
    description: "Fond ardoise profond, textes clairs et accents ambrés très lisibles.",
    swatches: ["oklch(0.182 0.032 264)", "oklch(0.74 0.165 72)", "oklch(0.465 0.100 226)"],
  },
  {
    value: "tide",
    label: "Tide",
    tone: "Dark / cool",
    description: "Bleu pétrole et accents cyan pour une lecture plus technique.",
    swatches: ["oklch(0.172 0.036 208)", "oklch(0.76 0.148 186)", "oklch(0.462 0.110 194)"],
  },
] as const;

export function SettingsPage() {
  const { settings, updateSetting } = useTrackerAppData();
  const settingMap = useMemo(() => Object.fromEntries((settings.data ?? []).map((entry) => [entry.key, entry.value])), [settings.data]);
  const activeTheme = themeOptions.find((option) => option.value === (settingMap.theme ?? "ember")) ?? themeOptions[0];
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(getNotificationPermission);
  const notifEnabled = settingMap.nativeNotifications === "true";

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
      updateSetting("compactSidebar", "false"),
    ]);
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Settings"
        title="Local interface preferences"
        description="Les réglages persistants pilotent déjà le shell de la nouvelle interface. Cette surface doit progressivement remplacer les réglages implicites de dev."
        actions={<Button variant="outline" onClick={() => void resetDefaults()}>Reset defaults</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricTile label="Theme" value={<span className="capitalize">{settingMap.theme ?? "ember"}</span>} icon={<Palette className="h-4 w-4" />} />
        <MetricTile label="Accent" value={<span className="capitalize">{settingMap.accentMode ?? "warm"}</span>} icon={<Palette className="h-4 w-4" />} />
        <MetricTile label="Density" value={<span className="capitalize">{settingMap.density ?? "comfortable"}</span>} icon={<SlidersHorizontal className="h-4 w-4" />} />
        <MetricTile label="Sidebar" value={settingMap.compactSidebar === "true" ? "Compact" : "Expanded"} icon={<PanelsTopLeft className="h-4 w-4" />} />
        <MetricTile label="Notifications" value={notifEnabled ? "On" : "Off"} icon={<Bell className="h-4 w-4" />} />
        <MetricTile label="Scope" value="Stored locally" icon={<MonitorCog className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-2 max-[1100px]:grid-cols-1 gap-4">
        {/* Theme */}
        <SettingCard
          title="Theme"
          description="4 palettes complètes, avec hiérarchie lisible en clair comme en sombre."
          hint="Chaque thème redéfinit le fond, le texte, les surfaces, les bordures et les états pour éviter les combinaisons peu lisibles."
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

        {/* Accent mode */}
        <SettingCard
          title="Accent mode"
          description="Balance entre chaleur visuelle et contraste produit."
          hint="warm garde l'ADN du thème choisi. contrast renforce l'écart entre primary et accent pour une hiérarchie plus ferme."
        >
          <ToggleGroup
            options={[{ value: "warm", label: "Warm" }, { value: "contrast", label: "Contrast" }]}
            value={(settingMap.accentMode as "warm" | "contrast") ?? "warm"}
            onValueChange={(v) => void updateSetting("accentMode", v)}
          />
        </SettingCard>

        {/* Density */}
        <SettingCard
          title="Density"
          description="Compacte davantage les surfaces et les tableaux."
          hint="Le mode compact réduit la taille perçue et aide les pages analytiques denses."
        >
          <ToggleGroup
            options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]}
            value={(settingMap.density as "comfortable" | "compact") ?? "comfortable"}
            onValueChange={(v) => void updateSetting("density", v)}
          />
        </SettingCard>

        {/* Sidebar mode */}
        <SettingCard
          title="Sidebar mode"
          description="Réduit la quantité de texte dans la navigation persistante."
          hint="Le mode compact enlève les lignes secondaires dans la navigation pour rapprocher le shell d'un comportement desktop dense."
        >
          <ToggleGroup
            options={[{ value: "false", label: "Expanded" }, { value: "true", label: "Compact" }]}
            value={(settingMap.compactSidebar ?? "false") as "false" | "true"}
            onValueChange={(v) => void updateSetting("compactSidebar", v)}
          />
        </SettingCard>

        {/* Notifications */}
        <SettingCard
          title={<span className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</span>}
          description="Notifications Windows natives lors des syncs de matchs."
          hint={
            notifPermission === "unsupported"
              ? "Votre navigateur ne supporte pas les notifications natives."
              : notifPermission === "denied"
                ? "Les notifications ont été bloquées par le navigateur. Réactivez-les dans les paramètres du site."
                : "Recevez une notification Windows quand un sync (auto ou manuel) détecte de nouveaux matchs."
          }
        >
          <div className="flex items-center gap-3">
            <Button
              variant={notifEnabled ? "default" : "outline"}
              disabled={notifPermission === "unsupported" || notifPermission === "denied"}
              onClick={() => void toggleNotifications()}
            >
              {notifEnabled ? "Activées" : "Désactivées"}
            </Button>
            {notifPermission === "denied" && <Badge variant="error">Bloqué</Badge>}
            {notifEnabled && notifPermission === "granted" && <Badge variant="success">Actif</Badge>}
          </div>
        </SettingCard>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Lecture rapide de l'état d'interface actuellement piloté par les préférences locales.</CardDescription>
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
                <div className="items-start mt-4 flex flex-wrap gap-2">
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
                  <div className="mt-3 text-sm text-muted-foreground">Le texte principal, les surfaces et les accents restent hiérarchisés même si le fond devient sombre.</div>
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
              <div className="mt-3 text-sm text-foreground">Current mode: <strong>{settingMap.density ?? "comfortable"}</strong></div>
            </InfoBox>
            <InfoBox>
              <SectionLabel>Navigation mode</SectionLabel>
              <div className="mt-3 text-sm text-foreground">Sidebar copy is <strong>{settingMap.compactSidebar === "true" ? "hidden" : "visible"}</strong></div>
            </InfoBox>
            <InfoBox>
              <SectionLabel>Theme intent</SectionLabel>
              <div className="mt-3 text-sm text-foreground">{activeTheme.description}</div>
            </InfoBox>
          </div>
        </CardContent>
      </Card>

      {/* Theme diagnostics */}
      <Card data-testid="theme-diagnostics-card">
        <CardHeader>
          <CardTitle>Theme diagnostics</CardTitle>
          <CardDescription>Lecture en conditions réelles des composants sensibles au contraste avant de quitter la page.</CardDescription>
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
              <AlertDescription>Le texte secondaire, les bordures et les surfaces doivent rester distincts sans écraser l'action primaire.</AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertTitle>Critical state</AlertTitle>
              <AlertDescription>La couleur destructive doit rester visible sans casser la lisibilité globale du thème.</AlertDescription>
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
                  <div className="mt-2 text-sm text-muted-foreground">Le texte principal et secondaire doivent garder un écart net.</div>
                </Surface>
                <Surface variant="subtle" className="rounded-[1rem] p-4">
                  <SectionLabel>Accent</SectionLabel>
                  <div className="mt-2 text-base font-semibold text-foreground">Accent does not overpower</div>
                  <div className="mt-2 text-sm text-muted-foreground">Les hovers et surfaces d'accent restent lisibles même en mode sombre.</div>
                </Surface>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
