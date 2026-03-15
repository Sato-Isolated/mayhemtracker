import { Router } from "express";
import { leagueService } from "../services/leagueService.js";

export const leagueRouter = Router();

leagueRouter.get("/league/auth", async (_request, response, next) => {
  try {
    response.json({ ok: true, credentials: await leagueService.getAuth() });
  } catch (error) {
    next(error);
  }
});

leagueRouter.get("/league/summoner", async (_request, response, next) => {
  try {
    response.json({ ok: true, summoner: await leagueService.getCurrentSummoner() });
  } catch (error) {
    next(error);
  }
});
