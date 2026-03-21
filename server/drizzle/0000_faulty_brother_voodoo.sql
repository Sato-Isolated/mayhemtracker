CREATE TABLE `app_metadata` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `match_participants` (
	`match_id` text NOT NULL,
	`participant_index` integer NOT NULL,
	`participant_id` integer,
	`puuid` text,
	`riot_id_game_name` text,
	`riot_id_tagline` text,
	`summoner_name` text,
	`team_id` integer,
	`champion_id` integer,
	`champion_name` text,
	`spell1_id` integer,
	`spell2_id` integer,
	`kills` integer,
	`deaths` integer,
	`assists` integer,
	`double_kills` integer,
	`triple_kills` integer,
	`quadra_kills` integer,
	`penta_kills` integer,
	`total_damage_dealt` integer,
	`total_damage_taken` integer,
	`gold_earned` integer,
	`total_heal` integer,
	`total_cs` integer,
	`champion_level` integer,
	`vision_score` integer,
	`time_cc_others` integer,
	`largest_killing_spree` integer,
	`damage_to_turrets` integer,
	`win` integer,
	`placement` integer,
	`items_json` text NOT NULL,
	`augments_json` text NOT NULL,
	`perks_json` text NOT NULL,
	`stats_json` text NOT NULL,
	`raw_payload` text NOT NULL,
	PRIMARY KEY(`match_id`, `participant_index`),
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`match_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_match_participants_match_id` ON `match_participants` (`match_id`);--> statement-breakpoint
CREATE INDEX `idx_match_participants_champion_id` ON `match_participants` (`champion_id`);--> statement-breakpoint
CREATE INDEX `idx_match_participants_puuid` ON `match_participants` (`puuid`);--> statement-breakpoint
CREATE TABLE `match_teams` (
	`match_id` text NOT NULL,
	`team_id` integer NOT NULL,
	`win` integer,
	`bans_json` text DEFAULT '[]' NOT NULL,
	`objectives_json` text NOT NULL,
	`raw_payload` text NOT NULL,
	PRIMARY KEY(`match_id`, `team_id`),
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`match_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_match_teams_match_id` ON `match_teams` (`match_id`);--> statement-breakpoint
CREATE TABLE `matches` (
	`match_id` text PRIMARY KEY NOT NULL,
	`queue_id` integer,
	`game_mode` text,
	`game_version` text,
	`game_mode_mutators_json` text NOT NULL,
	`map_id` integer,
	`game_creation` integer,
	`game_start_timestamp` integer,
	`game_end_timestamp` integer,
	`game_duration` integer,
	`retrieved_at` integer NOT NULL,
	`summary` text NOT NULL,
	`raw_payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_matches_retrieved_at` ON `matches` (`retrieved_at`);--> statement-breakpoint
CREATE TABLE `player_ratings` (
	`target_puuid` text PRIMARY KEY NOT NULL,
	`summoner_name` text,
	`rating` integer,
	`note` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `static_augments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`rarity` text,
	`icon_path` text NOT NULL,
	`icon_url` text,
	`version` text NOT NULL,
	`raw_payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `static_champions` (
	`id` text PRIMARY KEY NOT NULL,
	`numeric_id` integer NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`icon_path` text NOT NULL,
	`icon_url` text NOT NULL,
	`version` text NOT NULL,
	`raw_payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `static_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon_path` text NOT NULL,
	`icon_url` text NOT NULL,
	`version` text NOT NULL,
	`raw_payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`stored` integer DEFAULT 0 NOT NULL,
	`updated` integer DEFAULT 0 NOT NULL,
	`skipped` integer DEFAULT 0 NOT NULL,
	`error_code` text,
	`error_message` text
);
--> statement-breakpoint
CREATE INDEX `idx_sync_runs_started_at` ON `sync_runs` (`started_at`);