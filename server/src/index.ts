import { createApp } from "./app.js";
import { paths } from "./config/paths.js";
import { logger } from "./utils/logger.js";

const app = createApp();

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  logger.info("server", "backend listening", { url: `http://localhost:${port}` });
  logger.info("server", "storage root", { storageRoot: paths.storageRoot });
});
