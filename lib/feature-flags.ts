interface FeatureFlags {
  [key: string]: boolean;
}

const defaultFlags: FeatureFlags = {
  community_chat: true,
  course_certificates: true,
  ai_features: true,
  beta_dashboard: false,
  new_checkout: false,
};

let overrides: FeatureFlags = {};

export function isFeatureEnabled(flag: string): boolean {
  if (flag in overrides) return overrides[flag];
  return defaultFlags[flag] ?? false;
}

export function setFeatureFlag(flag: string, enabled: boolean): void {
  overrides[flag] = enabled;
}

export function getFeatureFlags(): FeatureFlags {
  return { ...defaultFlags, ...overrides };
}

export async function loadFeatureFlags(): Promise<void> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data } = await supabase
      .from("feature_flags")
      .select("name, enabled")
      .eq("active", true);

    if (data) {
      overrides = {};
      data.forEach((flag: { name: string; enabled: boolean }) => {
        overrides[flag.name] = flag.enabled;
      });
    }
  } catch {
    // Use defaults if DB unavailable
  }
}
