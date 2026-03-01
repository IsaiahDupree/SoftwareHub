/**
 * Auth-specific Rate Limiting (WR-WC-032)
 *
 * Applies tighter rate limits to authentication endpoints to prevent
 * brute-force attacks on sign-in, sign-up, password reset, and magic link flows.
 *
 * @example
 * export async function POST(req: NextRequest) {
 *   const rateLimitError = checkAuthRateLimit(req, "signIn");
 *   if (rateLimitError) return rateLimitError;
 *
 *   // Continue with auth handling...
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./rateLimit";

export const AUTH_RATE_LIMITS = {
  /** 5 sign-in attempts per 5 minutes per IP */
  signIn: { maxRequests: 5, windowSeconds: 300 },

  /** 3 sign-up attempts per 10 minutes per IP */
  signUp: { maxRequests: 3, windowSeconds: 600 },

  /** 3 password reset requests per 10 minutes per IP */
  resetPassword: { maxRequests: 3, windowSeconds: 600 },

  /** 5 magic link requests per 5 minutes per IP */
  magicLink: { maxRequests: 5, windowSeconds: 300 },
} as const;

/**
 * Check rate limit for a specific authentication action.
 *
 * The identifier includes the action type so each auth endpoint
 * maintains its own independent rate limit counter per IP address.
 *
 * @param req - The incoming Next.js request
 * @param action - The auth action being performed
 * @returns null if within rate limit, NextResponse with 429 status if exceeded
 */
export function checkAuthRateLimit(
  req: NextRequest,
  action: keyof typeof AUTH_RATE_LIMITS
): NextResponse | null {
  const config = AUTH_RATE_LIMITS[action];
  return checkRateLimit(req, {
    ...config,
    identifier: `auth:${action}`,
  });
}
