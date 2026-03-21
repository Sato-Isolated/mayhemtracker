import { BarChart3, Bug, Cog, Home, LayoutGrid, Sparkles, Swords, Users } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { useLeagueConnection, useMatches, useShellSettings, useStaticData } from "@/state/tracker-data";
import "./app-shell.css";

const navigation = [
  { to: "/", label: "Dashboard", description: "Operational overview", icon: Home },
  { to: "/profile", label: "Profile", description: "Local identity", icon: LayoutGrid },
  { to: "/history", label: "History", description: "Dense review queue", icon: Swords },
  { to: "/champions", label: "Champions", description: "Pick performance", icon: BarChart3 },
  { to: "/augments", label: "Augments", description: "Meta signals", icon: Sparkles },
  { to: "/friends", label: "Friends", description: "Teammate notes", icon: Users },
  { to: "/settings", label: "Settings", description: "Local preferences", icon: Cog },
  { to: "/debug", label: "Debug", description: "Internal tools", icon: Bug },
];

const routeCopy: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Performance, sync, and session signals at a glance." },
  "/profile": { title: "Profile", description: "Tracked account summary, records, and recent direction." },
  "/history": { title: "History", description: "Dense queue for browsing and reviewing stored matches." },
  "/champions": { title: "Champions", description: "Fast read on champion performance and pool shape." },
  "/augments": { title: "Augments", description: "Compact meta board for value and rarity." },
  "/friends": { title: "Friends", description: "Frequent teammates with local notes and ratings." },
  "/settings": { title: "Settings", description: "Desktop-first preferences for the local shell." },
  "/debug": { title: "Debug", description: "Verification tools and backend checks." },
};

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { settingMap } = useShellSettings();
  const { leagueConnected } = useLeagueConnection();
  const { champions, items, augments, syncStaticData } = useStaticData();
  const { matches, syncMatches } = useMatches();

  const routeKey = location.pathname.startsWith("/history/") ? "/history" : location.pathname;
  const currentRoute = routeCopy[routeKey] ?? routeCopy["/"];
  const showPageDescriptions = settingMap.showPageDescriptions !== "false";
  const compactSidebar = settingMap.compactSidebar === "true";

  const shellBadges = useMemo(
    () => [
      { label: `${matches.data?.total ?? 0} matches`, variant: "outline" as const },
      { label: `${champions.length + items.length + augments.length} static`, variant: "secondary" as const },
    ],
    [augments.length, champions.length, items.length, matches.data?.total],
  );

  return (
    <div className="grid min-h-screen grid-cols-[254px_minmax(0,1fr)] gap-4 p-4 max-[1100px]:grid-cols-1 max-sm:p-3">
      <aside className="app-sidebar sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col justify-between gap-4 overflow-y-auto rounded-[1.45rem] p-3.5 max-[1100px]:static max-[1100px]:min-h-auto">
        <div className="space-y-3">
          <div className="px-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Mayhem Tracker</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Local desktop utility</div>
          </div>

          <nav className="app-sidebar-nav space-y-1.5 max-[1100px]:grid max-[1100px]:grid-cols-2 max-[1100px]:gap-[0.65rem] max-sm:grid-cols-1" aria-label="Primary navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "app-nav-link group relative flex items-center gap-3 overflow-hidden rounded-[0.95rem] px-3 py-2.5 no-underline",
                      isActive && "app-nav-link-active",
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{item.label}</div>
                    {!compactSidebar && showPageDescriptions ? (
                      <div className="sidebar-copy truncate text-[11px] text-muted-foreground/90">{item.description}</div>
                    ) : null}
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <Surface className="rounded-[1rem] px-3 py-3">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                leagueConnected
                  ? "bg-success shadow-[0_0_0_0.3rem_color-mix(in_oklch,var(--success)_20%,transparent)]"
                  : "bg-muted-foreground/40 shadow-[0_0_0_0.3rem_color-mix(in_oklch,var(--muted-foreground)_10%,transparent)]",
              )}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">League client</div>
              <div className="text-xs text-muted-foreground">{leagueConnected ? "Online - auto-sync ready" : "Offline - waiting for client"}</div>
            </div>
          </div>
        </Surface>
      </aside>

      <div className="min-w-0 flex flex-col gap-4">
        <header className="app-topbar sticky top-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[1rem] px-4 py-3 max-[1100px]:static">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Current surface</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{currentRoute.title}</h2>
              {showPageDescriptions ? <p className="text-sm text-muted-foreground">{currentRoute.description}</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 max-[1100px]:w-full max-[1100px]:justify-start">
            <Badge variant={leagueConnected ? "success" : "outline"}>{leagueConnected ? "League online" : "League offline"}</Badge>
            {shellBadges.map((entry) => (
              <Badge key={entry.label} variant={entry.variant}>{entry.label}</Badge>
            ))}
            <Button size="sm" onClick={() => void syncMatches()}>Sync matches</Button>
            <Button size="sm" variant="outline" onClick={() => void syncStaticData()}>Sync static</Button>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
