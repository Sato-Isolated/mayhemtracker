import { getDb } from "../db/index.js";
import type { SyncRunDto, SyncStatusDto } from "../types/sync.js";

const db = getDb();

function toSyncRun(row: Record<string, unknown> | undefined): SyncRunDto | undefined {
  if (!row) {
    return undefined;
  }

  return {
    id: String(row.id),
    status: row.status as SyncRunDto["status"],
    startedAt: Number(row.started_at),
    finishedAt: row.finished_at ? Number(row.finished_at) : undefined,
    stored: Number(row.stored ?? 0),
    updated: Number(row.updated ?? 0),
    skipped: Number(row.skipped ?? 0),
    errorCode: row.error_code ? String(row.error_code) : undefined,
    errorMessage: row.error_message ? String(row.error_message) : undefined,
  };
}

export class SyncRepository {
  startRun(id: string, startedAt: number) {
    db.prepare(
      `
        INSERT INTO sync_runs (id, status, started_at, stored, updated, skipped)
        VALUES (?, 'running', ?, 0, 0, 0)
      `,
    ).run(id, startedAt);
  }

  finishRunSuccess(id: string, payload: { finishedAt: number; stored: number; updated: number; skipped: number }) {
    db.prepare(
      `
        UPDATE sync_runs
        SET status = 'success',
            finished_at = @finishedAt,
            stored = @stored,
            updated = @updated,
            skipped = @skipped,
            error_code = NULL,
            error_message = NULL
        WHERE id = @id
      `,
    ).run({
      id,
      finishedAt: payload.finishedAt,
      stored: payload.stored,
      updated: payload.updated,
      skipped: payload.skipped,
    });
  }

  finishRunError(id: string, payload: { finishedAt: number; stored: number; updated: number; skipped: number; errorCode: string; errorMessage: string }) {
    db.prepare(
      `
        UPDATE sync_runs
        SET status = 'error',
            finished_at = @finishedAt,
            stored = @stored,
            updated = @updated,
            skipped = @skipped,
            error_code = @errorCode,
            error_message = @errorMessage
        WHERE id = @id
      `,
    ).run({
      id,
      finishedAt: payload.finishedAt,
      stored: payload.stored,
      updated: payload.updated,
      skipped: payload.skipped,
      errorCode: payload.errorCode,
      errorMessage: payload.errorMessage,
    });
  }

  getRunningRun() {
    const row = db.prepare(`SELECT * FROM sync_runs WHERE status = 'running' ORDER BY started_at DESC LIMIT 1`).get() as
      | Record<string, unknown>
      | undefined;
    return toSyncRun(row);
  }

  getLatestRun() {
    const row = db.prepare(`SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 1`).get() as
      | Record<string, unknown>
      | undefined;
    return toSyncRun(row);
  }

  getSyncStatus(): SyncStatusDto {
    const currentRun = this.getRunningRun();
    const lastRun = this.getLatestRun();

    if (currentRun) {
      return { state: "running", currentRun, lastRun };
    }

    if (lastRun) {
      return {
        state: lastRun.status,
        lastRun,
      };
    }

    return { state: "idle" };
  }
}

export const syncRepository = new SyncRepository();
