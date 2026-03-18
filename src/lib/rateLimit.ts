// Simple in-memory rate limiter for API routes
// In production, use Redis or similar for multi-instance support

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) rateLimitMap.delete(key);
    }
  }, 300_000);
}

interface RateLimitConfig {
  windowMs?: number;  // Time window in ms (default: 60s)
  maxRequests?: number; // Max requests per window (default: 20)
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const { windowMs = 60_000, maxRequests = 20 } = config;
  const now = Date.now();
  const key = identifier;

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetTime - now,
    };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

// Helper: get client IP from request headers
export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
