import { Link } from "react-router-dom";
import { RecentMatchItem } from "@/components/features/recent-match-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChampionVisual } from "@/lib/tracker-utils";
import type { MatchSpotlight, StaticDataEntry } from "@/lib/types";

interface RecentMatchesListProps {
  matches: MatchSpotlight[];
  champions: StaticDataEntry[];
}

export function RecentMatchesList({ matches, champions }: RecentMatchesListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Matches</CardTitle>
            <CardDescription>Last played games</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/history">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {matches.length > 0 ? (
          matches.map((entry) => {
            const visual = getChampionVisual(entry.participant, champions);
            return (
              <RecentMatchItem
                key={entry.match.matchId}
                match={entry.match}
                participant={entry.participant}
                championIcon={visual.icon}
                championName={visual.name}
              />
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
            No tracked matches yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
