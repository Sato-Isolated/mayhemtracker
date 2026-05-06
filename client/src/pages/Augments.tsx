import { ArrowDownUp, RotateCcw, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AugmentIcon } from "@/components/features/augment-icon";
import { MetricTile } from "@/components/features/metric-tile";
import { PageIntro } from "@/components/features/page-intro";
import { PageToolbar } from "@/components/features/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AugmentStats } from "@/lib/types";
import { useAnalytics, useStaticData } from "@/state/tracker-data";

const rarityFilters = ["all", "silver", "gold", "prismatic"] as const;
type AugmentSortKey = "matches" | "winRate" | "label";

export function AugmentsPage() {
  const { augmentStats, loadAugmentStats } = useAnalytics();
  const { augments } = useStaticData();
  const [rarity, setRarity] = useState<(typeof rarityFilters)[number]>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortKey, setSortKey] = useState<AugmentSortKey>("matches");
  const [descending, setDescending] = useState(true);
  const [selectedAugment, setSelectedAugment] = useState<AugmentStats | null>(null);

  useEffect(() => {
    if (!augmentStats.data && !augmentStats.loading) {
      void loadAugmentStats();
    }
  }, [augmentStats.data, augmentStats.loading, loadAugmentStats]);

  const filtered = useMemo(
    () => (augmentStats.data ?? [])
      .filter((entry) => rarity === "all" || (entry.rarity ?? "").toLowerCase() === rarity)
      .filter((entry) => {
        const query = deferredSearch.trim().toLowerCase();
        if (!query) {
          return true;
        }

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

  const rarityCounts = useMemo(() => {
    const base = { silver: 0, gold: 0, prismatic: 0 };
    for (const entry of augmentStats.data ?? []) {
      const key = (entry.rarity ?? "").toLowerCase();
      if (key in base) {
        base[key as keyof typeof base] += 1;
      }
    }
    return base;
  }, [augmentStats.data]);

  function toggleSort(nextKey: AugmentSortKey) {
    if (sortKey === nextKey) {
      setDescending((current) => !current);
      return;
    }

    setSortKey(nextKey);
    setDescending(nextKey !== "label");
  }

  return (
    <div className="space-y-3.5">
      <PageIntro eyebrow="Augment analytics" title="Augment board" description="Compact meta board for rarity filtering, ranking, and fast inspection." />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricTile label="Silver" value={rarityCounts.silver} />
        <MetricTile label="Gold" value={rarityCounts.gold} />
        <MetricTile label="Prismatic" value={rarityCounts.prismatic} />
      </div>

      <PageToolbar
        testId="augments-toolbar"
        meta={(
          <>
            <Badge variant="outline">{filtered.length} augments</Badge>
            <Badge variant="secondary">Rarity: {rarity}</Badge>
            <Badge variant="outline">Sort: {sortKey}</Badge>
          </>
        )}
        search={(
          <div className="relative">
            <label htmlFor="augment-search" className="sr-only">Search augment</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="augment-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search augment"
              className="dense-input w-full rounded-xl border border-border bg-[color-mix(in_oklch,var(--card)_78%,var(--surface-2))] py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-offset-2 placeholder:text-muted-foreground focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}
        filters={(
          <>
            {rarityFilters.map((value) => (
              <Button key={value} size="sm" variant={rarity === value ? "default" : "outline"} onClick={() => setRarity(value)}>{value}</Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => toggleSort("matches")}><ArrowDownUp className="h-4 w-4" /> Games</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("winRate")}><ArrowDownUp className="h-4 w-4" /> WR</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("label")}><ArrowDownUp className="h-4 w-4" /> Name</Button>
            <Button variant="outline" size="sm" onClick={() => { setRarity("all"); setSearch(""); setSortKey("matches"); setDescending(true); }}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </>
        )}
      />

      <Card className="border-[color-mix(in_oklch,var(--border)_86%,var(--primary))]">
        <CardHeader className="pb-3">
          <CardTitle>Augment board</CardTitle>
          <CardDescription>Dense table view tuned for filtering rarity and spotting value quickly.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Augment</TableHead>
                <TableHead>Rarity</TableHead>
                <TableHead>Games</TableHead>
                <TableHead>WR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length ? filtered.map((entry) => (
                <TableRow key={entry.augmentId}>
                  <TableCell>
                    <button
                      type="button"
                      className="flex items-center gap-3 rounded-md text-left underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setSelectedAugment(entry)}
                    >
                      <AugmentIcon augmentId={entry.augmentId} augments={augments} size={28} />
                      <span className="font-medium text-foreground">{entry.label ?? entry.augmentId}</span>
                    </button>
                  </TableCell>
                  <TableCell>{entry.rarity ? <Badge variant="secondary">{entry.rarity}</Badge> : "-"}</TableCell>
                  <TableCell>{entry.matches}</TableCell>
                  <TableCell>{entry.winRate}%</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No augments match the current filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={selectedAugment !== null} onOpenChange={(open) => !open && setSelectedAugment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedAugment ? <AugmentIcon augmentId={selectedAugment.augmentId} augments={augments} size={32} /> : null}
              <span>{selectedAugment?.label ?? selectedAugment?.augmentId}</span>
            </DialogTitle>
            <DialogDescription>Quick augment detail for comparing volume, rarity, and return.</DialogDescription>
          </DialogHeader>
          {selectedAugment ? (
            <div className="grid gap-3 md:grid-cols-3">
              <MetricTile label="Games" value={selectedAugment.matches} />
              <MetricTile label="Win rate" value={`${selectedAugment.winRate}%`} />
              <MetricTile label="Rarity" value={selectedAugment.rarity ?? "-"} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
