import { logger } from "../logger";

export interface CronJob {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
}

const registeredJobs: CronJob[] = [];

export function registerCronJob(job: CronJob): void {
  registeredJobs.push(job);
  logger.info(`Registered cron job: ${job.name}`, { schedule: job.schedule });
}

export function getRegisteredJobs(): CronJob[] {
  return [...registeredJobs];
}

export async function runJob(name: string): Promise<{ success: boolean; error?: string }> {
  const job = registeredJobs.find((j) => j.name === name);
  if (!job) return { success: false, error: `Job not found: ${name}` };

  try {
    await job.handler();
    logger.info(`Cron job completed: ${name}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Cron job failed: ${name}`, error instanceof Error ? error : undefined);
    return { success: false, error: msg };
  }
}
