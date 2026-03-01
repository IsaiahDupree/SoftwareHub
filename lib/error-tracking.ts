import { logger } from "./logger";

interface ErrorContext {
  userId?: string;
  route?: string;
  action?: string;
  [key: string]: unknown;
}

export function captureException(error: Error, context?: ErrorContext): void {
  logger.error(error.message, error, {
    ...context,
    errorName: error.name,
    _tracking: true,
  });

  // In production, send to external service (Sentry, etc.)
  // if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context });
  // }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: ErrorContext): void {
  logger[level === "warning" ? "warn" : level](message, context);
}
