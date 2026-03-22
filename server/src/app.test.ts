import assert from "node:assert/strict";
import { once } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { AddressInfo } from "node:net";

const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mayhemtracker-server-test-"));
process.env.MAYHEMTRACKER_STORAGE_DIR = storageRoot;

const { createApp } = await import("./app.js");
const { leagueService } = await import("./services/leagueService.js");

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const app = createApp();
  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    await run(baseUrl);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test.after(() => {
  try {
    fs.rmSync(storageRoot, { recursive: true, force: true });
  } catch {
    // better-sqlite3 keeps the database file open for the process lifetime.
  }
});

test("matches sync status starts idle", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/matches/sync-status`);
    assert.equal(response.status, 200);

    const payload = await response.json() as { ok: boolean; status: { state: string } };
    assert.equal(payload.ok, true);
    assert.equal(payload.status.state, "idle");
  });
});

test("runtime diagnostics expose local backend state", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/system/runtime`);
    assert.equal(response.status, 200);

    const payload = await response.json() as {
      ok: boolean;
      runtime: {
        db: { path: string; journalMode: string };
        sync: { state: string };
        iconCache: { root: string };
      };
    };

    assert.equal(payload.ok, true);
    assert.match(payload.runtime.db.path, /mayhemtracker\.sqlite$/);
    assert.equal(payload.runtime.sync.state, "idle");
    assert.ok(payload.runtime.iconCache.root.length > 0);
  });
});

test("invalid rating payload returns a validation error", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/ratings`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetPuuid: "puuid-1",
        rating: 9,
      }),
    });

    assert.equal(response.status, 400);
    const payload = await response.json() as { ok: boolean; code: string; details?: unknown };
    assert.equal(payload.ok, false);
    assert.equal(payload.code, "validation_error");
    assert.ok(payload.details);
  });
});

test("league gameflow route exposes connected gameflow state", async () => {
  const original = leagueService.getGameflowState;
  leagueService.getGameflowState = async () => ({
    connected: true,
    phase: "InProgress",
    isInGame: true,
    gameId: 12345,
    queueId: 450,
  });

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/league/gameflow`);
      assert.equal(response.status, 200);

      const payload = await response.json() as {
        ok: boolean;
        connected: boolean;
        phase?: string;
        isInGame: boolean;
        gameId?: number;
        queueId?: number;
      };

      assert.equal(payload.ok, true);
      assert.equal(payload.connected, true);
      assert.equal(payload.phase, "InProgress");
      assert.equal(payload.isInGame, true);
      assert.equal(payload.gameId, 12345);
      assert.equal(payload.queueId, 450);
    });
  } finally {
    leagueService.getGameflowState = original;
  }
});

test("league gameflow route exposes disconnected state", async () => {
  const original = leagueService.getGameflowState;
  leagueService.getGameflowState = async () => ({
    connected: false,
    isInGame: false,
    errorCode: "client_not_running",
    errorMessage: "League client is not running.",
  });

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/league/gameflow`);
      assert.equal(response.status, 200);

      const payload = await response.json() as {
        ok: boolean;
        connected: boolean;
        isInGame: boolean;
        errorCode?: string;
      };

      assert.equal(payload.ok, true);
      assert.equal(payload.connected, false);
      assert.equal(payload.isInGame, false);
      assert.equal(payload.errorCode, "client_not_running");
    });
  } finally {
    leagueService.getGameflowState = original;
  }
});

test("league gameflow route preserves endpoint_unavailable while connected", async () => {
  const original = leagueService.getGameflowState;
  leagueService.getGameflowState = async () => ({
    connected: true,
    phase: "Lobby",
    isInGame: false,
    errorCode: "endpoint_unavailable",
    errorMessage: "League endpoint is unavailable.",
  });

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/league/gameflow`);
      assert.equal(response.status, 200);

      const payload = await response.json() as {
        ok: boolean;
        connected: boolean;
        phase?: string;
        isInGame: boolean;
        errorCode?: string;
      };

      assert.equal(payload.ok, true);
      assert.equal(payload.connected, true);
      assert.equal(payload.phase, "Lobby");
      assert.equal(payload.isInGame, false);
      assert.equal(payload.errorCode, "endpoint_unavailable");
    });
  } finally {
    leagueService.getGameflowState = original;
  }
});
