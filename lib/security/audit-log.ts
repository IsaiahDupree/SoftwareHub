/**
 * Security Audit Log (WR-WC-043)
 *
 * Provides structured logging for security-relevant events.
 * All audit log entries are tagged with `_audit: true` so they can be
 * filtered and forwarded to a dedicated security information and event
 * management (SIEM) system in production.
 *
 * @example
 * auditLog({
 *   event: "auth.login",
 *   userId: user.id,
 *   ip: req.headers.get("x-forwarded-for") ?? undefined,
 *   userAgent: req.headers.get("user-agent") ?? undefined,
 * });
 */

import { logger } from "../logger";

export type SecurityEvent =
  | "auth.login"
  | "auth.logout"
  | "auth.failed_login"
  | "auth.password_reset"
  | "admin.access"
  | "admin.user_modify"
  | "admin.role_change"
  | "data.export"
  | "data.delete"
  | "upload.attempt"
  | "upload.blocked"
  | "rate_limit.exceeded"
  | "csrf.blocked"
  | "api.unauthorized";

interface AuditLogEntry {
  /** The security event that occurred */
  event: SecurityEvent;

  /** ID of the authenticated user who triggered the event, if any */
  userId?: string;

  /** IP address of the client making the request */
  ip?: string;

  /** User-Agent string from the request headers */
  userAgent?: string;

  /** Additional structured details specific to the event */
  details?: Record<string, unknown>;
}

/**
 * Emit a structured audit log entry for a security-relevant event.
 *
 * Entries are written at INFO level with a `[SECURITY_AUDIT]` prefix
 * and tagged with `_audit: true` to enable log aggregation filtering.
 */
export function auditLog(entry: AuditLogEntry): void {
  logger.info(`[SECURITY_AUDIT] ${entry.event}`, {
    userId: entry.userId,
    ...entry.details,
    ip: entry.ip,
    userAgent: entry.userAgent,
    _audit: true,
  });
}
