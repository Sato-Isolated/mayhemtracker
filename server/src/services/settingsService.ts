import { asc, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { appSettings, playerRatings } from "../db/schema.js";
import type { AppSettingDto, PlayerRatingDto } from "../types/analytics.js";

const defaultSettings = {
  theme: "ember",
  accentMode: "warm",
  density: "comfortable",
  dataDensity: "comfortable",
  compactSidebar: "false",
  showPageDescriptions: "true",
  stickyToolbars: "true",
  defaultHistoryView: "split",
  nativeNotifications: "false",
  autoSyncEnabled: "true",
  autoSyncIntervalSeconds: "10",
};

export class SettingsService {
  listSettings(): AppSettingDto[] {
    const rows = db.select()
      .from(appSettings)
      .orderBy(asc(appSettings.key))
      .all();

    const stored = new Map(rows.map((row) => [row.key, row]));

    return Object.entries(defaultSettings).map(([key, fallback]) => {
      const row = stored.get(key);
      return {
        key,
        value: row?.value ?? fallback,
        updatedAt: row?.updatedAt ?? 0,
      };
    });
  }

  setSetting(key: string, value: string) {
    const updatedAt = Date.now();
    db.insert(appSettings)
      .values({ key, value, updatedAt })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value,
          updatedAt,
        },
      })
      .run();

    return { key, value, updatedAt } satisfies AppSettingDto;
  }

  listPlayerRatings(): PlayerRatingDto[] {
    return db.select()
      .from(playerRatings)
      .orderBy(desc(playerRatings.updatedAt))
      .all()
      .map((row) => ({
        targetPuuid: row.targetPuuid,
        summonerName: row.summonerName ?? undefined,
        rating: row.rating ?? undefined,
        note: row.note ?? undefined,
        updatedAt: row.updatedAt,
      }));
  }

  getPlayerRating(targetPuuid: string) {
    const row = db.select()
      .from(playerRatings)
      .where(eq(playerRatings.targetPuuid, targetPuuid))
      .get();

    if (!row) {
      return undefined;
    }

    return {
      targetPuuid: row.targetPuuid,
      summonerName: row.summonerName ?? undefined,
      rating: row.rating ?? undefined,
      note: row.note ?? undefined,
      updatedAt: row.updatedAt,
    };
  }

  upsertPlayerRating(targetPuuid: string, summonerName: string | undefined, rating: number | undefined, note: string | undefined) {
    const updatedAt = Date.now();
    db.insert(playerRatings)
      .values({
        targetPuuid,
        summonerName: summonerName ?? null,
        rating: rating ?? null,
        note: note ?? null,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: playerRatings.targetPuuid,
        set: {
          summonerName: summonerName ?? null,
          rating: rating ?? null,
          note: note ?? null,
          updatedAt,
        },
      })
      .run();

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
