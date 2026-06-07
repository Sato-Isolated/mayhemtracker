import { BarChart3, Bug, Cog, Database, Home, LayoutGrid, RefreshCcw, Sparkles, Swords, Users } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/features/status-badge";
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

export function AppShell({ children }: { children: ReactNode }) {
  const { settingMap } = useShellSettings();
  const { leagueConnected } = useLeagueConnection();
  const { champions, items, augments, syncStaticData } = useStaticData();
  const { matches, syncMatches } = useMatches();

  const showPageDescriptions = settingMap.showPageDescriptions !== "false";
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
    <div className="mx-auto grid min-h-screen w-full max-w-[1680px] grid-cols-[176px_minmax(0,1fr)] gap-2.5 bg-[radial-gradient(circle_at_15%_0%,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_30%)] px-0 py-0 max-[980px]:grid-cols-1">
      <aside
        className={cn(
          "app-scrollbar sticky top-0 flex h-screen flex-col justify-between gap-4 overflow-y-auto border-r border-[var(--border-ui)]",
          "bg-[color-mix(in_oklch,var(--sidebar)_94%,black)] p-3 transition-[background,border-color,color,box-shadow,background-color] duration-220 motion-reduce:transition-none",
          "max-[980px]:static max-[980px]:h-auto max-[980px]:gap-2 max-[980px]:border-b max-[980px]:border-r-0 max-sm:p-2",
        )}
      >
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-border/70 px-1 pb-3">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">M</span>
            <div>
              <div className="text-sm font-semibold text-foreground">Mayhem Tracker</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 max-[980px]:grid max-[980px]:grid-cols-4 max-sm:grid-cols-4" aria-label="Primary navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 overflow-hidden rounded-md border border-transparent text-foreground no-underline",
                      "transition-[background-color,border-color] duration-140 motion-reduce:transition-none",
                      "hover:border-[color-mix(in_oklch,var(--border)_80%,var(--primary))] hover:bg-[var(--hover-overlay)]",
                      dense ? "px-2.5 py-2" : "px-2.5 py-2.5 max-sm:flex-col max-sm:gap-1 max-sm:px-1.5 max-sm:py-2 max-sm:text-center",
                      isActive &&
                        "border-[color-mix(in_oklch,var(--primary)_42%,var(--border))] bg-[color-mix(in_oklch,var(--primary)_12%,var(--card))]",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="relative size-4 shrink-0" />
                      <div className="relative min-w-0 flex-1 max-sm:w-full">
                        <div className="truncate text-sm font-medium max-sm:text-[0.7rem]">{item.label}</div>
                        {!dense && showPageDescriptions ? <div className="truncate text-[0.66rem] text-muted-foreground max-sm:hidden">{item.description}</div> : null}
                      </div>
                      {isActive ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="relative rounded-lg border border-border/75 bg-[color-mix(in_oklch,var(--card)_78%,var(--surface-2))] px-3 py-2.5 max-sm:hidden">
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
        </div>
      </aside>

      <div className="min-w-0 flex flex-col gap-3 px-3 py-3">
        <header
          className={cn(
            "z-10 flex flex-wrap items-center justify-end gap-2 rounded-lg border border-[var(--border-ui)]",
            "bg-[color-mix(in_oklch,var(--topbar)_92%,transparent)] px-3 shadow-[0_18px_44px_-42px_color-mix(in_oklch,black_80%,transparent)] backdrop-blur-[8px]",
            "transition-[background,border-color,color,box-shadow,background-color] duration-220 motion-reduce:transition-none max-[980px]:static",
            dense ? "py-2" : "py-2",
          )}
        >
          <div className="flex flex-wrap items-center justify-end gap-1.5 max-[980px]:w-full max-[980px]:justify-start max-sm:grid max-sm:grid-cols-2">
            <StatusBadge tone={leagueConnected ? "success" : "neutral"}>{leagueConnected ? "League online" : "League offline"}</StatusBadge>
            {shellBadges.map((entry) => (
              <Badge key={entry.label} variant={entry.variant}>{entry.label}</Badge>
            ))}
            <Button size="sm" variant="outline" className="max-sm:w-full" onClick={() => void syncMatches()}><RefreshCcw className="size-4" />Sync matches</Button>
            <Button size="sm" variant="outline" className="max-sm:w-full" onClick={() => void syncStaticData()}><Database className="size-4" />Sync static data</Button>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
