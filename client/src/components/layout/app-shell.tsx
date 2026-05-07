import { BarChart3, Bug, Cog, Home, LayoutGrid, Sparkles, Swords, Users } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { useLeagueConnection, useMatches, useShellSettings, useStaticData } from "@/state/tracker-data";

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
  "/": { title: "Dashboard", description: "Performance, sync health, and session signals at a glance." },
  "/profile": { title: "Profile", description: "Tracked account snapshot, records, and recent trends." },
  "/history": { title: "History", description: "Dense queue for reviewing stored matches." },
  "/champions": { title: "Champions", description: "Quick read on champion performance and pool form." },
  "/augments": { title: "Augments", description: "Compact meta board for value and rarity." },
  "/friends": { title: "Friends", description: "Frequent teammates with local notes and ratings." },
  "/settings": { title: "Settings", description: "Desktop-first preferences for the local shell." },
  "/debug": { title: "Debug", description: "Verification tools and backend controls." },
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
  const dataDensity = settingMap.dataDensity ?? settingMap.density ?? "comfortable";
  const dense = dataDensity === "dense";

  const shellBadges = useMemo(
    () => [
      { label: `${matches.data?.total ?? 0} matches`, variant: "outline" as const },
      { label: `${champions.length + items.length + augments.length} static assets`, variant: "secondary" as const },
    ],
    [augments.length, champions.length, items.length, matches.data?.total],
  );

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1660px] grid-cols-[250px_minmax(0,1fr)] gap-5 px-5 py-4 max-[1300px]:grid-cols-[234px_minmax(0,1fr)] max-[1100px]:grid-cols-1 max-sm:px-3 max-sm:py-3">
      <aside
        className={cn(
          "relative sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col justify-between gap-4 overflow-y-auto border border-[var(--border-ui)]",
          "bg-[var(--sidebar)] p-4 shadow-[0_2px_14px_-10px_color-mix(in_oklch,var(--foreground)_30%,transparent)] transition-[background,border-color,color,box-shadow,background-color] duration-220 motion-reduce:transition-none",
          "max-[1100px]:static max-[1100px]:min-h-auto",
        )}
      >
        <div className="relative space-y-3">
          <div className="border-b border-border/70 px-1 pb-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Mayhem Tracker</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Desktop intelligence panel</div>
          </div>

          <nav className="space-y-2 max-[1100px]:grid max-[1100px]:grid-cols-2 max-[1100px]:gap-[0.65rem] max-sm:grid-cols-1" aria-label="Primary navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 overflow-hidden border border-transparent text-foreground no-underline",
                      "transition-[background-color,border-color] duration-140 motion-reduce:transition-none",
                      "hover:border-[color-mix(in_oklch,var(--border)_80%,var(--primary))] hover:bg-[var(--hover-overlay)]",
                      dense ? "px-3 py-[0.55rem]" : "px-3 py-2.5 max-sm:px-[0.85rem] max-sm:py-[0.8rem]",
                      isActive &&
                        "border-[color-mix(in_oklch,var(--primary)_42%,var(--border))] bg-[color-mix(in_oklch,var(--primary)_12%,var(--card))]",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="relative h-4 w-4 shrink-0" />
                      <div className="relative min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{item.label}</div>
                        {!compactSidebar && showPageDescriptions ? (
                          <div className="truncate text-[11px] text-muted-foreground/90">{item.description}</div>
                        ) : null}
                      </div>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <Surface className="relative px-3 py-3">
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
              <div className="text-sm font-medium text-foreground">Client League</div>
              <div className="text-xs text-muted-foreground">{leagueConnected ? "Online - auto sync ready" : "Offline - waiting for client"}</div>
            </div>
          </div>
        </Surface>
      </aside>

      <div className="min-w-0 flex flex-col gap-3.5 pb-2">
        <header
          className={cn(
            "sticky top-4 z-10 flex flex-wrap items-center justify-between gap-3 border border-[var(--border-ui)]",
            "bg-[color-mix(in_oklch,var(--topbar)_95%,var(--card))] px-4 shadow-[0_2px_14px_-10px_color-mix(in_oklch,var(--foreground)_30%,transparent)] backdrop-blur-[6px]",
            "transition-[background,border-color,color,box-shadow,background-color] duration-220 motion-reduce:transition-none max-[1100px]:static",
            dense ? "py-[0.65rem]" : "py-2.5",
          )}
        >
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Current workspace</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{currentRoute.title}</h2>
              {showPageDescriptions ? <p className="text-[13px] text-muted-foreground">{currentRoute.description}</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5 max-[1100px]:w-full max-[1100px]:justify-start">
            <Badge variant={leagueConnected ? "success" : "outline"}>{leagueConnected ? "League online" : "League offline"}</Badge>
            {shellBadges.map((entry) => (
              <Badge key={entry.label} variant={entry.variant}>{entry.label}</Badge>
            ))}
            <Button size="sm" variant="outline" onClick={() => void syncMatches()}>Sync matches</Button>
            <Button size="sm" variant="outline" onClick={() => void syncStaticData()}>Sync static data</Button>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
