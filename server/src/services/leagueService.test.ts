import assert from "node:assert/strict";
import test from "node:test";
import { LcuConnectionError } from "../errors/app-error.js";
import { classifyLeagueError } from "./leagueService.js";

test("classifyLeagueError maps lockfile issues to client_not_running", () => {
  const error = classifyLeagueError(new Error("Failed to find lockfile"));

  assert.ok(error instanceof LcuConnectionError);
  assert.equal(error.code, "client_not_running");
});

test("classifyLeagueError maps 404 responses to endpoint_unavailable", () => {
  const error = classifyLeagueError(new Error("LCU request failed: 404 /lol-summoner"));

  assert.ok(error instanceof LcuConnectionError);
  assert.equal(error.code, "endpoint_unavailable");
});
