import cors from "cors";
import express from "express";
import path from "node:path";
import { ensureRuntimeDirectories, paths } from "./config/paths.js";
import { runMigrations } from "./db/migrations.js";
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

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use((request, response, next) => {
  const startedAt = Date.now();
  logger.info("http", "request:start", {
    method: request.method,
    url: request.originalUrl,
    query: request.query,
    body: request.body,
  });

  response.on("finish", () => {
    logger.info("http", "request:end", {
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

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown server error";
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error("http", "request:unhandled-error", { message, stack });
  response.status(500).json({ ok: false, error: message, stack });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  logger.info("server", "backend listening", { url: `http://localhost:${port}` });
  logger.info("server", "storage root", { storageRoot: paths.storageRoot });
});
