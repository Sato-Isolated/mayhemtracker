import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { syncRuns, type SyncRunRow } from "../db/schema.js";
import type { SyncRunDto, SyncStatusDto } from "../types/sync.js";

function toSyncRun(row: SyncRunRow | undefined): SyncRunDto | undefined {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    status: row.status as SyncRunDto["status"],
    startedAt: row.startedAt,
    finishedAt: row.finishedAt ?? undefined,
    stored: row.stored ?? 0,
    updated: row.updated ?? 0,
    skipped: row.skipped ?? 0,
    errorCode: row.errorCode ?? undefined,
    errorMessage: row.errorMessage ?? undefined,
  };
}

export class SyncRepository {
  startRun(id: string, startedAt: number) {
    db.insert(syncRuns)
      .values({ id, status: "running", startedAt, stored: 0, updated: 0, skipped: 0 })
      .run();
  }

  finishRunSuccess(id: string, payload: { finishedAt: number; stored: number; updated: number; skipped: number }) {
    db.update(syncRuns)
      .set({
        status: "success",
        finishedAt: payload.finishedAt,
        stored: payload.stored,
        updated: payload.updated,
        skipped: payload.skipped,
        errorCode: null,
        errorMessage: null,
      })
      .where(eq(syncRuns.id, id))
      .run();
  }

  finishRunError(id: string, payload: { finishedAt: number; stored: number; updated: number; skipped: number; errorCode: string; errorMessage: string }) {
    db.update(syncRuns)
      .set({
        status: "error",
        finishedAt: payload.finishedAt,
        stored: payload.stored,
        updated: payload.updated,
        skipped: payload.skipped,
        errorCode: payload.errorCode,
        errorMessage: payload.errorMessage,
      })
      .where(eq(syncRuns.id, id))
      .run();
  }

  getRunningRun() {
    return toSyncRun(
      db.select()
        .from(syncRuns)
        .where(eq(syncRuns.status, "running"))
        .orderBy(desc(syncRuns.startedAt))
        .limit(1)
        .get(),
    );
  }

  getLatestRun() {
    return toSyncRun(
      db.select()
        .from(syncRuns)
        .orderBy(desc(syncRuns.startedAt))
        .limit(1)
        .get(),
    );
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
