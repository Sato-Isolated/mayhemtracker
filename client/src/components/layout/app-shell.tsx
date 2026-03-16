import { BarChart3, Bug, Cog, Home, LayoutGrid, Sparkles, Swords, Users } from "lucide-react";
import { useEffect, useMemo, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { useTrackerAppData, useTrackerMatchData } from "@/state/tracker-data";

const navigation = [
  { to: "/", label: "Dashboard", description: "Vue centrale", icon: Home },
  { to: "/profile", label: "Profile", description: "Identite locale", icon: LayoutGrid },
  { to: "/history", label: "History", description: "Liste et analyse", icon: Swords },
  { to: "/champions", label: "Champions", description: "Perf par pick", icon: BarChart3 },
  { to: "/augments", label: "Augments", description: "Synergies et taux", icon: Sparkles },
  { to: "/friends", label: "Friends", description: "Coequipiers", icon: Users },
  { to: "/settings", label: "Settings", description: "Preferences locales", icon: Cog },
  { to: "/debug", label: "Debug", description: "Outils internes", icon: Bug },
];

const routeCopy: Record<string, { title: string; description: string }> = {
  "/": { title: "Operational dashboard", description: "Pilotage des performances, du sync local et des signaux de session." },
  "/profile": { title: "Player profile", description: "Resume du compte suivi, records et dynamique recente." },
  "/history": { title: "Match history", description: "Navigation dans l’historique local et accès aux analyses de partie." },
  "/champions": { title: "Champion insights", description: "Lecture des performances par champion et distribution du pool." },
  "/augments": { title: "Augment insights", description: "Lecture des augments les plus utilises et les plus rentables." },
  "/friends": { title: "Teammates", description: "Suivi des partenaires fréquents avec rating local persistant." },
  "/settings": { title: "Interface settings", description: "Preferences locales pour le shell et la densite d’affichage." },
  "/debug": { title: "Debug console", description: "Outils de verification technique et contrats backend." },
};

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { dashboard, status, leagueConnected, champions, items, augments, settings, syncStaticData } = useTrackerAppData();
  const { matches, syncMatches } = useTrackerMatchData();

  const routeKey = location.pathname.startsWith("/history/") ? "/history" : location.pathname;
  const currentRoute = routeCopy[routeKey] ?? routeCopy["/"];
  const settingMap = useMemo(() => Object.fromEntries((settings.data ?? []).map((entry) => [entry.key, entry.value])), [settings.data]);
  const shellBadges = useMemo(
    () => [
      { label: `${matches.data?.total ?? 0} matches` },
      { label: `${champions.length} champs` },
      { label: `${items.length} items` },
      { label: `${augments.length} augments` },
    ],
    [augments.length, champions.length, items.length, matches.data?.total],
  );
  const statusChips = useMemo(
    () => [
      `Theme ${settingMap.theme ?? "ember"}`,
      `Win rate ${dashboard.data?.overview.winRate ?? 0}%`,
      `Avg KDA ${dashboard.data?.overview.averageKda ?? 0}`,
      `Density ${settingMap.density ?? "comfortable"}`,
    ],
    [dashboard.data?.overview.averageKda, dashboard.data?.overview.winRate, settingMap.density, settingMap.theme],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settingMap.theme ?? "ember";
    root.dataset.density = settingMap.density ?? "comfortable";
    root.dataset.accentMode = settingMap.accentMode ?? "warm";
    root.dataset.compactSidebar = settingMap.compactSidebar ?? "false";
  }, [settingMap]);

  return (
    <div className="grid min-h-screen grid-cols-[290px_minmax(0,1fr)] gap-5 p-5 max-[1100px]:grid-cols-1 max-sm:p-[0.85rem]">
      <aside className="app-sidebar flex max-h-[calc(100vh-2.5rem)] flex-col justify-between gap-4 sticky top-5 rounded-[2rem] p-4 overflow-y-auto max-[1100px]:min-h-auto max-[1100px]:static">
        <div className="space-y-4">
          <nav className="app-sidebar-nav space-y-1.5 max-[1100px]:grid max-[1100px]:grid-cols-2 max-[1100px]:gap-[0.65rem] max-sm:grid-cols-1" aria-label="Primary navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "app-nav-link flex items-center gap-[0.8rem] relative rounded-[1.2rem] px-[0.95rem] py-[0.85rem] no-underline overflow-hidden group",
                      isActive && "app-nav-link-active",
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{item.label}</div>
                    <div className="truncate text-xs text-muted-foreground/90 sidebar-copy">{item.description}</div>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <Surface className="rounded-[1.2rem] px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <span className={cn(
              "size-2 shrink-0 rounded-full",
              leagueConnected
                ? "bg-success shadow-[0_0_0_0.3rem_color-mix(in_oklch,var(--success)_20%,transparent)]"
                : "bg-muted-foreground/40 shadow-[0_0_0_0.3rem_color-mix(in_oklch,var(--muted-foreground)_10%,transparent)]",
            )} />
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">League client</div>
              <div className="text-xs text-muted-foreground">{leagueConnected ? "Connecte — auto-sync actif" : "Deconnecte"}</div>
            </div>
          </div>
        </Surface>
      </aside>

      <div className="min-w-0 flex flex-col gap-[0.8rem]">
        <header className="app-topbar flex flex-wrap items-center justify-between gap-[0.8rem] sticky top-5 z-10 rounded-[1.3rem] px-4 py-[0.9rem] max-[1100px]:static">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Product surface</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{currentRoute.title}</h2>
              <p className="text-sm text-muted-foreground">{currentRoute.description}</p>
            </div>
          </div>
          <div className="justify-end flex flex-wrap items-center gap-2 max-[1100px]:w-full max-[1100px]:justify-start">
            {shellBadges.map((entry) => (
              <Badge key={entry.label} variant="outline">{entry.label}</Badge>
            ))}
            <Button onClick={() => void syncMatches()}>Sync matches</Button>
            <Button variant="outline" onClick={() => void syncStaticData()}>Sync static</Button>
          </div>
        </header>

        <div className="flex flex-wrap gap-[0.45rem]">
          <div className="inline-flex items-center gap-[0.55rem] rounded-full border border-[color-mix(in_oklch,var(--border)_74%,white)] bg-[color-mix(in_oklch,var(--card)_76%,var(--secondary))] px-[0.72rem] py-[0.42rem] text-[0.76rem] text-muted-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_45%,transparent)]">
            <span className="size-2 rounded-full bg-primary shadow-[0_0_0_0.35rem_color-mix(in_oklch,var(--primary)_16%,transparent)]" />
            Backend {status.data?.ok ? "reachable" : "idle"}
          </div>
          {statusChips.map((chip) => (
            <div key={chip} className="inline-flex items-center gap-[0.55rem] rounded-full border border-[color-mix(in_oklch,var(--border)_74%,white)] bg-[color-mix(in_oklch,var(--card)_76%,var(--secondary))] px-[0.72rem] py-[0.42rem] text-[0.76rem] text-muted-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_45%,transparent)]">{chip}</div>
          ))}
        </div>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
