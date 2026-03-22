import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appMetadata = sqliteTable("app_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const matches = sqliteTable("matches", {
  matchId: text("match_id").primaryKey(),
  queueId: integer("queue_id"),
  gameMode: text("game_mode"),
  gameVersion: text("game_version"),
  gameModeMutatorsJson: text("game_mode_mutators_json").notNull(),
  mapId: integer("map_id"),
  gameCreation: integer("game_creation"),
  gameStartTimestamp: integer("game_start_timestamp"),
  gameEndTimestamp: integer("game_end_timestamp"),
  gameDuration: integer("game_duration"),
  retrievedAt: integer("retrieved_at").notNull(),
  summary: text("summary").notNull(),
  rawPayload: text("raw_payload").notNull(),
}, (table) => [
  index("idx_matches_retrieved_at").on(table.retrievedAt),
]);

export const matchParticipants = sqliteTable("match_participants", {
  matchId: text("match_id").notNull().references(() => matches.matchId, { onDelete: "cascade" }),
  participantIndex: integer("participant_index").notNull(),
  participantId: integer("participant_id"),
  puuid: text("puuid"),
  riotIdGameName: text("riot_id_game_name"),
  riotIdTagline: text("riot_id_tagline"),
  summonerName: text("summoner_name"),
  teamId: integer("team_id"),
  championId: integer("champion_id"),
  championName: text("champion_name"),
  spell1Id: integer("spell1_id"),
  spell2Id: integer("spell2_id"),
  kills: integer("kills"),
  deaths: integer("deaths"),
  assists: integer("assists"),
  doubleKills: integer("double_kills"),
  tripleKills: integer("triple_kills"),
  quadraKills: integer("quadra_kills"),
  pentaKills: integer("penta_kills"),
  totalDamageDealt: integer("total_damage_dealt"),
  totalDamageTaken: integer("total_damage_taken"),
  goldEarned: integer("gold_earned"),
  totalHeal: integer("total_heal"),
  totalCs: integer("total_cs"),
  championLevel: integer("champion_level"),
  visionScore: integer("vision_score"),
  timeCcOthers: integer("time_cc_others"),
  largestKillingSpree: integer("largest_killing_spree"),
  damageToTurrets: integer("damage_to_turrets"),
  win: integer("win", { mode: "boolean" }),
  placement: integer("placement"),
  itemsJson: text("items_json").notNull(),
  augmentsJson: text("augments_json").notNull(),
  perksJson: text("perks_json").notNull(),
  statsJson: text("stats_json").notNull(),
  rawPayload: text("raw_payload").notNull(),
}, (table) => [
  primaryKey({ columns: [table.matchId, table.participantIndex] }),
  index("idx_match_participants_match_id").on(table.matchId),
  index("idx_match_participants_champion_id").on(table.championId),
  index("idx_match_participants_puuid").on(table.puuid),
]);

export const matchTeams = sqliteTable("match_teams", {
  matchId: text("match_id").notNull().references(() => matches.matchId, { onDelete: "cascade" }),
  teamId: integer("team_id").notNull(),
  win: integer("win", { mode: "boolean" }),
  bansJson: text("bans_json").notNull().default("[]"),
  objectivesJson: text("objectives_json").notNull(),
  rawPayload: text("raw_payload").notNull(),
}, (table) => [
  primaryKey({ columns: [table.matchId, table.teamId] }),
  index("idx_match_teams_match_id").on(table.matchId),
]);

export const staticChampions = sqliteTable("static_champions", {
  id: text("id").primaryKey(),
  numericId: integer("numeric_id").notNull(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  title: text("title"),
  iconPath: text("icon_path").notNull(),
  iconUrl: text("icon_url").notNull(),
  version: text("version").notNull(),
  rawPayload: text("raw_payload").notNull(),
});

export const staticItems = sqliteTable("static_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  iconPath: text("icon_path").notNull(),
  iconUrl: text("icon_url").notNull(),
  version: text("version").notNull(),
  rawPayload: text("raw_payload").notNull(),
});

export const staticAugments = sqliteTable("static_augments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  rarity: text("rarity"),
  iconPath: text("icon_path").notNull(),
  iconUrl: text("icon_url"),
  version: text("version").notNull(),
  rawPayload: text("raw_payload").notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const playerRatings = sqliteTable("player_ratings", {
  targetPuuid: text("target_puuid").primaryKey(),
  summonerName: text("summoner_name"),
  rating: integer("rating"),
  note: text("note"),
  updatedAt: integer("updated_at").notNull(),
});

export const syncRuns = sqliteTable("sync_runs", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  startedAt: integer("started_at").notNull(),
  finishedAt: integer("finished_at"),
  stored: integer("stored").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  skipped: integer("skipped").notNull().default(0),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
}, (table) => [
  index("idx_sync_runs_started_at").on(table.startedAt),
]);

export const schema = {
  appMetadata,
  matches,
  matchParticipants,
  matchTeams,
  staticChampions,
  staticItems,
  staticAugments,
  appSettings,
  playerRatings,
  syncRuns,
};

export type AppMetadataRow = typeof appMetadata.$inferSelect;
export type MatchRow = typeof matches.$inferSelect;
export type MatchParticipantRow = typeof matchParticipants.$inferSelect;
export type MatchTeamRow = typeof matchTeams.$inferSelect;
export type StaticChampionRow = typeof staticChampions.$inferSelect;
export type StaticItemRow = typeof staticItems.$inferSelect;
export type StaticAugmentRow = typeof staticAugments.$inferSelect;
export type AppSettingRow = typeof appSettings.$inferSelect;
export type PlayerRatingRow = typeof playerRatings.$inferSelect;
export type SyncRunRow = typeof syncRuns.$inferSelect;
