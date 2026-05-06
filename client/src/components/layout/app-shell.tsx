import { BarChart3, Bug, Cog, Home, LayoutGrid, Sparkles, Swords, Users } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { useLeagueConnection, useMatches, useShellSettings, useStaticData } from "@/state/tracker-data";

const navigation = [
  { to: "/", label: "Dashboard", description: "Vue d'ensemble operationnelle", icon: Home },
  { to: "/profile", label: "Profil", description: "Identite locale", icon: LayoutGrid },
  { to: "/history", label: "Historique", description: "File de revue dense", icon: Swords },
  { to: "/champions", label: "Champions", description: "Performance des picks", icon: BarChart3 },
  { to: "/augments", label: "Augments", description: "Signaux de meta", icon: Sparkles },
  { to: "/friends", label: "Amis", description: "Notes sur les coequipiers", icon: Users },
  { to: "/settings", label: "Reglages", description: "Preferences locales", icon: Cog },
  { to: "/debug", label: "Debug", description: "Outils internes", icon: Bug },
];

const routeCopy: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Performance, synchronisation et signaux de session en un coup d'oeil." },
  "/profile": { title: "Profil", description: "Resume du compte suivi, records et tendances recentes." },
  "/history": { title: "Historique", description: "File dense pour parcourir et revoir les matchs stockes." },
  "/champions": { title: "Champions", description: "Lecture rapide des performances et de la forme du pool." },
  "/augments": { title: "Augments", description: "Tableau meta compact pour la valeur et la rarete." },
  "/friends": { title: "Amis", description: "Coequipiers frequents avec notes et evaluations locales." },
  "/settings": { title: "Reglages", description: "Preferences desktop-first pour le shell local." },
  "/debug": { title: "Debug", description: "Outils de verification et controles backend." },
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
      { label: `${matches.data?.total ?? 0} matchs`, variant: "outline" as const },
      { label: `${champions.length + items.length + augments.length} statiques`, variant: "secondary" as const },
    ],
    [augments.length, champions.length, items.length, matches.data?.total],
  );

  return (
    <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] gap-6 p-6 max-[1100px]:grid-cols-1 max-sm:p-3">
      <aside
        className={cn(
          "relative sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col justify-between gap-5 overflow-y-auto border border-[var(--border-ui)]",
          "bg-[var(--sidebar)] p-4 shadow-[0_2px_14px_-10px_color-mix(in_oklch,var(--foreground)_30%,transparent)] transition-[background,border-color,color,box-shadow,background-color] duration-220 motion-reduce:transition-none",
          "max-[1100px]:static max-[1100px]:min-h-auto",
        )}
      >
        <div className="relative space-y-3">
          <div className="border-b border-border/70 px-1 pb-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Mayhem Tracker</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Desktop intelligence panel</div>
          </div>

          <nav className="space-y-2 max-[1100px]:grid max-[1100px]:grid-cols-2 max-[1100px]:gap-[0.65rem] max-sm:grid-cols-1" aria-label="Navigation principale">
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
              <div className="text-xs text-muted-foreground">{leagueConnected ? "En ligne - synchro auto prete" : "Hors ligne - en attente du client"}</div>
            </div>
          </div>
        </Surface>
      </aside>

      <div className="min-w-0 flex flex-col gap-4">
        <header
          className={cn(
            "sticky top-6 z-10 flex flex-wrap items-center justify-between gap-3 border border-[var(--border-ui)]",
            "bg-[color-mix(in_oklch,var(--topbar)_94%,var(--card))] px-4 shadow-[0_2px_14px_-10px_color-mix(in_oklch,var(--foreground)_30%,transparent)] backdrop-blur-[6px]",
            "transition-[background,border-color,color,box-shadow,background-color] duration-220 motion-reduce:transition-none max-[1100px]:static",
            dense ? "py-[0.7rem]" : "py-3",
          )}
        >
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Current workspace</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{currentRoute.title}</h2>
              {showPageDescriptions ? <p className="text-sm text-muted-foreground">{currentRoute.description}</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 max-[1100px]:w-full max-[1100px]:justify-start">
            <Badge variant={leagueConnected ? "success" : "outline"}>{leagueConnected ? "League en ligne" : "League hors ligne"}</Badge>
            {shellBadges.map((entry) => (
              <Badge key={entry.label} variant={entry.variant}>{entry.label}</Badge>
            ))}
            <Button size="sm" onClick={() => void syncMatches()}>Synchroniser les matchs</Button>
            <Button size="sm" variant="outline" onClick={() => void syncStaticData()}>Synchroniser les donnees statiques</Button>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
