import crypto from "node:crypto";
import path from "node:path";
import cors from "cors";
import express from "express";
import { ensureRuntimeDirectories, paths } from "./config/paths.js";
import { runMigrations } from "./db/migrations.js";
import { toErrorResponse } from "./errors/app-error.js";
import { analyticsRouter } from "./routes/analytics.js";
import { leagueRouter } from "./routes/league.js";
import { matchesRouter } from "./routes/matches.js";
import { settingsRouter } from "./routes/settings.js";
import { staticDataRouter } from "./routes/static-data.js";
import { statusRouter } from "./routes/status.js";
import { systemRouter } from "./routes/system.js";
import { logger } from "./utils/logger.js";

ensureRuntimeDirectories();
runMigrations();

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use((request, response, next) => {
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();
    response.locals.requestId = requestId;

    logger.info("http", "request:start", {
      requestId,
      method: request.method,
      url: request.originalUrl,
      query: request.query,
    });

    response.on("finish", () => {
      logger.info("http", "request:end", {
        requestId,
        method: request.method,
        url: request.originalUrl,
        status: response.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    next();
  });

  app.use(
    "/assets-cache",
    express.static(path.join(paths.cacheRoot), {
      fallthrough: true,
      maxAge: "7d",
    }),
  );

  app.use("/api", statusRouter);
  app.use("/api", leagueRouter);
  app.use("/api", systemRouter);
  app.use("/api", staticDataRouter);
  app.use("/api", matchesRouter);
  app.use("/api", analyticsRouter);
  app.use("/api", settingsRouter);

  app.use((error: unknown, request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const { statusCode, body, error: normalized } = toErrorResponse(error);
    logger.error("http", "request:error", {
      requestId: response.locals.requestId,
      method: request.method,
      url: request.originalUrl,
      statusCode,
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
      stack: normalized.stack,
    });
    response.status(statusCode).json(body);
  });

  return app;
}
