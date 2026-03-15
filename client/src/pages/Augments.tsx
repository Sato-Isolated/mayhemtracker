import { ArrowDownUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AugmentIcon } from "@/components/features/augment-icon";
import { PageIntro } from "@/components/features/page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTrackerAppData } from "@/state/tracker-data";

const rarityFilters = ["all", "silver", "gold", "prismatic"] as const;
type AugmentSortKey = "matches" | "winRate" | "label";

export function AugmentsPage() {
  const { augmentStats, augments } = useTrackerAppData();
  const [rarity, setRarity] = useState<(typeof rarityFilters)[number]>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<AugmentSortKey>("matches");
  const [descending, setDescending] = useState(true);

  const filtered = useMemo(
    () => (augmentStats.data ?? [])
      .filter((entry) => rarity === "all" || (entry.rarity ?? "").toLowerCase() === rarity)
      .filter((entry) => {
        const query = search.trim().toLowerCase();
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
    [augmentStats.data, descending, rarity, search, sortKey],
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
    setDescending(nextKey === "label" ? false : true);
  }

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Augment analytics" title="Augment board" description="Filtre de rareté et lecture compacte des augments qui structurent réellement les résultats." />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel-surface flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un augment"
              className="input-surface w-full rounded-2xl border border-border py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <Button variant="outline" onClick={() => toggleSort("matches")}><ArrowDownUp className="h-4 w-4" /> Games</Button>
          <Button variant="outline" onClick={() => toggleSort("winRate")}><ArrowDownUp className="h-4 w-4" /> WR</Button>
          <Button variant="outline" onClick={() => toggleSort("label")}><ArrowDownUp className="h-4 w-4" /> Name</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="metric-tile p-4"><div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Silver</div><div className="mt-2 text-2xl font-semibold">{rarityCounts.silver}</div></div>
          <div className="metric-tile p-4"><div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Gold</div><div className="mt-2 text-2xl font-semibold">{rarityCounts.gold}</div></div>
          <div className="metric-tile p-4"><div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Prismatic</div><div className="mt-2 text-2xl font-semibold">{rarityCounts.prismatic}</div></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {rarityFilters.map((value) => (
          <Button key={value} variant={rarity === value ? "default" : "outline"} onClick={() => setRarity(value)}>{value}</Button>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
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
              {filtered.map((entry) => (
                <Dialog key={entry.augmentId}>
                  <DialogTrigger asChild>
                    <TableRow className="cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AugmentIcon augmentId={entry.augmentId} augments={augments} size={28} />
                          <div className="font-medium">{entry.label ?? entry.augmentId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.rarity ? <Badge variant="secondary">{entry.rarity}</Badge> : "-"}</TableCell>
                      <TableCell>{entry.matches}</TableCell>
                      <TableCell>{entry.winRate}%</TableCell>
                    </TableRow>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3">
                        <AugmentIcon augmentId={entry.augmentId} augments={augments} size={32} />
                        <span>{entry.label ?? entry.augmentId}</span>
                      </DialogTitle>
                      <DialogDescription>Détail rapide d’un augment pour comparer volume, rareté et rendement.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="metric-tile p-4"><div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Games</div><div className="mt-2 text-3xl font-semibold">{entry.matches}</div></div>
                      <div className="metric-tile p-4"><div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Win rate</div><div className="mt-2 text-3xl font-semibold">{entry.winRate}%</div></div>
                      <div className="metric-tile p-4"><div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Rarity</div><div className="mt-2 text-2xl font-semibold">{entry.rarity ?? "-"}</div></div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}