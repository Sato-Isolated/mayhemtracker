import { Fragment } from "react";
import type { TeammateStats } from "@/lib/types";
import { FriendRow } from "@/components/features/friends/friend-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FriendsListProps {
  teammates: TeammateStats[];
  selectedPuuid: string | null;
  notes: Record<string, string>;
  savingPuuid: string | null;
  onSelect: (puuid: string | null) => void;
  onNoteChange: (puuid: string, value: string) => void;
  onSave: (entry: TeammateStats) => void;
  onRevert: (entry: TeammateStats) => void;
  onRate: (entry: TeammateStats, value: number) => void;
}

export function FriendsList({
  teammates,
  selectedPuuid,
  notes,
  savingPuuid,
  onSelect,
  onNoteChange,
  onSave,
  onRevert,
  onRate,
}: FriendsListProps) {
  return (
    <Card className="border-[color-mix(in_oklch,var(--border)_86%,var(--primary))]">
      <CardHeader className="pb-3">
        <CardTitle>Teammates table</CardTitle>
        <CardDescription>Sortable pro view for rating synergy quickly and opening detailed edits.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Games</TableHead>
              <TableHead>30d</TableHead>
              <TableHead>WR duo</TableHead>
              <TableHead>W-L</TableHead>
              <TableHead>KDA</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Quick rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teammates.length > 0 ? teammates.map((entry) => (
              <Fragment key={entry.puuid}>
                <FriendRow
                  entry={entry}
                  selected={selectedPuuid === entry.puuid}
                  onSelect={(puuid) => onSelect(selectedPuuid === puuid ? null : puuid)}
                  onRate={onRate}
                />
                {selectedPuuid === entry.puuid ? (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-[color-mix(in_oklch,var(--primary)_5%,var(--card))] p-0">
                      <div className="grid gap-3 px-4 py-3">
                        <div className="rounded-lg border border-border/70 bg-[color-mix(in_oklch,var(--card)_92%,var(--surface-2))] px-3 py-2.5">
                          <p className="text-sm font-semibold text-foreground">{entry.summonerName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {entry.matches} games together - {entry.winRateTogether}% WR - {entry.averageKdaTogether} KDA
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`friend-note-${entry.puuid}`} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Local note
                          </label>
                          <textarea
                            id={`friend-note-${entry.puuid}`}
                            value={notes[entry.puuid] ?? entry.note ?? ""}
                            onChange={(event) => onNoteChange(entry.puuid, event.target.value)}
                            placeholder="Add context on communication, role fit, and duo comfort."
                            className="min-h-28 w-full rounded-lg border border-border/75 bg-[color-mix(in_oklch,var(--card)_90%,var(--surface-2))] px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[color-mix(in_oklch,var(--primary)_38%,var(--border))] focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => onSave(entry)}
                            disabled={savingPuuid === entry.puuid}
                          >
                            {savingPuuid === entry.puuid ? "Saving..." : "Save note"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => onRevert(entry)}
                            disabled={savingPuuid === entry.puuid}
                          >
                            Revert draft
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            )) : (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                  No teammate data yet. Play a few games together to populate this table.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
