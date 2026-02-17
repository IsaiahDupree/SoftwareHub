// =============================================================================
// SoftwareHub Electron Crash Reporter
// =============================================================================
// Integrates with @sentry/electron for crash reporting.
// Includes user consent management before enabling reporting.
// User data is kept anonymous - no PII collected.
// =============================================================================

import * as os from 'os';

export interface CrashReporterConfig {
  dsn: string;
  appName: string;
  appVersion: string;
  environment?: string;
}

export interface CrashReporterConsent {
  granted: boolean;
  timestamp: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoreType = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SentryType = any;

const CONSENT_KEY = 'crashReporterConsent';

export class CrashReporter {
  private config: CrashReporterConfig;
  private store: StoreType = null;
  private sentry: SentryType = null;
  private sentryAvailable = false;

  constructor(config: CrashReporterConfig) {
    this.config = config;
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Initialize crash reporting. Checks stored consent first.
   * If no consent has been stored, returns { needsConsent: true }.
   * Call this from the Electron main process before the app window loads.
   */
  async initialize(): Promise<{ needsConsent: boolean }> {
    this.store = await this.loadStore();
    this.sentry = this.loadSentry();

    const consent = this.getStoredConsent();

    if (consent === null) {
      // No consent decision stored — caller should show the consent dialog
      return { needsConsent: true };
    }

    if (consent.granted) {
      this.enableSentry();
    }

    return { needsConsent: false };
  }

  // ---------------------------------------------------------------------------
  // Consent management
  // ---------------------------------------------------------------------------

  /**
   * Grant consent and enable crash reporting immediately.
   * Persists the consent decision to electron-store.
   */
  grantConsent(): void {
    const consent: CrashReporterConsent = {
      granted: true,
      timestamp: new Date().toISOString(),
    };
    this.saveConsent(consent);
    this.enableSentry();
  }

  /**
   * Revoke consent and disable crash reporting.
   * Persists the revocation decision to electron-store.
   */
  revokeConsent(): void {
    const consent: CrashReporterConsent = {
      granted: false,
      timestamp: new Date().toISOString(),
    };
    this.saveConsent(consent);
    // Sentry doesn't expose a clean "disable" API — we simply stop calling it
    // and guard all operations with hasConsent()
  }

  /**
   * Check if the user has granted consent for crash reporting.
   */
  hasConsent(): boolean {
    const consent = this.getStoredConsent();
    return consent?.granted === true;
  }

  // ---------------------------------------------------------------------------
  // Error capture
  // ---------------------------------------------------------------------------

  /**
   * Manually capture an error. No-op if consent is not granted or Sentry
   * is not available.
   */
  captureError(error: Error, context?: Record<string, unknown>): void {
    if (!this.hasConsent()) return;

    if (this.sentryAvailable && this.sentry) {
      try {
        if (context) {
          this.sentry.withScope((scope: SentryType) => {
            scope.setExtras(context);
            this.sentry.captureException(error);
          });
        } else {
          this.sentry.captureException(error);
        }
      } catch (sentryErr) {
        // Sentry itself failed — fall back to console
        console.error('[CrashReporter] Failed to capture error via Sentry:', sentryErr);
        console.error('[CrashReporter] Original error:', error);
      }
    } else {
      // Sentry not available — log to console as fallback
      console.error('[CrashReporter] Error (Sentry unavailable):', error);
      if (context) {
        console.error('[CrashReporter] Context:', context);
      }
    }
  }

  /**
   * Set anonymous user context. No PII — only app version and license tier.
   */
  setContext(context: { tier?: string; appVersion?: string }): void {
    if (!this.hasConsent()) return;
    if (!this.sentryAvailable || !this.sentry) return;

    try {
      this.sentry.setTag('license_tier', context.tier ?? 'unknown');
      this.sentry.setTag('app_version', context.appVersion ?? this.config.appVersion);
    } catch (err) {
      console.error('[CrashReporter] Failed to set context:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Private: Sentry initialization
  // ---------------------------------------------------------------------------

  private enableSentry(): void {
    if (!this.sentryAvailable || !this.sentry) return;

    try {
      this.sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment ?? 'production',
        release: `${this.config.appName}@${this.config.appVersion}`,
        // Keep user fully anonymous — only attach OS platform (non-identifying)
        initialScope: {
          tags: {
            app_name: this.config.appName,
            app_version: this.config.appVersion,
            os_platform: os.platform(),
          },
        },
        // Disable automatic PII collection
        sendDefaultPii: false,
        // Limit breadcrumbs to avoid sensitive data leaking via user actions
        maxBreadcrumbs: 20,
        beforeSend(event: SentryType) {
          // Strip any user identifiers that Sentry might auto-collect
          if (event.user) {
            delete event.user.email;
            delete event.user.username;
            delete event.user.ip_address;
          }
          return event;
        },
      });
    } catch (err) {
      console.error('[CrashReporter] Failed to initialize Sentry:', err);
    }
  }

  private loadSentry(): SentryType | null {
    try {
      // Dynamic require to avoid bundling issues when @sentry/electron is not installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sentry = require('@sentry/electron');
      this.sentryAvailable = true;
      return sentry;
    } catch {
      // @sentry/electron is not installed — crash reporting will use console fallback
      this.sentryAvailable = false;
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private: Persistent store (electron-store)
  // ---------------------------------------------------------------------------

  private async loadStore(): Promise<StoreType> {
    try {
      // Dynamic import to avoid issues in non-Electron environments
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Store = require('electron-store');
      return new Store({
        name: `softwarehub-crash-reporter-${this.config.appName.toLowerCase().replace(/\s+/g, '-')}`,
        schema: {
          [CONSENT_KEY]: {
            type: 'object',
            properties: {
              granted: { type: 'boolean' },
              timestamp: { type: 'string' },
            },
            required: ['granted', 'timestamp'],
          },
        },
      });
    } catch {
      // In test environments without electron-store, use in-memory storage
      return new InMemoryStore();
    }
  }

  private getStoredConsent(): CrashReporterConsent | null {
    if (!this.store) return null;
    try {
      return this.store.get(CONSENT_KEY) as CrashReporterConsent | null ?? null;
    } catch {
      return null;
    }
  }

  private saveConsent(consent: CrashReporterConsent): void {
    if (!this.store) return;
    try {
      this.store.set(CONSENT_KEY, consent);
    } catch (err) {
      console.error('[CrashReporter] Failed to save consent:', err);
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
