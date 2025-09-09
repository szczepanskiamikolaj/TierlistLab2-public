// /lib/rateLimiter.ts
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { REDIS_URL } from "@/env";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis(REDIS_URL);


const RATE_LIMIT_WINDOW = 60; // in seconds
const GLOBAL_LIMIT = 100;     // max reqs globally per window
const USER_LIMIT = 10;        // per-user limit per window

const checkRateLimit = async (key: string, limit: number, window: number) => {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, window);
  }
  return count <= limit;
};

const checkSimpleLimit = async (key: string, limit: number, window: number) => {
  const count = await redis.get(key);
  if (count && parseInt(count) >= limit) return false;
  await redis.incr(key);
  await redis.expire(key, window);
  return true;
};

export const globalRateLimit = async (req: any, next: Function) => {
  const ok = await checkSimpleLimit("global_rate_limit", GLOBAL_LIMIT, RATE_LIMIT_WINDOW);
  if (!ok) return new Response("Server is under load. Try again later.", { status: 429 });
  return next();
};

export const userRateLimit = async (
  req: NextRequest,
  userId: string | null,
  next: () => Promise<Response>
) => {
  const key = userId ? `user:${userId}:rate-limit` : `ip:${req.ip ?? "unknown"}`;
  const allowed = await checkRateLimit(key, USER_LIMIT, RATE_LIMIT_WINDOW);

  if (!allowed) {
    return new NextResponse("Too many requests. Please slow down.", { status: 429 });
  }

  return next();
};

const createLimiter = (prefix: string, points: number, duration: number) =>
  new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: prefix,
    points,
    duration,
    blockDuration: 0,
    execEvenly: false,
  });

  export const limiters = {
    templatePut: createLimiter("template-put", 20, 20),
    tierlistPut: createLimiter("tierlist-put", 20, 20),
    changeTemplateVisibility: createLimiter("change-template-visibility", 20, 20),
    changeTierlistVisibility: createLimiter("change-tierlist-visibility", 20, 20),
    deleteTemplate: createLimiter("delete-template", 5, 1),
    deleteTierlist: createLimiter("delete-tierlist", 5, 1),
    imagePost: createLimiter("image-post", 1, 3),
    imagePostDaily: createLimiter("image-post-daily", 150, 86400),
    imageDelete: createLimiter("image-delete", 5, 1),
    imageGet: createLimiter("image-get", 50, 20),
    templateGetBurst: createLimiter("template-get-burst", 50, 15),
    templateGetSlow: createLimiter("template-get-slow", 12, 60),
    tierlistGetBurst: createLimiter("tierlist-get-burst", 50, 15),
    tierlistGetSlow: createLimiter("tierlist-get-slow", 12, 60),
    userImages: createLimiter("user-images", 1, 15),
    proxyBurst: createLimiter("proxy-burst", 100, 20),
    proxySlow: createLimiter("proxy-slow", 5, 10),
    countImages: createLimiter("count-images", 1, 3),
  };
  
