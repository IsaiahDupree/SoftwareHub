import { logger } from "../logger";

export type AnalyticsEvent =
  | "page_view"
  | "sign_up"
  | "sign_in"
  | "course_view"
  | "course_enroll"
  | "lesson_start"
  | "lesson_complete"
  | "purchase"
  | "checkout_start"
  | "search"
  | "download"
  | "certificate_earned";

interface EventPayload {
  event: AnalyticsEvent;
  userId?: string;
  properties?: Record<string, unknown>;
}

export function trackEvent(payload: EventPayload): void {
  logger.info(`[ANALYTICS] ${payload.event}`, {
    userId: payload.userId,
    ...payload.properties,
    _analytics: true,
  });
}

export function trackPageView(path: string, userId?: string): void {
  trackEvent({ event: "page_view", userId, properties: { path } });
}

export function trackPurchase(userId: string, productId: string, amount: number): void {
  trackEvent({
    event: "purchase",
    userId,
    properties: { productId, amount, currency: "USD" },
  });
}
