import { Router } from "express";
import { z } from "zod";
import { settingsService } from "../services/settingsService.js";

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const ratingSchema = z.object({
  targetPuuid: z.string().min(1),
  summonerName: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  note: z.string().max(280).optional(),
});

export const settingsRouter = Router();

settingsRouter.get("/settings", (_request, response) => {
  response.json({ ok: true, items: settingsService.listSettings() });
});

settingsRouter.put("/settings", (request, response) => {
  const payload = settingSchema.parse(request.body);
  response.json({ ok: true, item: settingsService.setSetting(payload.key, payload.value) });
});

settingsRouter.get("/ratings", (_request, response) => {
  response.json({ ok: true, items: settingsService.listPlayerRatings() });
});

settingsRouter.put("/ratings", (request, response) => {
  const payload = ratingSchema.parse(request.body);
  response.json({
    ok: true,
    item: settingsService.upsertPlayerRating(payload.targetPuuid, payload.summonerName, payload.rating, payload.note),
  });
});