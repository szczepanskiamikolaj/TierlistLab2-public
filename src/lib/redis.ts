import { REDIS_URL } from "@/env";
import Redis from "ioredis";


const redis = new Redis(REDIS_URL, {
   retryStrategy: (times) => Math.min(times * 100, 10000), // Exponential backoff
});

redis.on("error", (err) => {
  console.error("[Redis Error]", err); 
});

export { redis };
