import { logger } from "../logger";

interface TeamHookPayload {
  text: string;
  channel?: string;
  username?: string;
}

export async function sendSlackNotification(payload: TeamHookPayload): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("SLACK_WEBHOOK_URL not configured");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: payload.text,
        channel: payload.channel,
        username: payload.username || "SoftwareHub",
      }),
    });
    return response.ok;
  } catch (error) {
    logger.error("Slack notification failed", error instanceof Error ? error : undefined);
    return false;
  }
}

export async function sendDiscordNotification(content: string): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("DISCORD_WEBHOOK_URL not configured");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, username: "SoftwareHub" }),
    });
    return response.ok;
  } catch (error) {
    logger.error("Discord notification failed", error instanceof Error ? error : undefined);
    return false;
  }
}
