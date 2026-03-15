import { getDb } from "./index.js";
import { schemaStatements } from "./schema.js";

function addColumnIfMissing(tableName: string, columnName: string, definition: string) {
  const db = getDb();
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

export function runMigrations() {
  const db = getDb();
  const transaction = db.transaction(() => {
    for (const statement of schemaStatements) {
      db.exec(statement);
    }

    addColumnIfMissing("matches", "game_version", "TEXT");
    addColumnIfMissing("matches", "game_mode_mutators_json", "TEXT NOT NULL DEFAULT '[]'");

    addColumnIfMissing("match_participants", "participant_id", "INTEGER");
    addColumnIfMissing("match_participants", "spell1_id", "INTEGER");
    addColumnIfMissing("match_participants", "spell2_id", "INTEGER");
    addColumnIfMissing("match_participants", "double_kills", "INTEGER");
    addColumnIfMissing("match_participants", "triple_kills", "INTEGER");
    addColumnIfMissing("match_participants", "quadra_kills", "INTEGER");
    addColumnIfMissing("match_participants", "penta_kills", "INTEGER");
    addColumnIfMissing("match_participants", "total_damage_dealt", "INTEGER");
    addColumnIfMissing("match_participants", "total_damage_taken", "INTEGER");
    addColumnIfMissing("match_participants", "gold_earned", "INTEGER");
    addColumnIfMissing("match_participants", "total_heal", "INTEGER");
    addColumnIfMissing("match_participants", "total_cs", "INTEGER");
    addColumnIfMissing("match_participants", "champion_level", "INTEGER");
    addColumnIfMissing("match_participants", "vision_score", "INTEGER");
    addColumnIfMissing("match_participants", "time_cc_others", "INTEGER");
    addColumnIfMissing("match_participants", "largest_killing_spree", "INTEGER");
    addColumnIfMissing("match_participants", "damage_to_turrets", "INTEGER");

    addColumnIfMissing("match_teams", "bans_json", "TEXT NOT NULL DEFAULT '[]'");

    db.prepare(
      `
        INSERT INTO app_metadata (key, value, updated_at)
        VALUES (@key, @value, @updated_at)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `,
    ).run({
      key: "schema_version",
      value: "3",
      updated_at: Date.now(),
    });
  });

  transaction();
}
