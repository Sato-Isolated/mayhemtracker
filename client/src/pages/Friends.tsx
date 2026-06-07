import { ArrowDownUp, RotateCcw, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FriendsList } from "@/components/features/friends/friends-list";
import { PageIntro } from "@/components/features/page-intro";
import { StatusBadge } from "@/components/features/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { MatchListItem, TeammateStats } from "@/lib/types";
import { useAnalytics, useStaticData } from "@/state/tracker-data";

type FriendSortKey = "matches" | "recentMatchesTogether" | "winRateTogether" | "averageKdaTogether" | "lastSeenAt" | "rating" | "summonerName";

export function FriendsPage() {
  const { dashboard, teammates, updatePlayerRating, loadDashboard, loadTeammates } = useAnalytics();
  const { champions, loadStaticLists } = useStaticData();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [minimumMatches, setMinimumMatches] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<"all" | "rated" | "unrated">("all");
  const [sortKey, setSortKey] = useState<FriendSortKey>("matches");
  const [descending, setDescending] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedPuuid, setSelectedPuuid] = useState<string | null>(null);
  const [savingPuuid, setSavingPuuid] = useState<string | null>(null);
  const [storedMatches, setStoredMatches] = useState<MatchListItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | undefined>();

  useEffect(() => {
    if (!teammates.data && !teammates.loading) {
      void loadTeammates();
    }
    if (!dashboard.data && !dashboard.loading) {
      void loadDashboard();
    }
    if (!champions.length) {
      void loadStaticLists();
    }
  }, [champions.length, dashboard.data, dashboard.loading, loadDashboard, loadStaticLists, loadTeammates, teammates.data, teammates.loading]);

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
    if (!filtered.length || (selectedPuuid && !filtered.some((entry) => entry.puuid === selectedPuuid))) {
      setSelectedPuuid(null);
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

  async function handleSelect(puuid: string | null) {
    setSelectedPuuid(puuid);
    if (!puuid || storedMatches.length || matchesLoading) {
      return;
    }

    setMatchesLoading(true);
    setMatchesError(undefined);
    try {
      setStoredMatches(await loadAllStoredMatches());
    } catch (error) {
      setMatchesError(error instanceof Error ? error.message : "Unable to load teammate matches.");
    } finally {
      setMatchesLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5.25rem)] flex-col gap-4">
      <PageIntro
        eyebrow="Teammates"
        title="Friends"
        description="Frequent teammates, local ratings, and short notes."
        actions={(
          <>
            <StatusBadge>{filtered.length} teammates</StatusBadge>
            <StatusBadge tone="info">{ratedCount} rated</StatusBadge>
          </>
        )}
      />

      <section className="rounded-md border border-border/70 bg-card/72" data-testid="friends-card">
        <div className="grid gap-2 border-b border-border/60 p-2 min-[980px]:grid-cols-[minmax(15rem,1fr)_auto]">
          <div className="relative min-w-0">
            <label htmlFor="friends-search" className="sr-only">Search teammate</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="friends-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teammate"
              className="h-9 w-full rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_78%,var(--card))] pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={minimumMatches}
              onChange={(event) => setMinimumMatches(Number(event.target.value))}
              className="h-9 rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_78%,var(--card))] px-3 text-sm text-foreground outline-none"
            >
              <option value={1}>1+ games</option>
              <option value={3}>3+ games</option>
              <option value={5}>5+ games</option>
              <option value={10}>10+ games</option>
            </select>
            <select
              value={ratingFilter}
              onChange={(event) => setRatingFilter(event.target.value as "all" | "rated" | "unrated")}
              className="h-9 rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_78%,var(--card))] px-3 text-sm text-foreground outline-none"
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
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
          <Badge variant="outline">Tracked: {filtered.length}</Badge>
          <Badge variant="outline">Rated: {ratedCount}</Badge>
          <Badge variant="secondary">Top ally: {topAlly?.summonerName ?? "-"}</Badge>
          <Badge variant="outline">{descending ? "Descending" : "Ascending"}</Badge>
        </div>

        <FriendsList
          teammates={filtered}
          selectedPuuid={selectedPuuid}
          notes={notes}
          savingPuuid={savingPuuid}
          matches={storedMatches}
          trackedPuuid={dashboard.data?.overview.trackedPlayerPuuid}
          champions={champions}
          matchesLoading={matchesLoading}
          matchesError={matchesError}
          onSelect={(puuid) => void handleSelect(puuid)}
          onNoteChange={(puuid, value) => setNotes((current) => ({ ...current, [puuid]: value }))}
          onSave={(entry) => void handleSaveNote(entry)}
          onRevert={(entry) => setNotes((current) => ({ ...current, [entry.puuid]: entry.note ?? "" }))}
          onRate={(entry, value) => void handleRate(entry, value)}
        />
      </section>
    </div>
  );
}

async function loadAllStoredMatches() {
  const pageSize = 100;
  const firstPage = await api.getMatches(1, pageSize);
  const totalPages = Math.max(Math.ceil(firstPage.total / pageSize), 1);
  const rest = [];

  for (let page = 2; page <= totalPages; page += 1) {
    rest.push(api.getMatches(page, pageSize));
  }

  const pages = await Promise.all(rest);
  return [firstPage, ...pages].flatMap((page) => page.items);
}
