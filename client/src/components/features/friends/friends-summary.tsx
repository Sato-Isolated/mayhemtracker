import type { TeammateStats } from "@/lib/types";
import { MetricTile } from "@/components/features/metric-tile";

interface FriendsSummaryProps {
  teammates: TeammateStats[];
}

export function FriendsSummary({ teammates }: FriendsSummaryProps) {
  const ratedCount = teammates.filter((entry) => typeof entry.rating === "number").length;
  const mostPlayed = teammates[0];
  const activeLast30d = teammates.filter((entry) => entry.recentMatchesTogether > 0).length;
  const bestWinRate = [...teammates]
    .filter((entry) => entry.matches >= 3)
    .sort((left, right) => right.winRateTogether - left.winRateTogether)[0];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Friends summary">
      <MetricTile
        label="Tracked teammates"
        value={teammates.length}
        hint="Coequipiers detectes dans l'historique local."
      />
      <MetricTile
        label="Rated players"
        value={ratedCount}
        hint="Joueurs ayant deja une evaluation enregistree."
      />
      <MetricTile
        label="Most played ally"
        value={mostPlayed?.summonerName ?? "-"}
        hint={`${mostPlayed?.matches ?? 0} games ensemble`}
      />
      <MetricTile
        label="Active in 30d"
        value={activeLast30d}
        hint="Allies vus au moins une fois sur les 30 derniers jours."
      />
      <MetricTile
        label="Best duo WR (min 3)"
        value={bestWinRate?.summonerName ?? "-"}
        hint={bestWinRate ? `${bestWinRate.winRateTogether}% WR` : "Pas assez de volume"}
        className="sm:col-span-2 xl:col-span-2"
      />
    </section>
  );
}
