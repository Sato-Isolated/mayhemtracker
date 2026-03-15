import {
  AlertCircle,
  CheckCircle2,
  Database,
  RefreshCcw,
  Server,
  ShieldCheck,
  Swords,
  TerminalSquare,
} from "lucide-react";
import { AugmentIcon } from "@/components/features/augment-icon";
import { DashboardCard } from "@/components/features/dashboard-card";
import { ItemIcon } from "@/components/features/item-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatDuration, getChampionVisual } from "@/lib/tracker-utils";
import { useTrackerAppData, useTrackerMatchData } from "@/state/tracker-data";

export function DebugPage() {
  const {
    status,
    auth,
    summoner,
    powerShell,
    staticSync,
    champions,
    items,
    augments,
    loadStaticLists,
    testStatus,
    loadLeagueAuth,
    loadCurrentSummoner,
    runPowerShellTest,
    syncStaticData,
  } = useTrackerAppData();
  const {
    matches,
    matchDetail,
    selectedMatchId,
    loadMatches,
    loadMatchDetail,
    syncMatches,
    clearMatches,
  } = useTrackerMatchData();

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-5 md:grid-cols-2">
          <DashboardCard
            title="Backend Status"
            description="Valide que le backend Express local répond via le proxy Vite."
            badge="GET /api/status"
            loading={status.loading}
          >
            <Button onClick={() => void testStatus()}>Tester le backend</Button>
            {status.data ? (
              <Alert>
                <CheckCircle2 className="result-win mb-2 h-4 w-4" />
                <AlertTitle>Backend OK</AlertTitle>
                <AlertDescription>{status.data.message}</AlertDescription>
              </Alert>
            ) : null}
            {status.error ? (
              <Alert variant="destructive">
                <AlertCircle className="mb-2 h-4 w-4" />
                <AlertTitle>Erreur backend</AlertTitle>
                <AlertDescription>{status.error}</AlertDescription>
              </Alert>
            ) : null}
          </DashboardCard>

          <DashboardCard
            title="League Auth"
            description="Teste `authenticate()` côté Node pour récupérer les credentials LCU utiles."
            badge="GET /api/league/auth"
            loading={auth.loading}
          >
            <Button variant="secondary" onClick={() => void loadLeagueAuth()}>
              Récupérer l'auth League
            </Button>
            {auth.data?.credentials ? (
              <div className="space-y-2 rounded-2xl border bg-card/70 p-4 text-sm">
                <p><strong>Adresse:</strong> {auth.data.credentials.address}</p>
                <p><strong>Port:</strong> {auth.data.credentials.port}</p>
                <p><strong>Auth:</strong> {auth.data.credentials.authorizationHeader}</p>
              </div>
            ) : null}
            {auth.error ? (
              <Alert variant="destructive">
                <AlertTitle>League client indisponible</AlertTitle>
                <AlertDescription>{auth.error}</AlertDescription>
              </Alert>
            ) : null}
          </DashboardCard>

          <DashboardCard
            title="Current Summoner"
            description="Lit le current summoner via l'API locale du client League."
            badge="GET /api/league/summoner"
            loading={summoner.loading}
          >
            <Button variant="secondary" onClick={() => void loadCurrentSummoner()}>
              Charger le summoner
            </Button>
            {summoner.data?.summoner ? (
              <div className="rounded-2xl border bg-card/70 p-4 text-sm">
                <p className="text-base font-semibold">{summoner.data.summoner.displayName}</p>
                <p className="text-muted-foreground">
                  {summoner.data.summoner.gameName ?? "-"}
                  {summoner.data.summoner.tagLine ? ` #${summoner.data.summoner.tagLine}` : ""}
                </p>
                <p className="mt-2">Level: {summoner.data.summoner.summonerLevel ?? "-"}</p>
                <p>PUUID: {summoner.data.summoner.puuid ?? "-"}</p>
              </div>
            ) : null}
            {summoner.error ? (
              <Alert variant="destructive">
                <AlertTitle>Impossible de lire le summoner</AlertTitle>
                <AlertDescription>{summoner.error}</AlertDescription>
              </Alert>
            ) : null}
          </DashboardCard>

          <DashboardCard
            title="PowerShell Test"
            description="Exécute une commande PowerShell locale pour vérifier le process LeagueClientUx."
            badge="GET /api/system/powershell-test"
            loading={powerShell.loading}
          >
            <Button variant="secondary" onClick={() => void runPowerShellTest()}>
              Lancer le test PowerShell
            </Button>
            {powerShell.data ? (
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={powerShell.data.ok ? "success" : "error"}>{powerShell.data.ok ? "Success" : "Error"}</Badge>
                  <span className="text-sm text-muted-foreground">Exit code: {String(powerShell.data.exitCode)}</span>
                </div>
                <pre className="code-surface overflow-x-auto rounded-2xl p-4 text-xs">{powerShell.data.stdout || "(no stdout)"}</pre>
                <pre className="code-surface-error overflow-x-auto rounded-2xl p-4 text-xs">{powerShell.data.stderr || "(no stderr)"}</pre>
              </div>
            ) : null}
          </DashboardCard>
        </div>

        <DashboardCard
          title="Static Data"
          description="Synchronise champions, items et augments depuis Data Dragon et CommunityDragon, puis recharge le cache local."
          badge="POST /api/static-data/sync"
          loading={staticSync.loading}
        >
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void syncStaticData()}>
              <Database className="h-4 w-4" />
              Sync static data
            </Button>
            <Button variant="outline" onClick={() => void loadStaticLists()}>
              <RefreshCcw className="h-4 w-4" />
              Recharger le cache UI
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="bg-card/70">
              <CardHeader className="pb-3">
                <CardDescription>Champions</CardDescription>
                <CardTitle>{champions.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-card/70">
              <CardHeader className="pb-3">
                <CardDescription>Items</CardDescription>
                <CardTitle>{items.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-card/70">
              <CardHeader className="pb-3">
                <CardDescription>Augments</CardDescription>
                <CardTitle>{augments.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          {staticSync.data ? (
            <Alert>
              <AlertTitle>Sync terminée</AlertTitle>
              <AlertDescription>
                Version {staticSync.data.result.version} · {staticSync.data.result.champions} champions · {staticSync.data.result.items} items · {staticSync.data.result.augments} augments · {staticSync.data.result.reused ? "cache réutilisé" : "mise à jour complète"}
              </AlertDescription>
            </Alert>
          ) : null}
        </DashboardCard>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardCard
          title="Match Sync"
          description="Récupère l'historique via le client League local, enrichit les données et persiste dans SQLite."
          badge="POST /api/matches/sync-current"
          className="xl:col-span-2"
        >
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void syncMatches()}>
              <Swords className="h-4 w-4" />
              Sync matches
            </Button>
            <Button variant="outline" onClick={() => void loadMatches()}>
              <RefreshCcw className="h-4 w-4" />
              Recharger la liste
            </Button>
            <Button variant="ghost" onClick={() => void clearMatches()}>
              Vider le stockage local
            </Button>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Match List"
          description="Liste paginée locale, triée du plus récent au plus ancien."
          badge="GET /api/matches"
          loading={matches.loading}
        >
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total local: {matches.data?.total ?? 0}</span>
            <span>Storage: SQLite persistant</span>
          </div>
          <ScrollArea className="h-[440px] rounded-2xl border bg-card/70 p-2">
            <div className="space-y-2">
              {matches.data?.items.length ? (
                matches.data.items.map((match) => (
                  <button
                    key={match.matchId}
                    type="button"
                    onClick={() => void loadMatchDetail(match.matchId)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedMatchId === match.matchId ? "border-primary bg-primary/8" : "surface-subtle hover:bg-accent/30"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{match.summary}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(match.gameCreation ?? match.retrievedAt)} · {formatDuration(match.gameDuration)}{match.gameModeMutators.length ? ` · ${match.gameModeMutators.join(", ")}` : ""}</div>
                      </div>
                      <Badge variant="outline">{match.gameMode ?? "League"}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.participants.slice(0, 5).map((participant, index) => {
                        const visual = getChampionVisual(participant, champions);
                        return (
                          <div key={`${match.matchId}-${participant.puuid ?? index}`} className="flex items-center gap-2 rounded-full bg-secondary/70 px-2 py-1 text-xs">
                            {visual.icon ? <img src={visual.icon} alt={visual.name} className="h-6 w-6 rounded-full object-cover" /> : null}
                            <span>{visual.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Aucun match stocké localement.
                </div>
              )}
            </div>
          </ScrollArea>
        </DashboardCard>

        <DashboardCard
          title="Match Detail"
          description="Participants, items, augments et payload brut pour debug."
          badge="GET /api/matches/:matchId"
          loading={matchDetail.loading}
        >
          {matchDetail.data ? (
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="teams">Teams</TabsTrigger>
                <TabsTrigger value="debug">Debug JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{matchDetail.data.gameMode ?? "League"}</Badge>
                    <Badge variant="outline">Queue {matchDetail.data.queueId ?? "-"}</Badge>
                    <Badge variant="outline">Map {matchDetail.data.mapId ?? "-"}</Badge>
                    <Badge variant="outline">Version {matchDetail.data.gameVersion ?? "-"}</Badge>
                    <Badge variant="outline">{formatDate(matchDetail.data.gameCreation)}</Badge>
                    {matchDetail.data.gameModeMutators.map((mutator) => <Badge key={mutator} variant="secondary">{mutator}</Badge>)}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Champion</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>KDA</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Augments</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matchDetail.data.participants.map((participant, index) => {
                        const visual = getChampionVisual(participant, champions);
                        return (
                          <TableRow key={`${participant.puuid ?? index}-${participant.championId ?? index}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {visual.icon ? <img src={visual.icon} alt={visual.name} className="h-10 w-10 rounded-xl object-cover" /> : null}
                                <div>
                                  <div className="font-medium">{visual.name}</div>
                                  <div className="text-xs text-muted-foreground">#{participant.championId ?? "-"}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{participant.summonerName ?? participant.puuid ?? "Unknown"}</TableCell>
                            <TableCell>{participant.kills ?? 0}/{participant.deaths ?? 0}/{participant.assists ?? 0}</TableCell>
                            <TableCell>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div>DMG {participant.totalDamageDealt ?? 0}</div>
                                <div>Taken {participant.totalDamageTaken ?? 0}</div>
                                <div>Gold {participant.goldEarned ?? 0} · CS {participant.totalCs ?? 0} · Lv {participant.championLevel ?? "-"}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1.5">
                                {participant.items.length ? participant.items.map((itemId) => <ItemIcon key={itemId} itemId={itemId} items={items} size={22} />) : "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1.5">
                                {participant.augments.length ? participant.augments.map((augmentId) => <AugmentIcon key={augmentId} augmentId={augmentId} augments={augments} size={22} />) : "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={participant.win ? "success" : "error"}>{participant.win ? "Win" : "Loss"}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="teams">
                <div className="grid gap-3 md:grid-cols-2">
                  {matchDetail.data.teams.map((team) => (
                    <Card key={team.teamId} className="bg-card/70">
                      <CardHeader>
                        <CardTitle>Team {team.teamId}</CardTitle>
                        <CardDescription>{team.win ? "Victory" : "Defeat or unknown"}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <pre className="overflow-x-auto rounded-2xl bg-[#211d17] p-4 text-xs text-amber-50">{JSON.stringify(team.objectives, null, 2)}</pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="debug">
                <pre className="max-h-[420px] overflow-auto rounded-2xl bg-[#1f1d25] p-4 text-xs text-slate-100">{JSON.stringify(matchDetail.data.rawPayload, null, 2)}</pre>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Sélectionne un match pour afficher le détail.
            </div>
          )}
        </DashboardCard>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Backend Contract</CardTitle>
            <CardDescription>Résumé des endpoints locaux exposés par le backend Node.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><Server className="h-4 w-4" /> GET /api/status</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> GET /api/league/auth</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> GET /api/league/summoner</div>
            <div className="flex items-center gap-2"><TerminalSquare className="h-4 w-4" /> GET /api/system/powershell-test</div>
            <div className="flex items-center gap-2"><Database className="h-4 w-4" /> POST /api/static-data/sync</div>
            <div className="flex items-center gap-2"><Swords className="h-4 w-4" /> POST /api/matches/sync-current</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Panels</CardTitle>
            <CardDescription>Exposition rapide des payloads pour itérer sur les intégrations locales.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Ouvrir le debug JSON</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Debug Snapshot</DialogTitle>
                  <DialogDescription>État local courant des réponses backend affichées dans l’interface.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[420px] rounded-2xl border p-4">
                  <pre className="text-xs text-foreground">{JSON.stringify({ status, auth, summoner, powerShell, staticSync, matches, matchDetail }, null, 2)}</pre>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}