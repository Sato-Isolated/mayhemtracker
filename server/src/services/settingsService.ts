import { getDb } from "../db/index.js";
import type { AppSettingDto, PlayerRatingDto } from "../types/analytics.js";

const db = getDb();

const defaultSettings = {
  theme: "ember",
  accentMode: "warm",
  density: "comfortable",
  compactSidebar: "false",
};

export class SettingsService {
  listSettings(): AppSettingDto[] {
    const rows = db.prepare(`SELECT key, value, updated_at FROM app_settings ORDER BY key ASC`).all() as Array<{
      key: string;
      value: string;
      updated_at: number;
    }>;

    const stored = new Map(rows.map((row) => [row.key, row]));

    return Object.entries(defaultSettings).map(([key, fallback]) => {
      const row = stored.get(key);
      return {
        key,
        value: row?.value ?? fallback,
        updatedAt: row?.updated_at ?? 0,
      };
    });
  }

  setSetting(key: string, value: string) {
    const updatedAt = Date.now();
    db.prepare(
      `
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `,
    ).run(key, value, updatedAt);

    return { key, value, updatedAt } satisfies AppSettingDto;
  }

  listPlayerRatings(): PlayerRatingDto[] {
    return db.prepare(`SELECT * FROM player_ratings ORDER BY updated_at DESC`).all() as PlayerRatingDto[];
  }

  getPlayerRating(targetPuuid: string) {
    return db.prepare(`SELECT * FROM player_ratings WHERE target_puuid = ?`).get(targetPuuid) as
      | { target_puuid: string; summoner_name?: string; rating?: number; note?: string; updated_at: number }
      | undefined;
  }

  upsertPlayerRating(targetPuuid: string, summonerName: string | undefined, rating: number | undefined, note: string | undefined) {
    const updatedAt = Date.now();
    db.prepare(
      `
        INSERT INTO player_ratings (target_puuid, summoner_name, rating, note, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(target_puuid) DO UPDATE SET
          summoner_name = excluded.summoner_name,
          rating = excluded.rating,
          note = excluded.note,
          updated_at = excluded.updated_at
      `,
    ).run(targetPuuid, summonerName ?? null, rating ?? null, note ?? null, updatedAt);

    return {
      targetPuuid,
      summonerName,
      rating,
      note,
      updatedAt,
    } satisfies PlayerRatingDto;
  }
}

export const settingsService = new SettingsService();