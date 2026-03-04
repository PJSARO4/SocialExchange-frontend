// Simple in-memory rate limiter for organism API routes
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS: Record<string, number> = {
  chat: 20,     // 20 messages per minute
  scrape: 10,   // 10 searches per minute
  compress: 5,  // 5 compress requests per minute
  task: 30,     // 30 task operations per minute
};

export function checkRateLimit(
  route: string,
  identifier: string = 'anonymous'
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = `${route}:${identifier}`;
  const now = Date.now();
  const limit = MAX_REQUESTS[route] || 30;

  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, resetIn: WINDOW_MS };
  }

  entry.count++;

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn: entry.resetAt - now,
  };
}

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of requestCounts.entries()) {
      if (now > entry.resetAt) {
        requestCounts.delete(key);
      }
    }
  }, 5 * 60_000);
}
