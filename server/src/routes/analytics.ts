import { Router } from "express";
import { analyticsService } from "../services/analyticsService.js";
import { settingsService } from "../services/settingsService.js";

export const analyticsRouter = Router();

analyticsRouter.get("/analytics/dashboard", (_request, response) => {
  response.json({ ok: true, dashboard: analyticsService.getDashboard() });
});

analyticsRouter.get("/analytics/profile", (_request, response) => {
  response.json({ ok: true, profile: analyticsService.getProfile() });
});

analyticsRouter.get("/analytics/champions", (_request, response) => {
  response.json({ ok: true, items: analyticsService.listChampionStats() });
});

analyticsRouter.get("/analytics/augments", (_request, response) => {
  response.json({ ok: true, items: analyticsService.listAugmentStats() });
});

analyticsRouter.get("/analytics/teammates", (_request, response) => {
  const ratings = new Map(settingsService.listPlayerRatings().map((entry) => [entry.targetPuuid, entry]));
  const items = analyticsService.listTeammates().map((entry) => ({
    ...entry,
    rating: ratings.get(entry.puuid)?.rating,
    note: ratings.get(entry.puuid)?.note,
  }));
  response.json({ ok: true, items });
});