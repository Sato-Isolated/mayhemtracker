import type { TeammateStats } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

interface FriendRowProps {
  entry: TeammateStats;
  selected: boolean;
  onSelect: (puuid: string) => void;
  onRate: (entry: TeammateStats, value: number) => void;
}

export function FriendRow({ entry, selected, onSelect, onRate }: FriendRowProps) {
  return (
    <TableRow
      className={selected ? "bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))]" : undefined}
      onClick={() => onSelect(entry.puuid)}
    >
      <TableCell>
        <button
          type="button"
          className="rounded text-left font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(entry.puuid);
          }}
        >
          {entry.summonerName}
        </button>
      </TableCell>
      <TableCell>{entry.matches}</TableCell>
      <TableCell>{entry.recentMatchesTogether}</TableCell>
      <TableCell><Badge variant="outline">{entry.winRateTogether}%</Badge></TableCell>
      <TableCell>{entry.winsTogether}-{entry.lossesTogether}</TableCell>
      <TableCell>{entry.averageKdaTogether}</TableCell>
      <TableCell>{entry.lastSeenAt ? new Date(entry.lastSeenAt).toLocaleDateString("fr-FR") : "-"}</TableCell>
      <TableCell>{entry.rating ? <Badge variant="default">{entry.rating}/5</Badge> : <Badge variant="outline">-</Badge>}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={entry.rating === value ? "default" : "outline"}
              className="h-7 w-7 px-0 text-xs"
              onClick={(event) => {
                event.stopPropagation();
                onRate(entry, value);
              }}
              aria-label={`Set rating ${value} for ${entry.summonerName}`}
            >
              {value}
            </Button>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}
