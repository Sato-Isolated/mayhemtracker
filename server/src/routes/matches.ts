import { Router } from "express";
import { z } from "zod";
import { matchService } from "../services/matchService.js";

export const matchesRouter = Router();

matchesRouter.post("/matches/sync-current", async (_request, response, next) => {
  try {
    response.json({ ok: true, result: await matchService.syncCurrentMatches() });
  } catch (error) {
    next(error);
  }
});

matchesRouter.get("/matches", (request, response) => {
  const query = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }).parse(request.query);

  response.json({ ok: true, ...matchService.listMatches(query.page, query.pageSize) });
});

matchesRouter.get("/matches/:matchId", (request, response) => {
  const match = matchService.getMatch(request.params.matchId);
  if (!match) {
    response.status(404).json({ ok: false, error: "Match not found." });
    return;
  }

  response.json({ ok: true, match });
});

matchesRouter.delete("/matches/clear", (_request, response) => {
  matchService.clearMatches();
  response.json({ ok: true, message: "Stored matches cleared." });
});
