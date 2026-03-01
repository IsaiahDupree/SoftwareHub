import { logger } from "../logger";

interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

const webhookEndpoints: string[] = [];

export function registerWebhookEndpoint(url: string): void {
  if (!webhookEndpoints.includes(url)) {
    webhookEndpoints.push(url);
  }
}

export async function dispatchWebhook(event: WebhookEvent): Promise<void> {
  const payload = JSON.stringify(event);

  for (const url of webhookEndpoints) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
    } catch (error) {
      logger.error(`Webhook dispatch failed to ${url}`, error instanceof Error ? error : undefined, {
        eventType: event.type,
      });
    }
  }
}
