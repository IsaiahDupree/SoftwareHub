/**
 * API Security Helper (WR-WC-031)
 *
 * Combines CSRF protection and rate limiting into a single helper
 * for easy, consistent application across API routes.
 *
 * @example
 * export async function POST(req: NextRequest) {
 *   const securityError = apiSecurityCheck(req);
 *   if (securityError) return securityError;
 *
 *   // Continue with request handling...
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { validateCsrfOrWebhook } from "./csrf";
import { checkRateLimit, RateLimitConfig, RateLimits } from "./rateLimit";
import { logger } from "../logger";

export interface ApiSecurityConfig {
  /**
   * Rate limit configuration. Defaults to RateLimits.STANDARD (100 req/min).
   */
  rateLimit?: RateLimitConfig;

  /**
   * Whether the route requires authentication.
   * When true, a 401 is returned if no user session is present.
   * Note: actual auth checking is done separately via Supabase.
   */
  requireAuth?: boolean;

  /**
   * Skip CSRF origin verification.
   * Use only for webhook endpoints that verify signatures independently.
   */
  skipCsrf?: boolean;
}

/**
 * Combined security check for API routes.
 * Returns a NextResponse error if any check fails, or null if all checks pass.
 *
 * Checks performed (in order):
 * 1. CSRF origin verification (skipped for GET/HEAD/OPTIONS and webhook requests)
 * 2. Rate limiting
 */
export function apiSecurityCheck(
  req: NextRequest,
  config: ApiSecurityConfig = {}
): NextResponse | null {
  // CSRF check (skip for GET/HEAD/OPTIONS and webhooks)
  if (!config.skipCsrf) {
    const csrfResult = validateCsrfOrWebhook(req);
    if (csrfResult) {
      logger.warn("CSRF validation failed", {
        route: req.nextUrl.pathname,
        method: req.method,
      });
      return csrfResult;
    }
  }

  // Rate limiting
  const rateLimitConfig = config.rateLimit || RateLimits.STANDARD;
  const rateLimitResult = checkRateLimit(req, rateLimitConfig);
  if (rateLimitResult) {
    logger.warn("Rate limit exceeded", {
      route: req.nextUrl.pathname,
      method: req.method,
    });
    return rateLimitResult;
  }

  return null;
}

export { RateLimits } from "./rateLimit";
