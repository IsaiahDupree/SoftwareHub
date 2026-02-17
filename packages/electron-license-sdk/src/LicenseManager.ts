// =============================================================================
// SoftwareHub Electron License SDK - LicenseManager
// =============================================================================
// Drop this into any Electron main process. Call `initialize()` on app start.
// Use `getStatus()` to check license state before enabling features.
// =============================================================================

import * as os from 'os';
import * as crypto from 'crypto';
import {
  LicenseSDKConfig,
  DeviceInfo,
  ActivationResponse,
  ValidationResponse,
  DeactivationResponse,
  LicenseState,
  LicenseStatus,
  StoredLicenseData,
  LicenseError,
} from './types';
import { obfuscateToken, deobfuscateToken } from './obfuscate';

// electron-store is loaded dynamically to avoid issues if not in Electron context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoreType = any;

export class LicenseManager {
  private config: Required<LicenseSDKConfig>;
  private store: StoreType | null = null;
  private deviceInfo: DeviceInfo | null = null;

  constructor(config: LicenseSDKConfig) {
    this.config = {
      offlineGraceDays: 7,
      refreshBeforeDays: 5,
      ...config,
    };
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Initialize the license manager. Call this from Electron's main process
   * before the app window loads.
   */
  async initialize(): Promise<LicenseState> {
    this.store = await this.loadStore();
    this.deviceInfo = await this.getDeviceInfo();

    const stored = this.getStoredData();

    if (!stored) {
      return { status: 'not_activated' };
    }

    // Check if token needs refresh (within refreshBeforeDays of expiry)
    const shouldRefresh = this.shouldRefreshToken(stored);

    if (shouldRefresh) {
      // We need the raw license key to refresh — stored data only has masked key
      // If we can't refresh now, continue with existing token if still valid
    }

    return this.validate(stored.activationToken, stored.deviceId);
  }

  // ---------------------------------------------------------------------------
  // Activate
  // ---------------------------------------------------------------------------

  /**
   * Activate the app with a license key. Call when user submits their key.
   * Returns the new license state.
   */
  async activate(licenseKey: string): Promise<LicenseState> {
    const normalizedKey = this.normalizeLicenseKey(licenseKey);

    if (!this.isValidKeyFormat(normalizedKey)) {
      return {
        status: 'invalid_key',
        errorMessage: 'Invalid license key format. Expected: XXXX-XXXX-XXXX-XXXX',
      };
    }

    const device = await this.getDeviceInfo();

    const payload = {
      license_key: normalizedKey,
      device_id: device.deviceId,
      device_name: device.deviceName,
      device_type: device.deviceType,
      os_name: device.osName,
      os_version: device.osVersion,
      app_version: this.config.appVersion,
      ...(device.hardwareModel && { hardware_model: device.hardwareModel }),
    };

    try {
      const response = await this.apiPost<ActivationResponse>(
        '/api/licenses/activate',
        payload,
      );

      const storedData: StoredLicenseData = {
        activationToken: response.activation_token,
        expiresAt: response.expires_at,
        deviceId: response.device_id,
        licenseId: response.license_id,
        packageId: response.package_id,
        maskedKey: this.maskLicenseKey(normalizedKey),
        lastValidated: new Date().toISOString(),
      };

      this.saveStoredData(storedData);

      return {
        status: 'active',
        licenseKey: storedData.maskedKey,
        expiresAt: response.expires_at,
        lastValidated: storedData.lastValidated,
        activationToken: response.activation_token,
        deviceId: response.device_id,
        licenseId: response.license_id,
      };
    } catch (err) {
      return this.handleActivationError(err);
    }
  }

  // ---------------------------------------------------------------------------
  // Validate
  // ---------------------------------------------------------------------------

  /**
   * Validate the stored activation token against the server.
   * Falls back to offline validation if network is unavailable.
   */
  async validate(
    token?: string,
    deviceId?: string,
  ): Promise<LicenseState> {
    const stored = this.getStoredData();

    const activeToken = token ?? stored?.activationToken;
    const activeDeviceId = deviceId ?? stored?.deviceId;

    if (!activeToken || !activeDeviceId) {
      return { status: 'not_activated' };
    }

    try {
      const response = await this.apiPost<ValidationResponse>(
        '/api/licenses/validate',
        {
          activation_token: activeToken,
          device_id: activeDeviceId,
        },
      );

      // Update last validated timestamp
      if (stored) {
        stored.lastValidated = new Date().toISOString();
        stored.lastValidationResult = response;
        this.saveStoredData(stored);
      }

      if (response.valid) {
        const status: LicenseStatus = response.grace_period ? 'grace_period' : 'active';
        return {
          status,
          licenseKey: stored?.maskedKey,
          licenseType: response.license_type,
          expiresAt: response.expires_at,
          lastValidated: stored?.lastValidated,
          licenseId: response.license_id,
        };
      } else {
        return this.handleValidationFailure(response.code, stored);
      }
    } catch (err) {
      // Network unavailable — use offline fallback
      return this.offlineFallback(stored, err);
    }
  }

  // ---------------------------------------------------------------------------
  // Deactivate
  // ---------------------------------------------------------------------------

  /**
   * Deactivate the license on this device. Call when user wants to
   * transfer their license to a different machine.
   */
  async deactivate(): Promise<{ success: boolean; remainingDevices?: number; error?: string }> {
    const stored = this.getStoredData();

    if (!stored) {
      return { success: false, error: 'No active license to deactivate' };
    }

    try {
      const response = await this.apiPost<DeactivationResponse>(
        '/api/licenses/deactivate',
        { activation_token: stored.activationToken },
      );

      this.clearStoredData();

      return {
        success: response.deactivated,
        remainingDevices: response.remaining_devices,
      };
    } catch {
      // Even if deactivation fails server-side, clear local data
      this.clearStoredData();
      return { success: true };
    }
  }

  // ---------------------------------------------------------------------------
  // Status helpers
  // ---------------------------------------------------------------------------

  /**
   * Get the current license state synchronously from stored data.
   * Use this for quick checks (e.g., to gate UI elements).
   * For definitive validation, call validate() instead.
   */
  getStatusSync(): LicenseState {
    const stored = this.getStoredData();

    if (!stored) {
      return { status: 'not_activated' };
    }

    // Check if token has expired locally
    const expiresAt = new Date(stored.expiresAt);
    const now = new Date();

    if (expiresAt < now) {
      const graceDays = this.config.offlineGraceDays;
      const graceExpiry = new Date(expiresAt.getTime() + graceDays * 24 * 60 * 60 * 1000);

      if (now < graceExpiry) {
        return {
          status: 'grace_period',
          licenseKey: stored.maskedKey,
          licenseType: stored.licenseType,
          expiresAt: stored.expiresAt,
          lastValidated: stored.lastValidated,
          errorMessage: 'License expiring — please reconnect to renew',
        };
      }

      return {
        status: 'offline_expired',
        licenseKey: stored.maskedKey,
        errorMessage: 'License has expired. Please renew at softwarehub.com',
      };
    }

    // Check if we've validated recently (offline grace period)
    const lastValidated = new Date(stored.lastValidated);
    const offlineGraceMs = this.config.offlineGraceDays * 24 * 60 * 60 * 1000;
    const offlineExpiry = new Date(lastValidated.getTime() + offlineGraceMs);

    if (now > offlineExpiry) {
      return {
        status: 'offline_expired',
        licenseKey: stored.maskedKey,
        errorMessage: `Offline too long. Please connect to the internet to validate your license.`,
      };
    }

    return {
      status: stored.lastValidationResult?.grace_period ? 'grace_period' : 'active',
      licenseKey: stored.maskedKey,
      licenseType: stored.licenseType,
      expiresAt: stored.expiresAt,
      lastValidated: stored.lastValidated,
    };
  }

  /**
   * Returns true if the app should be allowed to run based on stored state.
   * Use this for quick gating without a network call.
   */
  isLicensedSync(): boolean {
    const state = this.getStatusSync();
    return state.status === 'active' || state.status === 'grace_period' || state.status === 'offline';
  }

  // ---------------------------------------------------------------------------
  // Private: Device ID
  // ---------------------------------------------------------------------------

  private async getDeviceInfo(): Promise<DeviceInfo> {
    if (this.deviceInfo) return this.deviceInfo;

    const deviceId = await this.generateDeviceId();
    const platform = os.platform();
    const release = os.release();

    const osName = platform === 'darwin' ? 'macOS'
      : platform === 'win32' ? 'Windows'
      : 'Linux';

    this.deviceInfo = {
      deviceId,
      deviceName: os.hostname(),
      deviceType: 'desktop',
      osName,
      osVersion: release,
    };

    return this.deviceInfo;
  }

  private async generateDeviceId(): Promise<string> {
    // Try to use node-machine-id for a stable hardware-based ID
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { machineIdSync } = require('node-machine-id');
      const rawId = machineIdSync(true); // true = original (not hashed)
      return crypto.createHash('sha256').update(rawId).digest('hex').substring(0, 32);
    } catch {
      // Fallback: combine hostname + username
      const raw = `${os.hostname()}-${os.userInfo().username}-${os.platform()}`;
      return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32);
    }
  }

  // ---------------------------------------------------------------------------
  // Private: Secure storage (electron-store)
  // ---------------------------------------------------------------------------

  private async loadStore(): Promise<StoreType> {
    try {
      // Dynamic import to avoid issues in non-Electron environments
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Store = require('electron-store');
      return new Store({
        name: `softwarehub-license-${this.config.packageSlug}`,
        encryptionKey: this.getEncryptionKey(),
        schema: {
          license: {
            type: 'object',
            properties: {
              activationToken: { type: 'string' },
              expiresAt: { type: 'string' },
              deviceId: { type: 'string' },
              licenseId: { type: 'string' },
              packageId: { type: 'string' },
              maskedKey: { type: 'string' },
              lastValidated: { type: 'string' },
            },
          },
        },
      });
    } catch {
      // In test environments without electron-store, use in-memory storage
      return new InMemoryStore();
    }
  }

  private getEncryptionKey(): string {
    // Derive a per-package, per-machine encryption key
    const raw = `softwarehub-${this.config.packageSlug}-${os.hostname()}-${os.userInfo().username}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private getStoredData(): StoredLicenseData | null {
    if (!this.store) return null;
    try {
      const stored = this.store.get('license') as StoredLicenseData | null;
      if (!stored) return null;

      // Deobfuscate the activation token after reading. The deviceId is stored
      // in plaintext alongside the token and is used as part of the salt.
      return {
        ...stored,
        activationToken: deobfuscateToken(
          stored.activationToken,
          this.config.packageSlug,
          stored.deviceId,
        ),
      };
    } catch {
      return null;
    }
  }

  private saveStoredData(data: StoredLicenseData): void {
    if (!this.store) return;
    try {
      // Obfuscate the activation token before persisting to add a defense-in-depth
      // layer on top of electron-store's encryptionKey-based encryption.
      const toStore: StoredLicenseData = {
        ...data,
        activationToken: obfuscateToken(
          data.activationToken,
          this.config.packageSlug,
          data.deviceId,
        ),
      };
      this.store.set('license', toStore);
    } catch (err) {
      console.error('[SoftwareHub License] Failed to save license data:', err);
    }
  }

  private clearStoredData(): void {
    if (!this.store) return;
    try {
      this.store.delete('license');
    } catch {
      // Ignore
    }
  }

  // ---------------------------------------------------------------------------
  // Private: API calls
  // ---------------------------------------------------------------------------

  private async apiPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      const code = (data.code as string) ?? 'UNKNOWN';
      const message = (data.error as string) ?? `HTTP ${response.status}`;

      if (response.status === 429) {
        throw new LicenseError('RATE_LIMITED', 'Too many requests. Please wait before trying again.');
      }

      throw new LicenseError(code as never, message);
    }

    return data as T;
  }

  // ---------------------------------------------------------------------------
  // Private: Helpers
  // ---------------------------------------------------------------------------

  private normalizeLicenseKey(key: string): string {
    return key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})(?=.)/g, '$1-');
  }

  private isValidKeyFormat(key: string): boolean {
    return /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(key);
  }

  private maskLicenseKey(key: string): string {
    const parts = key.split('-');
    if (parts.length === 4) {
      return `****-****-****-${parts[3]}`;
    }
    return '****-****-****-****';
  }

  private shouldRefreshToken(stored: StoredLicenseData): boolean {
    const expiresAt = new Date(stored.expiresAt);
    const refreshThresholdMs = this.config.refreshBeforeDays * 24 * 60 * 60 * 1000;
    const refreshAt = new Date(expiresAt.getTime() - refreshThresholdMs);
    return new Date() >= refreshAt;
  }

  private offlineFallback(stored: StoredLicenseData | null, err: unknown): LicenseState {
    console.warn('[SoftwareHub License] Network unavailable, using offline fallback:', err);

    if (!stored) {
      return { status: 'not_activated' };
    }

    const expiresAt = new Date(stored.expiresAt);
    const now = new Date();

    if (expiresAt < now) {
      return {
        status: 'offline_expired',
        licenseKey: stored.maskedKey,
        errorMessage: 'License expired. Please connect to the internet to renew.',
      };
    }

    const lastValidated = new Date(stored.lastValidated);
    const offlineGraceMs = this.config.offlineGraceDays * 24 * 60 * 60 * 1000;

    if (now.getTime() - lastValidated.getTime() > offlineGraceMs) {
      return {
        status: 'offline_expired',
        licenseKey: stored.maskedKey,
        errorMessage: 'Please connect to the internet to validate your license.',
      };
    }

    return {
      status: 'offline',
      licenseKey: stored.maskedKey,
      licenseType: stored.licenseType,
      expiresAt: stored.expiresAt,
      lastValidated: stored.lastValidated,
      errorMessage: 'Offline mode — using cached license',
    };
  }

  private handleActivationError(err: unknown): LicenseState {
    if (err instanceof LicenseError) {
      const statusMap: Record<string, LicenseStatus> = {
        LICENSE_INACTIVE: 'revoked',
        LICENSE_EXPIRED: 'expired',
        LICENSE_REVOKED: 'revoked',
        LICENSE_SUSPENDED: 'suspended',
        DEVICE_LIMIT: 'device_limit',
        INVALID_KEY: 'invalid_key',
        RATE_LIMITED: 'error',
      };

      const status = statusMap[err.code] ?? 'error';
      return { status, errorMessage: err.message };
    }

    return {
      status: 'error',
      errorMessage: 'Failed to activate license. Check your internet connection.',
    };
  }

  private handleValidationFailure(code: string | undefined, stored: StoredLicenseData | null): LicenseState {
    switch (code) {
      case 'TOKEN_INVALID':
        this.clearStoredData();
        return {
          status: 'not_activated',
          errorMessage: 'License session expired. Please re-enter your license key.',
        };
      case 'DEVICE_MISMATCH':
        this.clearStoredData();
        return {
          status: 'not_activated',
          errorMessage: 'Device mismatch. Please re-activate your license.',
        };
      case 'LICENSE_REVOKED':
        return {
          status: 'revoked',
          licenseKey: stored?.maskedKey,
          errorMessage: 'Your license has been revoked. Contact support.',
        };
      case 'LICENSE_SUSPENDED':
        return {
          status: 'suspended',
          licenseKey: stored?.maskedKey,
          errorMessage: 'Your license has been suspended. Contact support.',
        };
      case 'LICENSE_EXPIRED':
        return {
          status: 'expired',
          licenseKey: stored?.maskedKey,
          errorMessage: 'Your license has expired. Please renew at softwarehub.com.',
        };
      default:
        return {
          status: 'error',
          licenseKey: stored?.maskedKey,
          errorMessage: 'License validation failed. Please try again.',
        };
    }
  }
}

// ---------------------------------------------------------------------------
// In-memory store fallback for test environments
// ---------------------------------------------------------------------------
class InMemoryStore {
  private data: Record<string, unknown> = {};

  get(key: string): unknown {
    return this.data[key] ?? null;
  }

  set(key: string, value: unknown): void {
    this.data[key] = value;
  }

  delete(key: string): void {
    delete this.data[key];
  }
}
