import { useState } from "react";
import { PageIntro } from "@/components/features/page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrackerAppData } from "@/state/tracker-data";

export function FriendsPage() {
  const { teammates, updatePlayerRating } = useTrackerAppData();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const sorted = [...(teammates.data ?? [])].sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0) || right.matches - left.matches);

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Teammates" title="Friends board" description="Première implémentation des coéquipiers fréquents avec rating local persistant, déjà exploitable." />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric-tile p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tracked teammates</div>
          <div className="mt-3 text-3xl font-semibold">{sorted.length}</div>
        </div>
        <div className="metric-tile p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rated players</div>
          <div className="mt-3 text-3xl font-semibold">{sorted.filter((entry) => typeof entry.rating === "number").length}</div>
        </div>
        <div className="metric-tile p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Most played ally</div>
          <div className="mt-3 text-xl font-semibold">{sorted[0]?.summonerName ?? "-"}</div>
          <div className="mt-1 text-sm text-muted-foreground">{sorted[0]?.matches ?? 0} games</div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {sorted.map((entry) => (
          <Card key={entry.puuid}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{entry.summonerName}</CardTitle>
                  <CardDescription>{entry.matches} games ensemble · {entry.winRateTogether}% WR · {entry.winsTogether}-{entry.lossesTogether}</CardDescription>
                </div>
                {entry.rating ? <Badge variant="default">{entry.rating}/5</Badge> : <Badge variant="outline">No rating</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button key={value} size="sm" variant={entry.rating === value ? "default" : "outline"} onClick={() => void updatePlayerRating(entry.puuid, entry.summonerName, value, notes[entry.puuid] ?? entry.note)}>{value}</Button>
                ))}
              </div>
              <textarea
                value={notes[entry.puuid] ?? entry.note ?? ""}
                onChange={(event) => setNotes((current) => ({ ...current, [entry.puuid]: event.target.value }))}
                placeholder="Note locale sur ce coéquipier"
                className="input-surface min-h-24 w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <Button variant="secondary" onClick={() => void updatePlayerRating(entry.puuid, entry.summonerName, entry.rating, notes[entry.puuid] ?? entry.note)}>Enregistrer la note</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}