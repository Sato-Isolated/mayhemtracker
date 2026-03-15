import { Router } from "express";

export const statusRouter = Router();

statusRouter.get("/status", (_request, response) => {
  response.json({ ok: true, message: "Mayhem Tracker backend is running." });
});
