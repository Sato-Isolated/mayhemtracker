import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  appMetadata,
  staticAugments,
  staticChampions,
  staticItems,
  type StaticAugmentRow,
  type StaticChampionRow,
  type StaticItemRow,
} from "../db/schema.js";
import type {
  AugmentStaticData,
  ChampionStaticData,
  ItemStaticData,
} from "../types/static-data.js";

export class StaticDataRepository {
  upsertChampions(champions: ChampionStaticData[]) {
    db.transaction((tx) => {
      for (const row of champions) {
        tx.insert(staticChampions)
          .values(row)
          .onConflictDoUpdate({
            target: staticChampions.id,
            set: {
              numericId: row.numericId,
              key: row.key,
              name: row.name,
              title: row.title ?? null,
              iconPath: row.iconPath,
              iconUrl: row.iconUrl,
              version: row.version,
              rawPayload: row.rawPayload,
            },
          })
          .run();
      }
    });
  }

  upsertItems(items: ItemStaticData[]) {
    db.transaction((tx) => {
      for (const row of items) {
        tx.insert(staticItems)
          .values(row)
          .onConflictDoUpdate({
            target: staticItems.id,
            set: {
              name: row.name,
              description: row.description ?? null,
              iconPath: row.iconPath,
              iconUrl: row.iconUrl,
              version: row.version,
              rawPayload: row.rawPayload,
            },
          })
          .run();
      }
    });
  }

  upsertAugments(augments: AugmentStaticData[]) {
    db.transaction((tx) => {
      for (const row of augments) {
        tx.insert(staticAugments)
          .values(row)
          .onConflictDoUpdate({
            target: staticAugments.id,
            set: {
              name: row.name,
              description: row.description ?? null,
              rarity: row.rarity ?? null,
              iconPath: row.iconPath,
              iconUrl: row.iconUrl ?? null,
              version: row.version,
              rawPayload: row.rawPayload,
            },
          })
          .run();
      }
    });
  }

  setMetadata(key: string, value: string) {
    const updatedAt = Date.now();
    db.insert(appMetadata)
      .values({ key, value, updatedAt })
      .onConflictDoUpdate({
        target: appMetadata.key,
        set: {
          value,
          updatedAt,
        },
      })
      .run();
  }

  getMetadata(key: string) {
    return db.select({ value: appMetadata.value })
      .from(appMetadata)
      .where(eq(appMetadata.key, key))
      .get();
  }

  listChampions() {
    return db.select()
      .from(staticChampions)
      .orderBy(asc(staticChampions.name))
      .all() as StaticChampionRow[];
  }

  listItems() {
    return db.select()
      .from(staticItems)
      .orderBy(asc(staticItems.name))
      .all() as StaticItemRow[];
  }

  listAugments() {
    return db.select()
      .from(staticAugments)
      .orderBy(asc(staticAugments.name))
      .all() as StaticAugmentRow[];
  }

  getChampionByNumericId(numericId: number) {
    return db.select()
      .from(staticChampions)
      .where(eq(staticChampions.numericId, numericId))
      .get();
  }

  getItemById(id: string) {
    return db.select()
      .from(staticItems)
      .where(eq(staticItems.id, id))
      .get();
  }

  getAugmentById(id: string) {
    return db.select()
      .from(staticAugments)
      .where(eq(staticAugments.id, id))
      .get();
  }
}

export const staticDataRepository = new StaticDataRepository();
