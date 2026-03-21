import { ArrowDownUp, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { MetricTile } from "@/components/features/metric-tile";
import { PageIntro } from "@/components/features/page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ChampionStats } from "@/lib/types";
import { useAnalytics } from "@/state/tracker-data";

type ChampionSortKey = "matches" | "winRate" | "averageKda" | "averageDamage" | "averageGold" | "championName";

export function ChampionsPage() {
  const { championStats, loadChampionStats } = useAnalytics();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortKey, setSortKey] = useState<ChampionSortKey>("matches");
  const [descending, setDescending] = useState(true);
  const [selectedChampion, setSelectedChampion] = useState<ChampionStats | null>(null);

  useEffect(() => {
    if (!championStats.data && !championStats.loading) {
      void loadChampionStats();
    }
  }, [championStats.data, championStats.loading, loadChampionStats]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const rows = (championStats.data ?? []).filter((entry) => {
      if (!query) {
        return true;
      }

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
    setDescending(nextKey === "championName" ? false : true);
  }

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Champion analytics" title="Champion pool" description="Premier tableau métier dédié, pensé pour la lecture rapide plutôt qu’une simple dump de debug." />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <MetricTile label="Most impactful pick" value={topEntry?.championName ?? "-"} hint={topEntry ? `${topEntry.matches} games · ${topEntry.winRate}% WR · ${topEntry.averageKda} KDA` : "No champion data"} />
        <div className="panel-surface flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[260px] flex-1">
            <label htmlFor="champion-search" className="sr-only">Rechercher un champion</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="champion-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un champion"
              className="w-full rounded-2xl border border-border bg-[color-mix(in_oklch,var(--card)_78%,var(--surface-2))] py-3 pl-10 pr-4 text-sm text-foreground outline-none ring-offset-2 placeholder:text-muted-foreground focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button variant="outline" onClick={() => toggleSort("matches")}><ArrowDownUp className="h-4 w-4" /> Games</Button>
          <Button variant="outline" onClick={() => toggleSort("winRate")}><ArrowDownUp className="h-4 w-4" /> WR</Button>
          <Button variant="outline" onClick={() => toggleSort("averageKda")}><ArrowDownUp className="h-4 w-4" /> KDA</Button>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Champion</TableHead>
                <TableHead>Games</TableHead>
                <TableHead>WR</TableHead>
                <TableHead>KDA</TableHead>
                <TableHead>Damage</TableHead>
                <TableHead>Gold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={String(entry.championId ?? entry.championName)}>
                  <TableCell>
                    <button
                      type="button"
                      className="rounded-md text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setSelectedChampion(entry)}
                    >
                      {entry.championName ?? `Champion ${entry.championId ?? "-"}`}
                    </button>
                  </TableCell>
                  <TableCell>{entry.matches}</TableCell>
                  <TableCell><Badge variant="outline">{entry.winRate}%</Badge></TableCell>
                  <TableCell>{entry.averageKda}</TableCell>
                  <TableCell>{Math.round(entry.averageDamage / 100) / 10}k</TableCell>
                  <TableCell>{Math.round(entry.averageGold / 100) / 10}k</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={selectedChampion !== null} onOpenChange={(open) => !open && setSelectedChampion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedChampion?.championName ?? `Champion ${selectedChampion?.championId ?? "-"}`}</DialogTitle>
            <DialogDescription>Lecture compacte des signaux principaux pour décider si le pick mérite une analyse plus poussée.</DialogDescription>
          </DialogHeader>
          {selectedChampion ? (
            <div className="grid gap-4 md:grid-cols-2">
              <MetricTile label="Match volume" value={selectedChampion.matches} className="p-4" />
              <MetricTile label="Win rate" value={`${selectedChampion.winRate}%`} className="p-4" />
              <MetricTile label="Average KDA" value={selectedChampion.averageKda} className="p-4" />
              <MetricTile label="Damage / Gold" value={`${Math.round(selectedChampion.averageDamage / 100) / 10}k / ${Math.round(selectedChampion.averageGold / 100) / 10}k`} className="p-4" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
