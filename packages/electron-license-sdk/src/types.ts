// =============================================================================
// SoftwareHub Electron License SDK - Type Definitions
// =============================================================================

export interface LicenseSDKConfig {
  /** Base URL of your SoftwareHub instance, e.g. "https://yourdomain.com" */
  baseUrl: string;
  /** The package slug for this product, e.g. "watermark-remover" */
  packageSlug: string;
  /** App version string, e.g. "1.2.0" */
  appVersion: string;
  /** How many days to allow offline use before requiring re-validation (default: 7) */
  offlineGraceDays?: number;
  /** How many days before token expiry to trigger refresh (default: 5) */
  refreshBeforeDays?: number;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'laptop' | 'server';
  osName: string;
  osVersion: string;
  hardwareModel?: string;
}

export interface ActivationRequest {
  license_key: string;
  device_id: string;
  device_name: string;
  device_type: string;
  os_name: string;
  os_version: string;
  app_version: string;
  hardware_model?: string;
}

export interface ActivationResponse {
  activation_token: string;
  expires_at: string;
  device_id: string;
  license_id: string;
  package_id: string;
}

export interface ValidationResponse {
  valid: boolean;
  license_id?: string;
  package_id?: string;
  license_type?: string;
  expires_at?: string | null;
  grace_period?: boolean;
  code?: string;
}

export interface DeactivationResponse {
  deactivated: boolean;
  remaining_devices: number;
}

export type LicenseStatus =
  | 'active'          // License valid, app should run
  | 'grace_period'    // License expiring soon, warn user
  | 'not_activated'   // No license key entered
  | 'expired'         // License has expired
  | 'revoked'         // License was revoked by admin
  | 'suspended'       // License temporarily suspended
  | 'device_limit'    // Too many devices activated
  | 'invalid_key'     // Invalid license key format or not found
  | 'offline'         // Couldn't reach server, using cached token
  | 'offline_expired' // Cached token expired and offline — block
  | 'error';          // Unexpected error

export interface LicenseState {
  status: LicenseStatus;
  licenseKey?: string;     // Masked key for display
  licenseType?: string;
  expiresAt?: string | null;
  lastValidated?: string;
  activationToken?: string;
  deviceId?: string;
  licenseId?: string;
  errorMessage?: string;
}

export interface StoredLicenseData {
  activationToken: string;
  expiresAt: string;
  deviceId: string;
  licenseId: string;
  packageId: string;
  maskedKey: string;
  licenseType?: string;
  lastValidated: string;
  lastValidationResult?: ValidationResponse;
}

export type LicenseErrorCode =
  | 'LICENSE_INACTIVE'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_REVOKED'
  | 'LICENSE_SUSPENDED'
  | 'DEVICE_LIMIT'
  | 'DEVICE_MISMATCH'
  | 'TOKEN_INVALID'
  | 'INVALID_KEY'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

export class LicenseError extends Error {
  constructor(
    public readonly code: LicenseErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'LicenseError';
  }
}
