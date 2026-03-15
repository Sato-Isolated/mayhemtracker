import { ArrowDownUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageIntro } from "@/components/features/page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTrackerAppData } from "@/state/tracker-data";

type ChampionSortKey = "matches" | "winRate" | "averageKda" | "averageDamage" | "averageGold" | "championName";

export function ChampionsPage() {
  const { championStats } = useTrackerAppData();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<ChampionSortKey>("matches");
  const [descending, setDescending] = useState(true);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
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
  }, [championStats.data, descending, search, sortKey]);

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
        <div className="metric-tile p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Most impactful pick</div>
          <div className="mt-3 text-2xl font-semibold text-foreground">{topEntry?.championName ?? "-"}</div>
          <div className="mt-2 text-sm text-muted-foreground">{topEntry ? `${topEntry.matches} games · ${topEntry.winRate}% WR · ${topEntry.averageKda} KDA` : "No champion data"}</div>
        </div>
        <div className="panel-surface flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un champion"
              className="input-surface w-full rounded-2xl border border-border py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
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
                <Dialog key={String(entry.championId ?? entry.championName)}>
                  <DialogTrigger asChild>
                    <TableRow className="cursor-pointer">
                      <TableCell>
                        <div className="font-medium">{entry.championName ?? `Champion ${entry.championId ?? "-"}`}</div>
                      </TableCell>
                      <TableCell>{entry.matches}</TableCell>
                      <TableCell><Badge variant="outline">{entry.winRate}%</Badge></TableCell>
                      <TableCell>{entry.averageKda}</TableCell>
                      <TableCell>{Math.round(entry.averageDamage / 100) / 10}k</TableCell>
                      <TableCell>{Math.round(entry.averageGold / 100) / 10}k</TableCell>
                    </TableRow>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{entry.championName ?? `Champion ${entry.championId ?? "-"}`}</DialogTitle>
                      <DialogDescription>Lecture compacte des signaux principaux pour décider si le pick mérite une analyse plus poussée.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="metric-tile p-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Match volume</div>
                        <div className="mt-2 text-3xl font-semibold">{entry.matches}</div>
                      </div>
                      <div className="metric-tile p-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Win rate</div>
                        <div className="mt-2 text-3xl font-semibold">{entry.winRate}%</div>
                      </div>
                      <div className="metric-tile p-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Average KDA</div>
                        <div className="mt-2 text-3xl font-semibold">{entry.averageKda}</div>
                      </div>
                      <div className="metric-tile p-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Damage / Gold</div>
                        <div className="mt-2 text-2xl font-semibold">{Math.round(entry.averageDamage / 100) / 10}k / {Math.round(entry.averageGold / 100) / 10}k</div>
                      </div>
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