import "dotenv/config";
import { createClient } from "redis";

const redisClient = createClient({
  url: `${process.env.REDIS_URL}`,
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error);
});

export async function connectRedis() {
  await redisClient.connect();
  console.log("Redis connected");
}

export { redisClient };