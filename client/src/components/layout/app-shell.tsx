import { BarChart3, Bug, Cog, Home, LayoutGrid, ShieldCheck, Sparkles, Swords, Users } from "lucide-react";
import { useEffect, useMemo, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const { dashboard, status, champions, items, augments, settings, syncStaticData } = useTrackerAppData();
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
    <div className="app-shell-frame">
      <aside className="app-sidebar">
        <div className="space-y-4">
          <div className="panel-surface app-brand-panel rounded-[1.6rem] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Mayhem local</p>
                <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">Mayhem Tracker</h1>
              </div>
              <Badge variant={status.data?.ok ? "success" : "outline"}>{status.data?.ok ? "online" : "idle"}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Interface applicative dense et lisible pour le suivi ARAM local, avec des surfaces pensées pour rester nettes en clair comme en sombre.
            </p>
            <div className="app-brand-pulse mt-4 rounded-[1.1rem] border border-border/60 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active route</span>
                <span className="status-dot" />
              </div>
              <p className="mt-2 text-base font-semibold text-foreground">{currentRoute.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{currentRoute.description}</p>
            </div>
          </div>

          <nav className="app-sidebar-nav space-y-1.5" aria-label="Primary navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "app-nav-link group",
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

        <div className="panel-surface rounded-[1.4rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Tracked player</span>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-lg font-semibold text-foreground">{dashboard.data?.overview.trackedPlayerName ?? "Sync requis"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{dashboard.data?.overview.totalMatches ?? 0} matchs locaux • {dashboard.data?.overview.winRate ?? 0}% WR</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="surface-soft rounded-[1rem] px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">KDA</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{dashboard.data?.overview.averageKda ?? 0}</div>
            </div>
            <div className="surface-soft rounded-[1rem] px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Wins</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{dashboard.data?.overview.wins ?? 0}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main-column">
        <header className="app-topbar">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Product surface</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{currentRoute.title}</h2>
              <p className="text-sm text-muted-foreground">{currentRoute.description}</p>
            </div>
          </div>
          <div className="app-topbar-actions flex flex-wrap items-center gap-2">
            {shellBadges.map((entry) => (
              <Badge key={entry.label} variant="outline">{entry.label}</Badge>
            ))}
            <Button onClick={() => void syncMatches()}>Sync matches</Button>
            <Button variant="outline" onClick={() => void syncStaticData()}>Sync static</Button>
          </div>
        </header>

        <div className="app-status-strip">
          <div className="status-chip">
            <span className="status-dot" />
            Backend {status.data?.ok ? "reachable" : "idle"}
          </div>
          {statusChips.map((chip) => (
            <div key={chip} className="status-chip">{chip}</div>
          ))}
        </div>

        <main className="app-content-area">{children}</main>
      </div>
    </div>
  );
}
