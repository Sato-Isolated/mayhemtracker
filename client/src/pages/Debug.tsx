import { AlertCircle, CheckCircle2, ChevronRight, Database, RefreshCcw, Server, ShieldCheck, Swords, TerminalSquare, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { EmptyState } from "@/components/features/empty-state";
import { PageIntro } from "@/components/features/page-intro";
import { StatusBadge } from "@/components/features/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, formatDuration } from "@/lib/tracker-utils";
import { cn } from "@/lib/utils";
import { useDiagnostics, useMatches, useStaticData } from "@/state/tracker-data";

type DebugRowId = "backend" | "auth" | "summoner" | "powershell" | "static" | "matches" | "payload";

function statusVariant(ok?: boolean, error?: string) {
  if (error) return "error" as const;
  if (ok) return "success" as const;
  return "outline" as const;
}

export function DebugPage() {
  const { status, auth, summoner, powerShell, testStatus, loadLeagueAuth, loadCurrentSummoner, runPowerShellTest } = useDiagnostics();
  const { staticSync, champions, items, augments, loadStaticLists, syncStaticData } = useStaticData();
  const { matches, matchDetail, selectedMatchId, loadMatches, loadMatchDetail, syncMatches, clearMatches } = useMatches();
  const [openRow, setOpenRow] = useState<DebugRowId>("backend");

  function toggleRow(row: DebugRowId) {
    setOpenRow((current) => current === row ? "backend" : row);
  }

  return (
    <div className="flex min-h-[calc(100vh-5.25rem)] flex-col gap-4">
      <PageIntro
        eyebrow="Internal tools"
        title="Debug"
        description="Local backend, League client, static data, and SQLite diagnostics."
        actions={(
          <>
            <StatusBadge>{matches.data?.total ?? 0} matches</StatusBadge>
            <StatusBadge tone="info">{champions.length + items.length + augments.length} static assets</StatusBadge>
          </>
        )}
      />

      <section className="rounded-md border border-border/70 bg-card/72" data-testid="debug-console">
        <div className="grid grid-cols-[minmax(10rem,1fr)_7rem_auto] gap-3 border-b border-border/60 px-3 py-2 text-[0.68rem] font-semibold uppercase text-muted-foreground max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:[&_.debug-status]:hidden">
          <span>Check</span>
          <span className="debug-status">Status</span>
          <span />
        </div>

        <DebugActionRow
          id="backend"
          open={openRow === "backend"}
          icon={<Server className="size-4 text-primary" />}
          title="Backend"
          subtitle="GET /api/status"
          status={<Badge variant={statusVariant(Boolean(status.data), status.error)}>{status.error ? "Error" : status.data ? "OK" : "Idle"}</Badge>}
          action={<Button variant="outline" size="sm" disabled={status.loading} onClick={() => { setOpenRow("backend"); void testStatus(); }}>{status.loading ? "Running..." : "Run"}</Button>}
          onToggle={() => toggleRow("backend")}
        >
          {status.data ? <InlineAlert ok title="Backend OK" description={status.data.message} /> : null}
          {status.error ? <InlineAlert title="Backend error" description={status.error} /> : null}
          {!status.data && !status.error ? <InlineHint text="Run this check to verify the local API server." /> : null}
        </DebugActionRow>

        <DebugActionRow
          id="auth"
          open={openRow === "auth"}
          icon={<ShieldCheck className="size-4 text-primary" />}
          title="League auth"
          subtitle="GET /api/league/auth"
          status={<Badge variant={statusVariant(Boolean(auth.data?.credentials), auth.error)}>{auth.error ? "Error" : auth.data?.credentials ? "OK" : "Idle"}</Badge>}
          action={<Button variant="outline" size="sm" disabled={auth.loading} onClick={() => { setOpenRow("auth"); void loadLeagueAuth(); }}>{auth.loading ? "Running..." : "Run"}</Button>}
          onToggle={() => toggleRow("auth")}
        >
          {auth.data?.credentials ? <InlineAlert ok title="League auth loaded" description={`${auth.data.credentials.address} - port ${auth.data.credentials.port}`} /> : null}
          {auth.error ? <InlineAlert title="League client unavailable" description={auth.error} /> : null}
          {!auth.data && !auth.error ? <InlineHint text="Run this check while the League client is open." /> : null}
        </DebugActionRow>

        <DebugActionRow
          id="summoner"
          open={openRow === "summoner"}
          icon={<ShieldCheck className="size-4 text-primary" />}
          title="Current summoner"
          subtitle="GET /api/league/summoner"
          status={<Badge variant={statusVariant(Boolean(summoner.data?.summoner), summoner.error)}>{summoner.error ? "Error" : summoner.data?.summoner ? "OK" : "Idle"}</Badge>}
          action={<Button variant="outline" size="sm" disabled={summoner.loading} onClick={() => { setOpenRow("summoner"); void loadCurrentSummoner(); }}>{summoner.loading ? "Running..." : "Run"}</Button>}
          onToggle={() => toggleRow("summoner")}
        >
          {summoner.data?.summoner ? <InlineAlert ok title={summoner.data.summoner.displayName} description={`Level ${summoner.data.summoner.summonerLevel ?? "-"} - PUUID ${summoner.data.summoner.puuid ?? "-"}`} /> : null}
          {summoner.error ? <InlineAlert title="Summoner error" description={summoner.error} /> : null}
          {!summoner.data && !summoner.error ? <InlineHint text="Run this check after League auth succeeds." /> : null}
        </DebugActionRow>

        <DebugActionRow
          id="powershell"
          open={openRow === "powershell"}
          icon={<TerminalSquare className="size-4 text-primary" />}
          title="PowerShell"
          subtitle="GET /api/system/powershell-test"
          status={<Badge variant={statusVariant(powerShell.data?.ok, powerShell.data && !powerShell.data.ok ? powerShell.data.stderr : powerShell.error)}>{powerShell.data?.ok ? "OK" : powerShell.data || powerShell.error ? "Error" : "Idle"}</Badge>}
          action={<Button variant="outline" size="sm" disabled={powerShell.loading} onClick={() => { setOpenRow("powershell"); void runPowerShellTest(); }}>{powerShell.loading ? "Running..." : "Run"}</Button>}
          onToggle={() => toggleRow("powershell")}
        >
          {powerShell.data ? <InlineAlert ok={powerShell.data.ok} title={`PowerShell ${powerShell.data.ok ? "OK" : "error"}`} description={`Exit code: ${String(powerShell.data.exitCode)}${powerShell.data.stderr ? ` - ${powerShell.data.stderr}` : ""}`} /> : null}
          {powerShell.error ? <InlineAlert title="PowerShell error" description={powerShell.error} /> : null}
          {!powerShell.data && !powerShell.error ? <InlineHint text="Run this check to verify shell access from the local backend." /> : null}
        </DebugActionRow>

        <DebugActionRow
          id="static"
          open={openRow === "static"}
          icon={<Database className="size-4 text-primary" />}
          title="Static data"
          subtitle="Champions, items, and augments cache"
          status={<Badge variant="outline">{champions.length + items.length + augments.length} assets</Badge>}
          action={(
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" onClick={() => { setOpenRow("static"); void syncStaticData(); }}><Database className="size-4" />Sync</Button>
              <Button size="sm" variant="outline" onClick={() => { setOpenRow("static"); void loadStaticLists(); }}><RefreshCcw className="size-4" />Reload</Button>
            </div>
          )}
          onToggle={() => toggleRow("static")}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <InlineMetric label="Champions" value={`${champions.length}`} />
            <InlineMetric label="Items" value={`${items.length}`} />
            <InlineMetric label="Augments" value={`${augments.length}`} />
          </div>
          {staticSync.data ? <InlineAlert ok title="Sync complete" description={`Version ${staticSync.data.result.version} - ${staticSync.data.result.reused ? "cache reused" : "full refresh"}`} /> : null}
        </DebugActionRow>

        <DebugActionRow
          id="matches"
          open={openRow === "matches"}
          icon={<Swords className="size-4 text-primary" />}
          title="Match storage"
          subtitle="Sync, reload, inspect, or clear SQLite matches"
          status={<Badge variant="outline">{matches.data?.total ?? 0} stored</Badge>}
          action={(
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" onClick={() => { setOpenRow("matches"); void syncMatches(); }}><Swords className="size-4" />Sync</Button>
              <Button size="sm" variant="outline" onClick={() => { setOpenRow("matches"); void loadMatches(); }}><RefreshCcw className="size-4" />Reload</Button>
              <Button size="sm" variant="ghost" onClick={() => { setOpenRow("matches"); void clearMatches(); }}><Trash2 className="size-4" />Clear</Button>
            </div>
          )}
          onToggle={() => toggleRow("matches")}
        >
          {matches.data?.items.length ? (
            <div className="divide-y divide-border/55 rounded-md border border-border/60 bg-[color-mix(in_oklch,var(--background)_54%,var(--card))]">
              {matches.data.items.slice(0, 8).map((match) => (
                <div key={match.matchId} className="grid grid-cols-[minmax(0,1fr)_5.6rem_5.2rem_auto] items-center gap-3 px-3 py-2.5 max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:[&_.match-debug-meta]:hidden">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{match.summary}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(match.gameCreation ?? match.retrievedAt)}</div>
                  </div>
                  <div className="match-debug-meta text-sm text-muted-foreground">{match.gameMode ?? "League"}</div>
                  <div className="match-debug-meta text-sm text-muted-foreground">{formatDuration(match.gameDuration)}</div>
                  <Button variant={selectedMatchId === match.matchId ? "default" : "outline"} size="sm" onClick={() => { setOpenRow("payload"); void loadMatchDetail(match.matchId); }}>Inspect</Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No matches stored locally" description="Run match sync to populate SQLite." className="min-h-44 border-0" />
          )}
        </DebugActionRow>

        <DebugActionRow
          id="payload"
          open={openRow === "payload"}
          icon={<AlertCircle className="size-4 text-primary" />}
          title="Selected match payload"
          subtitle="Raw payload for the inspected match"
          status={<Badge variant={matchDetail.data ? "success" : "outline"}>{matchDetail.data ? "Loaded" : "Idle"}</Badge>}
          action={null}
          onToggle={() => toggleRow("payload")}
        >
          {matchDetail.data ? (
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge>{matchDetail.data.gameMode ?? "League"}</Badge>
                <Badge variant="outline">Queue {matchDetail.data.queueId ?? "-"}</Badge>
                <Badge variant="outline">Version {matchDetail.data.gameVersion ?? "-"}</Badge>
                <Badge variant="outline">{matchDetail.data.participants.length} players</Badge>
              </div>
              <ScrollArea className="h-[340px] rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_62%,var(--card))] p-4">
                <pre className="text-xs text-foreground">{JSON.stringify(matchDetail.data.rawPayload, null, 2)}</pre>
              </ScrollArea>
            </div>
          ) : (
            <EmptyState title="No match selected" description="Inspect a match from storage to view payload metadata." className="min-h-44 border-0" />
          )}
        </DebugActionRow>
      </section>
    </div>
  );
}

function DebugActionRow({
  id,
  icon,
  title,
  subtitle,
  status,
  action,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  status: ReactNode;
  action: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-border/55 last:border-b-0">
      <div
        className={cn(
          "grid grid-cols-[minmax(10rem,1fr)_7rem_auto] items-center gap-3 px-3 py-2.5 transition-colors max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:[&_.debug-status]:hidden",
          open && "bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))] shadow-[inset_3px_0_0_var(--primary)]",
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`debug-inline-${id}`}
          className="flex min-w-0 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onToggle}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-[color-mix(in_oklch,var(--background)_68%,var(--card))]">{icon}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>
          </span>
        </button>
        <div className="debug-status">{status}</div>
        <div className="flex items-center justify-end gap-2">
          {action}
          <button type="button" className="rounded-md p-1 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onToggle} aria-label={`Toggle ${title}`}>
            <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90 text-primary")} />
          </button>
        </div>
      </div>
      <div className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {open ? <div id={`debug-inline-${id}`} className="grid gap-3 border-t border-border/60 bg-card/75 p-3">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-[color-mix(in_oklch,var(--background)_62%,var(--card))] px-3 py-2">
      <div className="text-[0.68rem] font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function InlineAlert({ ok = false, title, description }: { ok?: boolean; title: string; description: string }) {
  return (
    <Alert variant={ok ? "default" : "destructive"}>
      {ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

function InlineHint({ text }: { text: string }) {
  return <p className="rounded-md border border-border/60 bg-[color-mix(in_oklch,var(--background)_62%,var(--card))] px-3 py-2 text-sm text-muted-foreground">{text}</p>;
}
