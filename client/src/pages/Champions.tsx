import { ArrowDownUp, ChevronRight, RotateCcw, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/features/empty-state";
import { PageIntro } from "@/components/features/page-intro";
import { StatusBadge } from "@/components/features/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChampionStats } from "@/lib/types";
import { useAnalytics } from "@/state/tracker-data";

type ChampionSortKey = "matches" | "winRate" | "averageKda" | "averageDamage" | "averageGold" | "championName";

function formatK(value: number) {
  return `${Math.round(value / 100) / 10}k`;
}

function ChampionInlineRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: ChampionStats;
  expanded: boolean;
  onToggle: () => void;
}) {
  const name = entry.championName ?? `Champion ${entry.championId ?? "-"}`;

  return (
    <div className="border-b border-border/55 last:border-b-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`champion-inline-${entry.championId ?? name}`}
        className={cn(
          "grid w-full grid-cols-[minmax(9rem,1fr)_4.8rem_4.6rem_4.8rem_5.6rem_auto] items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "max-lg:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_auto] max-lg:[&_.champion-output]:hidden",
          "max-sm:grid-cols-[minmax(0,1fr)_4.4rem_auto] max-sm:[&_.champion-kda]:hidden",
          expanded ? "bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))] shadow-[inset_3px_0_0_var(--primary)]" : "hover:bg-[color-mix(in_oklch,var(--primary)_5%,transparent)]",
        )}
        onClick={onToggle}
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{name}</div>
          <div className="mt-0.5 text-[0.72rem] text-muted-foreground">{entry.wins}W - {entry.losses}L</div>
        </div>
        <div className="text-sm text-foreground">{entry.matches}</div>
        <div><Badge variant={entry.winRate >= 50 ? "success" : "outline"}>{entry.winRate}%</Badge></div>
        <div className="champion-kda text-sm font-semibold text-foreground">{entry.averageKda}</div>
        <div className="champion-output text-xs text-muted-foreground">
          <div>{formatK(entry.averageDamage)} dmg</div>
          <div>{formatK(entry.averageGold)} gold</div>
        </div>
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span className="max-sm:hidden">{expanded ? "Selected" : "Open"}</span>
          <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90 text-primary")} />
        </div>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-200 ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {expanded ? (
            <div id={`champion-inline-${entry.championId ?? name}`} className="border-t border-border/60 bg-card/75 p-3">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <InlineMetric label="Volume" value={`${entry.matches} games`} />
                <InlineMetric label="Record" value={`${entry.wins}W - ${entry.losses}L`} />
                <InlineMetric label="Average KDA" value={String(entry.averageKda)} />
                <InlineMetric label="Output" value={`${formatK(entry.averageDamage)} / ${formatK(entry.averageGold)}`} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-[color-mix(in_oklch,var(--background)_62%,var(--card))] px-3 py-2">
      <div className="text-[0.68rem] font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function ChampionsPage() {
  const { championStats, loadChampionStats } = useAnalytics();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortKey, setSortKey] = useState<ChampionSortKey>("matches");
  const [descending, setDescending] = useState(true);
  const [expandedChampion, setExpandedChampion] = useState<string | null>(null);

  useEffect(() => {
    if (!championStats.data && !championStats.loading) {
      void loadChampionStats();
    }
  }, [championStats.data, championStats.loading, loadChampionStats]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const rows = [...(championStats.data ?? [])].filter((entry) => {
      if (!query) return true;
      return (entry.championName ?? `champion ${entry.championId ?? ""}`).toLowerCase().includes(query);
    });

    return rows.sort((left, right) => {
      const leftValue = left[sortKey] ?? 0;
      const rightValue = right[sortKey] ?? 0;
      const result = typeof leftValue === "string"
        ? leftValue.localeCompare(String(rightValue))
        : Number(leftValue) - Number(rightValue);
      return descending ? result * -1 : result;
    });
  }, [championStats.data, deferredSearch, descending, sortKey]);

  const topEntry = filtered[0];

  function toggleSort(nextKey: ChampionSortKey) {
    if (sortKey === nextKey) {
      setDescending((current) => !current);
      return;
    }
    setSortKey(nextKey);
    setDescending(nextKey !== "championName");
  }

  return (
    <div className="flex min-h-[calc(100vh-5.25rem)] flex-col gap-4">
      <PageIntro
        eyebrow="Champion analytics"
        title="Champions"
        description="Champion performance as a compact inline archive."
        actions={(
          <>
            <StatusBadge>{filtered.length} visible</StatusBadge>
            <StatusBadge tone="info">Inline review</StatusBadge>
          </>
        )}
      />

      <section className="rounded-md border border-border/70 bg-card/72" data-testid="champions-card">
        <div className="grid gap-2 border-b border-border/60 p-2 min-[980px]:grid-cols-[minmax(15rem,1fr)_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">Search champion</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search champion"
              className="h-9 w-full rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_78%,var(--card))] pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2" data-testid="champions-toolbar" data-density="dense">
            <Button variant="outline" size="sm" onClick={() => toggleSort("matches")}><ArrowDownUp className="size-4" /> Games</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("winRate")}><ArrowDownUp className="size-4" /> WR</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("averageKda")}><ArrowDownUp className="size-4" /> KDA</Button>
            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSortKey("matches"); setDescending(true); }}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
          <StatusBadge>Top: {topEntry?.championName ?? "-"}</StatusBadge>
          <StatusBadge>Sort: {sortKey}</StatusBadge>
          <StatusBadge tone="info">{descending ? "Descending" : "Ascending"}</StatusBadge>
        </div>

        <div className="grid grid-cols-[minmax(9rem,1fr)_4.8rem_4.6rem_4.8rem_5.6rem_auto] gap-3 border-b border-border/60 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground max-lg:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_auto] max-lg:[&_.champion-output]:hidden max-sm:grid-cols-[minmax(0,1fr)_4.4rem_auto] max-sm:[&_.champion-kda]:hidden">
          <span>Champion</span>
          <span>Games</span>
          <span>WR</span>
          <span className="champion-kda">KDA</span>
          <span className="champion-output">Output</span>
          <span />
        </div>

        <div className="app-scrollbar max-h-[calc(100vh-18.5rem)] overflow-y-auto max-xl:max-h-none">
          {filtered.length ? filtered.map((entry) => {
            const id = String(entry.championId ?? entry.championName);
            return (
              <ChampionInlineRow
                key={id}
                entry={entry}
                expanded={expandedChampion === id}
                onToggle={() => setExpandedChampion((current) => current === id ? null : id)}
              />
            );
          }) : (
            <EmptyState title="No champions found" description="Clear the search or sync more matches." className="m-3 min-h-72" />
          )}
        </div>
      </section>
    </div>
  );
}
