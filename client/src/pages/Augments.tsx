import { ArrowDownUp, ChevronRight, RotateCcw, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AugmentIcon } from "@/components/features/augment-icon";
import { EmptyState } from "@/components/features/empty-state";
import { PageIntro } from "@/components/features/page-intro";
import { StatusBadge } from "@/components/features/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AugmentStats, StaticDataEntry } from "@/lib/types";
import { useAnalytics, useStaticData } from "@/state/tracker-data";

const rarityFilters = ["all", "silver", "gold", "prismatic"] as const;
type AugmentSortKey = "matches" | "winRate" | "label";

function AugmentInlineRow({
  entry,
  augments,
  expanded,
  onToggle,
}: {
  entry: AugmentStats;
  augments: StaticDataEntry[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const label = entry.label ?? entry.augmentId;

  return (
    <div className="border-b border-border/55 last:border-b-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`augment-inline-${entry.augmentId}`}
        className={cn(
          "grid w-full grid-cols-[minmax(12rem,1fr)_6.5rem_4.8rem_4.8rem_auto] items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "max-sm:grid-cols-[minmax(0,1fr)_4.6rem_auto] max-sm:[&_.augment-secondary]:hidden",
          expanded ? "bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))] shadow-[inset_3px_0_0_var(--primary)]" : "hover:bg-[color-mix(in_oklch,var(--primary)_5%,transparent)]",
        )}
        onClick={onToggle}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <AugmentIcon augmentId={entry.augmentId} augments={augments} size={34} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{label}</div>
            <div className="mt-0.5 text-[0.72rem] text-muted-foreground">{entry.augmentId}</div>
          </div>
        </div>
        <div className="augment-secondary">{entry.rarity ? <Badge variant="secondary">{entry.rarity}</Badge> : <Badge variant="outline">-</Badge>}</div>
        <div className="augment-secondary text-sm text-foreground">{entry.matches}</div>
        <div><Badge variant={entry.winRate >= 50 ? "success" : "outline"}>{entry.winRate}%</Badge></div>
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span className="max-sm:hidden">{expanded ? "Selected" : "Open"}</span>
          <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90 text-primary")} />
        </div>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-200 ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {expanded ? (
            <div id={`augment-inline-${entry.augmentId}`} className="border-t border-border/60 bg-card/75 p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <InlineMetric label="Games" value={`${entry.matches}`} />
                <InlineMetric label="Wins" value={`${entry.wins}`} />
                <InlineMetric label="Win rate" value={`${entry.winRate}%`} />
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

export function AugmentsPage() {
  const { augmentStats, loadAugmentStats } = useAnalytics();
  const { augments } = useStaticData();
  const [rarity, setRarity] = useState<(typeof rarityFilters)[number]>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortKey, setSortKey] = useState<AugmentSortKey>("matches");
  const [descending, setDescending] = useState(true);
  const [expandedAugment, setExpandedAugment] = useState<string | null>(null);

  useEffect(() => {
    if (!augmentStats.data && !augmentStats.loading) {
      void loadAugmentStats();
    }
  }, [augmentStats.data, augmentStats.loading, loadAugmentStats]);

  const filtered = useMemo(
    () => [...(augmentStats.data ?? [])]
      .filter((entry) => rarity === "all" || (entry.rarity ?? "").toLowerCase() === rarity)
      .filter((entry) => {
        const query = deferredSearch.trim().toLowerCase();
        if (!query) return true;
        return (entry.label ?? entry.augmentId).toLowerCase().includes(query);
      })
      .sort((left, right) => {
        const leftValue = left[sortKey] ?? "";
        const rightValue = right[sortKey] ?? "";
        const result = typeof leftValue === "string"
          ? String(leftValue).localeCompare(String(rightValue))
          : Number(leftValue) - Number(rightValue);
        return descending ? result * -1 : result;
      }),
    [augmentStats.data, deferredSearch, descending, rarity, sortKey],
  );

  function toggleSort(nextKey: AugmentSortKey) {
    if (sortKey === nextKey) {
      setDescending((current) => !current);
      return;
    }
    setSortKey(nextKey);
    setDescending(nextKey !== "label");
  }

  return (
    <div className="flex min-h-[calc(100vh-5.25rem)] flex-col gap-4">
      <PageIntro
        eyebrow="Augment analytics"
        title="Augments"
        description="Augment performance as a compact inline archive."
        actions={(
          <>
            <StatusBadge>{filtered.length} visible</StatusBadge>
            <StatusBadge tone="info">Inline review</StatusBadge>
          </>
        )}
      />

      <section className="rounded-md border border-border/70 bg-card/72" data-testid="augments-card">
        <div className="grid gap-2 border-b border-border/60 p-2 min-[980px]:grid-cols-[minmax(15rem,1fr)_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">Search augment</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search augment"
              className="h-9 w-full rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_78%,var(--card))] pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2" data-testid="augments-toolbar">
            {rarityFilters.map((value) => (
              <Button key={value} size="sm" variant={rarity === value ? "default" : "outline"} onClick={() => setRarity(value)}>{value}</Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => toggleSort("matches")}><ArrowDownUp className="size-4" /> Games</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("winRate")}><ArrowDownUp className="size-4" /> WR</Button>
            <Button variant="outline" size="sm" onClick={() => { setRarity("all"); setSearch(""); setSortKey("matches"); setDescending(true); }}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
          <StatusBadge>Rarity: {rarity}</StatusBadge>
          <StatusBadge>Sort: {sortKey}</StatusBadge>
          <StatusBadge tone="info">{descending ? "Descending" : "Ascending"}</StatusBadge>
        </div>

        <div className="grid grid-cols-[minmax(12rem,1fr)_6.5rem_4.8rem_4.8rem_auto] gap-3 border-b border-border/60 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground max-sm:grid-cols-[minmax(0,1fr)_4.6rem_auto] max-sm:[&_.augment-secondary]:hidden">
          <span>Augment</span>
          <span className="augment-secondary">Rarity</span>
          <span className="augment-secondary">Games</span>
          <span>WR</span>
          <span />
        </div>

        <div className="app-scrollbar max-h-[calc(100vh-18.5rem)] overflow-y-auto max-xl:max-h-none">
          {filtered.length ? filtered.map((entry) => (
            <AugmentInlineRow
              key={entry.augmentId}
              entry={entry}
              augments={augments}
              expanded={expandedAugment === entry.augmentId}
              onToggle={() => setExpandedAugment((current) => current === entry.augmentId ? null : entry.augmentId)}
            />
          )) : (
            <EmptyState title="No augments found" description="Clear the filters or sync more matches." className="m-3 min-h-72" />
          )}
        </div>
      </section>
    </div>
  );
}
