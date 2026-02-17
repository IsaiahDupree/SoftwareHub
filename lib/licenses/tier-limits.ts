// License tier limits for SoftwareHub products (AC-005, DM-008)
// These limits are enforced server-side via the license validation API
// and client-side for UX feedback.

export interface TierLimits {
  commentsPerDay?: number
  dmsPerDay?: number
  platforms: string[]
  multiAccount: boolean
  analytics: boolean
  whiteLabel: boolean
  apiAccess: boolean
}

// Auto Comment tier limits (AC-005)
export const AUTO_COMMENT_TIERS: Record<string, TierLimits> = {
  starter: {
    commentsPerDay: 50,
    platforms: ['instagram', 'tiktok'],
    multiAccount: false,
    analytics: false,
    whiteLabel: false,
    apiAccess: false,
  },
  pro: {
    commentsPerDay: 200,
    platforms: ['instagram', 'tiktok', 'twitter', 'threads'],
    multiAccount: false,
    analytics: true,
    whiteLabel: false,
    apiAccess: false,
  },
  agency: {
    commentsPerDay: Infinity,
    platforms: ['instagram', 'tiktok', 'twitter', 'threads'],
    multiAccount: true,
    analytics: true,
    whiteLabel: true,
    apiAccess: false,
  },
}

// Auto DM tier limits (DM-008)
export const AUTO_DM_TIERS: Record<string, TierLimits> = {
  starter: {
    dmsPerDay: 30,
    platforms: ['instagram'],
    multiAccount: false,
    analytics: false,
    whiteLabel: false,
    apiAccess: false,
  },
  pro: {
    dmsPerDay: 75,
    platforms: ['instagram', 'tiktok', 'twitter'],
    multiAccount: false,
    analytics: true,
    whiteLabel: false,
    apiAccess: false,
  },
  agency: {
    dmsPerDay: Infinity,
    platforms: ['instagram', 'tiktok', 'twitter'],
    multiAccount: true,
    analytics: true,
    whiteLabel: true,
    apiAccess: false,
  },
}

/**
 * Get the tier limits for Auto Comment given a license tier string.
 * Defaults to starter limits if tier is unrecognized.
 */
export function getAutoCommentLimits(tier: string): TierLimits {
  return AUTO_COMMENT_TIERS[tier.toLowerCase()] ?? AUTO_COMMENT_TIERS.starter
}

/**
 * Get the tier limits for Auto DM given a license tier string.
 * Defaults to starter limits if tier is unrecognized.
 */
export function getAutoDMLimits(tier: string): TierLimits {
  return AUTO_DM_TIERS[tier.toLowerCase()] ?? AUTO_DM_TIERS.starter
}

/**
 * Check if a given platform is accessible for this tier.
 */
export function isPlatformAllowed(limits: TierLimits, platform: string): boolean {
  return limits.platforms.includes(platform.toLowerCase())
}

/**
 * Check if the daily action limit has been reached.
 * Returns true if the user can perform more actions.
 */
export function isWithinDailyLimit(limits: TierLimits, usedToday: number, actionType: 'comment' | 'dm'): boolean {
  const limit = actionType === 'comment' ? limits.commentsPerDay : limits.dmsPerDay
  if (limit === undefined || limit === Infinity) return true
  return usedToday < limit
}
