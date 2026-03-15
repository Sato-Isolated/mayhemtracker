import { Router } from "express";
import { staticDataService } from "../services/staticDataService.js";

export const staticDataRouter = Router();

staticDataRouter.post("/static-data/sync", async (_request, response, next) => {
  try {
    response.json({ ok: true, result: await staticDataService.syncAll() });
  } catch (error) {
    next(error);
  }
});

staticDataRouter.get("/static-data/champions", (_request, response) => {
  response.json({ ok: true, items: staticDataService.listChampions() });
});

staticDataRouter.get("/static-data/augments", (_request, response) => {
  response.json({ ok: true, items: staticDataService.listAugments() });
});

staticDataRouter.get("/static-data/items", (_request, response) => {
  response.json({ ok: true, items: staticDataService.listItems() });
});
