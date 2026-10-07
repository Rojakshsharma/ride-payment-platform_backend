import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 5000;

export async function startServer(app) {
  await connectDatabase();
  await connectRedis();

  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}