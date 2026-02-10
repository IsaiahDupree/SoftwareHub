export type PackageType = 'LOCAL_AGENT' | 'CLOUD_APP';

export type PackageStatus = 'operational' | 'degraded' | 'down' | 'maintenance';

export type ReleaseChannel = 'stable' | 'beta' | 'alpha' | 'dev';

export type LicenseType = 'standard' | 'pro' | 'enterprise' | 'trial';

export type LicenseStatus = 'active' | 'suspended' | 'revoked' | 'expired';

export type LicenseSource = 'purchase' | 'subscription' | 'gift' | 'promo' | 'admin' | 'trial';

export type EntitlementSource = 'purchase' | 'subscription' | 'gift' | 'promo' | 'admin' | 'bundle' | 'course';

export type EntitlementAccessLevel = 'full' | 'limited' | 'trial' | 'preview';

export type ActivityType =
  | 'release'
  | 'status_change'
  | 'announcement'
  | 'maintenance'
  | 'security'
  | 'feature'
  | 'download'
  | 'activation'
  | 'deactivation';

export type StatusCheckStatus = 'operational' | 'degraded' | 'down' | 'timeout' | 'error';

export type StatusCheckType = 'http' | 'tcp' | 'ping' | 'custom';

export type Package = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  type: PackageType;
  requires_macos: boolean;
  min_os_version: string | null;
  download_url: string | null;
  web_app_url: string | null;
  status: PackageStatus;
  status_message: string | null;
  last_status_check: string | null;
  status_check_url: string | null;
  current_version: string | null;
  current_release_id: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  price_cents: number | null;
  icon_url: string | null;
  banner_url: string | null;
  screenshots: string[];
  features: string[];
  requirements: Record<string, unknown>;
  related_course_id: string | null;
  documentation_url: string | null;
  support_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type PackageRelease = {
  id: string;
  package_id: string;
  version: string;
  version_major: number | null;
  version_minor: number | null;
  version_patch: number | null;
  channel: ReleaseChannel;
  download_url: string;
  file_name: string | null;
  file_size_bytes: number | null;
  checksum_sha256: string | null;
  signature: string | null;
  release_notes: string | null;
  release_notes_html: string | null;
  breaking_changes: string[] | null;
  highlights: string[] | null;
  min_os_version: string | null;
  supported_architectures: string[];
  is_current: boolean;
  is_published: boolean;
  is_yanked: boolean;
  downloads_count: number;
  created_at: string;
  published_at: string | null;
};

export type License = {
  id: string;
  user_id: string;
  package_id: string;
  license_key: string;
  license_key_hash: string;
  license_type: LicenseType;
  max_devices: number;
  active_devices: number;
  status: LicenseStatus;
  suspension_reason: string | null;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  suspended_at: string | null;
  revoked_at: string | null;
  source: LicenseSource;
  source_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
};

export type DeviceActivation = {
  id: string;
  license_id: string;
  device_id: string;
  device_id_hash: string;
  device_name: string | null;
  device_type: string | null;
  os_name: string | null;
  os_version: string | null;
  app_version: string | null;
  hardware_model: string | null;
  activation_token: string;
  token_expires_at: string;
  is_active: boolean;
  last_seen_at: string;
  last_validated_at: string;
  last_ip_address: string | null;
  activated_at: string;
  deactivated_at: string | null;
};

export type PackageEntitlement = {
  id: string;
  user_id: string;
  package_id: string;
  has_access: boolean;
  access_level: EntitlementAccessLevel;
  source: EntitlementSource;
  source_id: string | null;
  source_package_id: string | null;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

export type ActivityFeedItem = {
  id: string;
  type: ActivityType;
  package_id: string | null;
  user_id: string | null;
  release_id: string | null;
  title: string;
  body: string | null;
  body_html: string | null;
  action_url: string | null;
  action_label: string | null;
  metadata: Record<string, unknown>;
  is_public: boolean;
  is_pinned: boolean;
  created_at: string;
  published_at: string;
  expires_at: string | null;
};

export type StatusCheck = {
  id: string;
  package_id: string;
  status: StatusCheckStatus;
  response_time_ms: number | null;
  status_code: number | null;
  error_message: string | null;
  check_type: StatusCheckType;
  check_url: string | null;
  checked_at: string;
};

export type DownloadLog = {
  id: string;
  package_id: string;
  release_id: string | null;
  user_id: string | null;
  license_id: string | null;
  download_url: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  ip_address: string | null;
  user_agent: string | null;
  country_code: string | null;
  started_at: string;
  completed_at: string | null;
  bytes_downloaded: number | null;
  is_complete: boolean;
  error_message: string | null;
};

// Convenience types for API responses
export type PackageWithRelease = Package & {
  current_release?: PackageRelease | null;
};

export type LicenseWithPackage = License & {
  package?: Package;
};
