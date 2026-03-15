import { getDb } from "../db/index.js";
import type {
  AugmentStaticData,
  ChampionStaticData,
  ItemStaticData,
} from "../types/static-data.js";

const db = getDb();

export class StaticDataRepository {
  upsertChampions(champions: ChampionStaticData[]) {
    const statement = db.prepare(`
      INSERT INTO static_champions (id, numeric_id, key, name, title, icon_path, icon_url, version, raw_payload)
      VALUES (@id, @numericId, @key, @name, @title, @iconPath, @iconUrl, @version, @rawPayload)
      ON CONFLICT(id) DO UPDATE SET
        numeric_id = excluded.numeric_id,
        key = excluded.key,
        name = excluded.name,
        title = excluded.title,
        icon_path = excluded.icon_path,
        icon_url = excluded.icon_url,
        version = excluded.version,
        raw_payload = excluded.raw_payload
    `);

    const transaction = db.transaction((rows: ChampionStaticData[]) => {
      for (const row of rows) {
        statement.run(row);
      }
    });

    transaction(champions);
  }

  upsertItems(items: ItemStaticData[]) {
    const statement = db.prepare(`
      INSERT INTO static_items (id, name, description, icon_path, icon_url, version, raw_payload)
      VALUES (@id, @name, @description, @iconPath, @iconUrl, @version, @rawPayload)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        icon_path = excluded.icon_path,
        icon_url = excluded.icon_url,
        version = excluded.version,
        raw_payload = excluded.raw_payload
    `);

    const transaction = db.transaction((rows: ItemStaticData[]) => {
      for (const row of rows) {
        statement.run(row);
      }
    });

    transaction(items);
  }

  upsertAugments(augments: AugmentStaticData[]) {
    const statement = db.prepare(`
      INSERT INTO static_augments (id, name, description, rarity, icon_path, icon_url, version, raw_payload)
      VALUES (@id, @name, @description, @rarity, @iconPath, @iconUrl, @version, @rawPayload)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        rarity = excluded.rarity,
        icon_path = excluded.icon_path,
        icon_url = excluded.icon_url,
        version = excluded.version,
        raw_payload = excluded.raw_payload
    `);

    const transaction = db.transaction((rows: AugmentStaticData[]) => {
      for (const row of rows) {
        statement.run(row);
      }
    });

    transaction(augments);
  }

  setMetadata(key: string, value: string) {
    db.prepare(
      `
        INSERT INTO app_metadata (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `,
    ).run(key, value, Date.now());
  }

  getMetadata(key: string) {
    return db.prepare(`SELECT value FROM app_metadata WHERE key = ?`).get(key) as
      | { value: string }
      | undefined;
  }

  listChampions() {
    return db.prepare(`SELECT * FROM static_champions ORDER BY name ASC`).all() as Array<{
      id: string;
      numeric_id: number;
      key: string;
      name: string;
      title?: string;
      icon_path: string;
      icon_url: string;
      version: string;
      raw_payload: string;
    }>;
  }

  listItems() {
    return db.prepare(`SELECT * FROM static_items ORDER BY name ASC`).all() as Array<{
      id: string;
      name: string;
      description?: string;
      icon_path: string;
      icon_url: string;
      version: string;
      raw_payload: string;
    }>;
  }

  listAugments() {
    return db.prepare(`SELECT * FROM static_augments ORDER BY name ASC`).all() as Array<{
      id: string;
      name: string;
      description?: string;
      rarity?: string;
      icon_path: string;
      icon_url?: string;
      version: string;
      raw_payload: string;
    }>;
  }

  getChampionByNumericId(numericId: number) {
    return db.prepare(`SELECT * FROM static_champions WHERE numeric_id = ?`).get(numericId) as
      | Record<string, unknown>
      | undefined;
  }

  getItemById(id: string) {
    return db.prepare(`SELECT * FROM static_items WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
  }

  getAugmentById(id: string) {
    return db.prepare(`SELECT * FROM static_augments WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
  }
}

export const staticDataRepository = new StaticDataRepository();
