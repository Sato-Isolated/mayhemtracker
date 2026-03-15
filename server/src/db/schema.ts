export const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS matches (
      match_id TEXT PRIMARY KEY,
      queue_id INTEGER,
      game_mode TEXT,
      game_version TEXT,
      game_mode_mutators_json TEXT NOT NULL,
      map_id INTEGER,
      game_creation INTEGER,
      game_start_timestamp INTEGER,
      game_end_timestamp INTEGER,
      game_duration INTEGER,
      retrieved_at INTEGER NOT NULL,
      summary TEXT NOT NULL,
      raw_payload TEXT NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS match_participants (
      match_id TEXT NOT NULL,
      participant_index INTEGER NOT NULL,
      participant_id INTEGER,
      puuid TEXT,
      riot_id_game_name TEXT,
      riot_id_tagline TEXT,
      summoner_name TEXT,
      team_id INTEGER,
      champion_id INTEGER,
      champion_name TEXT,
      spell1_id INTEGER,
      spell2_id INTEGER,
      kills INTEGER,
      deaths INTEGER,
      assists INTEGER,
      double_kills INTEGER,
      triple_kills INTEGER,
      quadra_kills INTEGER,
      penta_kills INTEGER,
      total_damage_dealt INTEGER,
      total_damage_taken INTEGER,
      gold_earned INTEGER,
      total_heal INTEGER,
      total_cs INTEGER,
      champion_level INTEGER,
      vision_score INTEGER,
      time_cc_others INTEGER,
      largest_killing_spree INTEGER,
      damage_to_turrets INTEGER,
      win INTEGER,
      placement INTEGER,
      items_json TEXT NOT NULL,
      augments_json TEXT NOT NULL,
      perks_json TEXT NOT NULL,
      stats_json TEXT NOT NULL,
      raw_payload TEXT NOT NULL,
      PRIMARY KEY (match_id, participant_index),
      FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS match_teams (
      match_id TEXT NOT NULL,
      team_id INTEGER NOT NULL,
      win INTEGER,
      bans_json TEXT NOT NULL DEFAULT '[]',
      objectives_json TEXT NOT NULL,
      raw_payload TEXT NOT NULL,
      PRIMARY KEY (match_id, team_id),
      FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS static_champions (
      id TEXT PRIMARY KEY,
      numeric_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT,
      icon_path TEXT NOT NULL,
      icon_url TEXT NOT NULL,
      version TEXT NOT NULL,
      raw_payload TEXT NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS static_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon_path TEXT NOT NULL,
      icon_url TEXT NOT NULL,
      version TEXT NOT NULL,
      raw_payload TEXT NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS static_augments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      rarity TEXT,
      icon_path TEXT NOT NULL,
      icon_url TEXT,
      version TEXT NOT NULL,
      raw_payload TEXT NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS player_ratings (
      target_puuid TEXT PRIMARY KEY,
      summoner_name TEXT,
      rating INTEGER,
      note TEXT,
      updated_at INTEGER NOT NULL
    )
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_matches_retrieved_at ON matches(retrieved_at DESC)
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants(match_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_match_participants_champion_id ON match_participants(champion_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_match_participants_puuid ON match_participants(puuid)
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_match_teams_match_id ON match_teams(match_id)
  `,
];
