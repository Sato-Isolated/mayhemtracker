import { MonitorCog, Palette, PanelsTopLeft, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { MetricTile } from "@/components/features/metric-tile";
import { PageIntro } from "@/components/features/page-intro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrackerAppData } from "@/state/tracker-data";

const themeOptions = [
  {
    value: "ember",
    label: "Ember",
    tone: "Light / warm",
    description: "Palette sable, cuivre et crème, proche de l’identité actuelle.",
    swatches: ["oklch(0.978 0.012 92)", "oklch(0.59 0.11 40)", "oklch(0.86 0.045 82)"],
  },
  {
    value: "atlas",
    label: "Atlas",
    tone: "Light / analytic",
    description: "Palette minérale plus froide, utile pour les vues denses et analytiques.",
    swatches: ["oklch(0.975 0.01 242)", "oklch(0.55 0.13 245)", "oklch(0.86 0.045 216)"],
  },
  {
    value: "midnight",
    label: "Midnight",
    tone: "Dark / dashboard",
    description: "Fond ardoise profond, textes clairs et accents ambrés très lisibles.",
    swatches: ["oklch(0.21 0.018 262)", "oklch(0.72 0.15 78)", "oklch(0.42 0.07 230)"],
  },
  {
    value: "tide",
    label: "Tide",
    tone: "Dark / cool",
    description: "Bleu pétrole et accents cyan pour une lecture plus technique.",
    swatches: ["oklch(0.2 0.022 208)", "oklch(0.75 0.132 188)", "oklch(0.42 0.085 197)"],
  },
] as const;

export function SettingsPage() {
  const { settings, updateSetting } = useTrackerAppData();
  const settingMap = useMemo(() => Object.fromEntries((settings.data ?? []).map((entry) => [entry.key, entry.value])), [settings.data]);
  const activeTheme = themeOptions.find((option) => option.value === (settingMap.theme ?? "ember")) ?? themeOptions[0];

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricTile label="Theme" value={<span className="capitalize">{settingMap.theme ?? "ember"}</span>} icon={<Palette className="h-4 w-4" />} />
        <MetricTile label="Accent" value={<span className="capitalize">{settingMap.accentMode ?? "warm"}</span>} icon={<Palette className="h-4 w-4" />} />
        <MetricTile label="Density" value={<span className="capitalize">{settingMap.density ?? "comfortable"}</span>} icon={<SlidersHorizontal className="h-4 w-4" />} />
        <MetricTile label="Sidebar" value={settingMap.compactSidebar === "true" ? "Compact" : "Expanded"} icon={<PanelsTopLeft className="h-4 w-4" />} />
        <MetricTile label="Scope" value="Stored locally" hint="Ces préférences vivent dans SQLite." icon={<MonitorCog className="h-4 w-4" />} />
      </div>

      <div className="grid-cols-2 max-[1100px]:grid-cols-1 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>4 palettes complètes, avec hiérarchie lisible en clair comme en sombre.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Chaque thème redéfinit le fond, le texte, les surfaces, les bordures et les états pour éviter les combinaisons peu lisibles.</div>
            <div className="grid gap-3 md:grid-cols-2">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={settingMap.theme === option.value ? "default" : "outline"}
                  className={`settings-theme-card h-auto justify-start px-0 py-0 text-left ${settingMap.theme === option.value ? "settings-theme-card-selected" : ""}`}
                  data-testid={`theme-option-${option.value}`}
                  onClick={() => void updateSetting("theme", option.value)}
                >
                  <div className="w-full p-4">
                    <div className="min-h-[2.75rem] flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{option.label}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{option.tone}</div>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${settingMap.theme === option.value ? "bg-primary/15 text-primary border-primary/30" : "border-border/70 text-muted-foreground"}`}>
                        {settingMap.theme === option.value ? "Active" : "Available"}
                      </span>
                    </div>
                    <div className="settings-theme-miniature mt-4">
                      <div className="settings-theme-miniature-bar" style={{ backgroundColor: option.swatches[0] }} />
                      <div className="settings-theme-miniature-card" style={{ backgroundColor: option.swatches[1] }} />
                      <div className="settings-theme-miniature-pill" style={{ backgroundColor: option.swatches[2] }} />
                    </div>
                    <div className="mt-4 text-xs leading-5 text-muted-foreground">{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accent mode</CardTitle>
            <CardDescription>Balance entre chaleur visuelle et contraste produit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">warm garde l’ADN du thème choisi. contrast renforce l’écart entre primary et accent pour une hiérarchie plus ferme.</div>
            <div className="flex gap-2">
            <Button variant={settingMap.accentMode === "warm" ? "default" : "outline"} onClick={() => void updateSetting("accentMode", "warm")}>Warm</Button>
            <Button variant={settingMap.accentMode === "contrast" ? "default" : "outline"} onClick={() => void updateSetting("accentMode", "contrast")}>Contrast</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Density</CardTitle>
            <CardDescription>Compacte davantage les surfaces et les tableaux.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Le mode compact réduit la taille perçue et aide les pages analytiques denses.</div>
            <div className="flex gap-2">
            <Button variant={settingMap.density === "comfortable" ? "default" : "outline"} onClick={() => void updateSetting("density", "comfortable")}>Comfortable</Button>
            <Button variant={settingMap.density === "compact" ? "default" : "outline"} onClick={() => void updateSetting("density", "compact")}>Compact</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sidebar mode</CardTitle>
            <CardDescription>Réduit la quantité de texte dans la navigation persistante.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Le mode compact enlève les lignes secondaires dans la navigation pour rapprocher le shell d’un comportement desktop dense.</div>
            <div className="flex gap-2">
            <Button variant={settingMap.compactSidebar === "false" ? "default" : "outline"} onClick={() => void updateSetting("compactSidebar", "false")}>Expanded</Button>
            <Button variant={settingMap.compactSidebar === "true" ? "default" : "outline"} onClick={() => void updateSetting("compactSidebar", "true")}>Compact</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Lecture rapide de l’état d’interface actuellement piloté par les préférences locales.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="theme-preview-board relative min-h-[220px] p-5" data-testid="theme-preview-board">
            <div className="relative z-10 grid h-full gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col justify-between rounded-[1.15rem] border border-border/70 bg-card/78 p-4 shadow-[0_16px_40px_-30px_color-mix(in_oklch,var(--foreground)_18%,transparent)]">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Theme stack</div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                    <span className="inline-flex h-3 w-3 rounded-full bg-primary" />
                    <span>{settingMap.theme ?? "ember"} / {settingMap.accentMode ?? "warm"}</span>
                  </div>
                </div>
                <div className="items-start mt-4 flex flex-wrap gap-2">
                  <span className="status-chip inline-flex items-center gap-[0.55rem] rounded-full px-[0.72rem] py-[0.42rem] text-[0.76rem] status-chip-strong">Primary</span>
                  <span className="status-chip inline-flex items-center gap-[0.55rem] rounded-full px-[0.72rem] py-[0.42rem] text-[0.76rem]">Muted</span>
                  <span className="status-chip inline-flex items-center gap-[0.55rem] rounded-full px-[0.72rem] py-[0.42rem] text-[0.76rem]">Surface</span>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="surface-elevated rounded-[1rem] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Preview card</div>
                      <div className="mt-2 text-base font-semibold text-foreground">Readable by design</div>
                    </div>
                    <span className="inline-flex h-9 w-9 rounded-full bg-primary/18 ring-1 ring-border/60" />
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">Le texte principal, les surfaces et les accents restent hiérarchisés même si le fond devient sombre.</div>
                </div>
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
            <div className="rounded-[1.2rem] border border-border/70 bg-card/70 p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Information density</div>
              <div className="mt-3 text-sm text-foreground">Current mode: <strong>{settingMap.density ?? "comfortable"}</strong></div>
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-card/70 p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Navigation mode</div>
              <div className="mt-3 text-sm text-foreground">Sidebar copy is <strong>{settingMap.compactSidebar === "true" ? "hidden" : "visible"}</strong></div>
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-card/70 p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Theme intent</div>
              <div className="mt-3 text-sm text-foreground">{activeTheme.description}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="theme-diagnostics-card">
        <CardHeader>
          <CardTitle>Theme diagnostics</CardTitle>
          <CardDescription>Lecture en conditions réelles des composants sensibles au contraste avant de quitter la page.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="surface-elevated rounded-[1.2rem] p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Controls</div>
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
            </div>

            <Alert>
              <AlertTitle>Hierarchy check</AlertTitle>
              <AlertDescription>Le texte secondaire, les bordures et les surfaces doivent rester distincts sans écraser l’action primaire.</AlertDescription>
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
                <div className="surface-soft rounded-[1rem] p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Surface</div>
                  <div className="mt-2 text-base font-semibold text-foreground">Foreground remains clear</div>
                  <div className="mt-2 text-sm text-muted-foreground">Le texte principal et secondaire doivent garder un écart net.</div>
                </div>
                <div className="surface-subtle rounded-[1rem] p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Accent</div>
                  <div className="mt-2 text-base font-semibold text-foreground">Accent does not overpower</div>
                  <div className="mt-2 text-sm text-muted-foreground">Les hovers et surfaces d’accent restent lisibles même en mode sombre.</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}