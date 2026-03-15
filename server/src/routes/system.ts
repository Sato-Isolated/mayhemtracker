import { Router } from "express";
import { systemService } from "../services/systemService.js";

export const systemRouter = Router();

systemRouter.get("/system/powershell-test", async (_request, response, next) => {
  try {
    const result = await systemService.runPowerShellTest();
    response.json(result);
  } catch (error) {
    next(error);
  }
});
