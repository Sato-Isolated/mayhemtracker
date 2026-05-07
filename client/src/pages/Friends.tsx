import { ArrowDownUp, RotateCcw, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FriendsList } from "@/components/features/friends/friends-list";
import { FriendsSummary } from "@/components/features/friends/friends-summary";
import { PageIntro } from "@/components/features/page-intro";
import { PageSection } from "@/components/features/page-section";
import { PageToolbar } from "@/components/features/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TeammateStats } from "@/lib/types";
import { useAnalytics } from "@/state/tracker-data";

type FriendSortKey = "matches" | "recentMatchesTogether" | "winRateTogether" | "averageKdaTogether" | "lastSeenAt" | "rating" | "summonerName";

export function FriendsPage() {
  const { teammates, updatePlayerRating, loadTeammates } = useAnalytics();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [minimumMatches, setMinimumMatches] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<"all" | "rated" | "unrated">("all");
  const [sortKey, setSortKey] = useState<FriendSortKey>("matches");
  const [descending, setDescending] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedPuuid, setSelectedPuuid] = useState<string | null>(null);
  const [savingPuuid, setSavingPuuid] = useState<string | null>(null);

  useEffect(() => {
    if (!teammates.data && !teammates.loading) {
      void loadTeammates();
    }
  }, [loadTeammates, teammates.data, teammates.loading]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const rows = [...(teammates.data ?? [])]
      .filter((entry) => {
        if (entry.matches < minimumMatches) {
          return false;
        }
        if (ratingFilter === "rated" && typeof entry.rating !== "number") {
          return false;
        }
        if (ratingFilter === "unrated" && typeof entry.rating === "number") {
          return false;
        }
        if (!query) {
          return true;
        }
        return entry.summonerName.toLowerCase().includes(query);
      });

    return rows.sort((left, right) => {
      const leftValue = left[sortKey] ?? 0;
      const rightValue = right[sortKey] ?? 0;
      const result = typeof leftValue === "string"
        ? leftValue.localeCompare(String(rightValue))
        : Number(leftValue) - Number(rightValue);
      return descending ? result * -1 : result;
    });
  }, [deferredSearch, descending, minimumMatches, ratingFilter, sortKey, teammates.data]);

  const ratedCount = filtered.filter((entry) => typeof entry.rating === "number").length;
  const topAlly = filtered[0];
  useEffect(() => {
    if (!filtered.length) {
      setSelectedPuuid(null);
      return;
    }
    if (!selectedPuuid || !filtered.some((entry) => entry.puuid === selectedPuuid)) {
      setSelectedPuuid(filtered[0].puuid);
    }
  }, [filtered, selectedPuuid]);

  function toggleSort(nextKey: FriendSortKey) {
    if (sortKey === nextKey) {
      setDescending((current) => !current);
      return;
    }
    setSortKey(nextKey);
    setDescending(nextKey !== "summonerName");
  }

  async function handleRate(entry: TeammateStats, value: number) {
    setSavingPuuid(entry.puuid);
    try {
      await updatePlayerRating(entry.puuid, entry.summonerName, value, notes[entry.puuid] ?? entry.note);
    } finally {
      setSavingPuuid(null);
    }
  }

  async function handleSaveNote(entry: TeammateStats) {
    setSavingPuuid(entry.puuid);
    try {
      await updatePlayerRating(entry.puuid, entry.summonerName, entry.rating, notes[entry.puuid] ?? entry.note);
    } finally {
      setSavingPuuid(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Teammates"
        title="Friends board"
        description="Local board of frequent teammates for rating synergy and keeping actionable notes."
        actions={(
          <>
            <Badge variant="outline">{filtered.length} teammates</Badge>
            <Badge variant="secondary">{ratedCount} notes</Badge>
          </>
        )}
      />

      <PageToolbar
        testId="friends-toolbar"
        meta={(
          <>
            <Badge variant="outline">Tracked: {filtered.length}</Badge>
            <Badge variant="outline">Rated: {ratedCount}</Badge>
            <Badge variant="secondary">Top ally: {topAlly?.summonerName ?? "-"}</Badge>
            <Badge variant="outline">{descending ? "Descending" : "Ascending"}</Badge>
          </>
        )}
        search={(
          <div className="relative">
            <label htmlFor="friends-search" className="sr-only">Search teammate</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="friends-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teammate"
              className="dense-input w-full rounded-xl border border-border bg-[color-mix(in_oklch,var(--card)_78%,var(--surface-2))] py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-offset-2 placeholder:text-muted-foreground focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}
        filters={(
          <>
            <select
              value={minimumMatches}
              onChange={(event) => setMinimumMatches(Number(event.target.value))}
              className="h-9 rounded-lg border border-border bg-[color-mix(in_oklch,var(--card)_78%,var(--surface-2))] px-3 text-sm text-foreground outline-none"
            >
              <option value={1}>1+ games</option>
              <option value={3}>3+ games</option>
              <option value={5}>5+ games</option>
              <option value={10}>10+ games</option>
            </select>
            <select
              value={ratingFilter}
              onChange={(event) => setRatingFilter(event.target.value as "all" | "rated" | "unrated")}
              className="h-9 rounded-lg border border-border bg-[color-mix(in_oklch,var(--card)_78%,var(--surface-2))] px-3 text-sm text-foreground outline-none"
            >
              <option value="all">All ratings</option>
              <option value="rated">Rated only</option>
              <option value="unrated">Unrated only</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => toggleSort("matches")}><ArrowDownUp className="h-4 w-4" /> Games</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("winRateTogether")}><ArrowDownUp className="h-4 w-4" /> WR</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("averageKdaTogether")}><ArrowDownUp className="h-4 w-4" /> KDA</Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort("lastSeenAt")}><ArrowDownUp className="h-4 w-4" /> Last seen</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setMinimumMatches(1);
                setRatingFilter("all");
                setSortKey("matches");
                setDescending(true);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </>
        )}
      />

      <PageSection
        title="Overview"
        description="Compact view of the main signals before a detailed review."
        className="space-y-4"
      >
        <FriendsSummary teammates={filtered} />
      </PageSection>

      <FriendsList
        teammates={filtered}
        selectedPuuid={selectedPuuid}
        notes={notes}
        savingPuuid={savingPuuid}
        onSelect={setSelectedPuuid}
        onNoteChange={(puuid, value) => setNotes((current) => ({ ...current, [puuid]: value }))}
        onSave={(entry) => void handleSaveNote(entry)}
        onRevert={(entry) => setNotes((current) => ({ ...current, [entry.puuid]: entry.note ?? "" }))}
        onRate={(entry, value) => void handleRate(entry, value)}
      />
    </div>
  );
}
