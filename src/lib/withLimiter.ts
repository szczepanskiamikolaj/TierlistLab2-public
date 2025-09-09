import { NextRequest, NextResponse } from "next/server";
import { RateLimiterRedis } from "rate-limiter-flexible";

export const withLimiter = async (
  req: NextRequest,
  limiter: RateLimiterRedis,
  userId: string | null
) => {
  const key = userId || req.headers.get("x-forwarded-for") || "anonymous";
  try {
    await limiter.consume(key);
    return null; 
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
};
