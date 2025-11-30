// src/lib/rate-limiter.ts
import { NextResponse } from "next/server";

// Using a Map to store request counts in memory
// Key: userId, Value: { count: number, lastReset: number }
const requestMap = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMIT_COUNT = 3; // Max requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

export function checkRateLimit(userId: string): {
  limited: boolean;
  response?: NextResponse;
} {
  const now = Date.now();
  const userData = requestMap.get(userId);

  if (!userData || now - userData.lastReset > RATE_LIMIT_WINDOW) {
    // First request in the window, or window has passed.
    requestMap.set(userId, { count: 1, lastReset: now });
    return { limited: false };
  }

  if (userData.count >= RATE_LIMIT_COUNT) {
    // Rate limit exceeded.
    return {
      limited: true,
      response: NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      ),
    };
  }

  // Request is within the limit. Increment the count.
  userData.count++;
  requestMap.set(userId, userData);
  return { limited: false };
}
