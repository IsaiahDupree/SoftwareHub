# @softwarehub/electron-license-sdk

Reusable license activation and validation SDK for all SoftwareHub Electron desktop apps.

## Installation

```bash
npm install @softwarehub/electron-license-sdk
```

## Quick Start (Electron main process)

```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import { LicenseManager, LicenseActivationWindow } from '@softwarehub/electron-license-sdk';

const licenseManager = new LicenseManager({
  baseUrl: 'https://softwarehub.app',     // Your SoftwareHub URL
  packageSlug: 'watermark-remover',        // Product slug from database
  appVersion: '1.0.0',
  offlineGraceDays: 7,                     // Allow 7 days offline
  refreshBeforeDays: 5,                    // Refresh token 5 days before expiry
});

async function createMainWindow() {
  const mainWindow = new BrowserWindow({ /* ... */ });

  // Initialize license on startup
  const state = await licenseManager.initialize();

  if (state.status === 'not_activated') {
    // Show activation window (modal)
    const activationWindow = new LicenseActivationWindow({
      BrowserWindow,
      ipcMain,
      licenseManager,
      productName: 'Watermark Remover',
      portalUrl: 'https://softwarehub.app/packages/watermark-remover',
      parentWindow: mainWindow,
    });

    const result = await activationWindow.show();

    if (result.status !== 'active') {
      app.quit(); // Exit if not activated
      return;
    }
  } else if (state.status === 'offline_expired' || state.status === 'revoked') {
    // Block app launch for expired/revoked licenses
    dialog.showErrorBox('License Invalid', state.errorMessage ?? 'License is not valid.');
    app.quit();
    return;
  }

  // License is valid — load the main app
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createMainWindow);
```

## License States

| Status | Meaning | Action |
|--------|---------|--------|
| `active` | License valid | Allow full access |
| `grace_period` | Expiring soon | Warn user, allow access |
| `offline` | Network unavailable, using cache | Allow access |
| `not_activated` | No license key | Show activation window |
| `expired` | License has expired | Prompt renewal |
| `revoked` | License revoked by admin | Block access |
| `suspended` | Temporarily suspended | Block access |
| `device_limit` | Too many devices | Ask user to deactivate another |
| `offline_expired` | Token expired and offline | Block access |
| `invalid_key` | Invalid key format/not found | Show error |
| `error` | Unexpected error | Show retry option |

## Gating Features by License Tier

```typescript
// In renderer process (via ipcRenderer)
const status = await window.licenseAPI.getStatus();

if (status.licenseType === 'pro' || status.licenseType === 'enterprise') {
  enableBatchProcessing();
}
```

## Deactivating a License

```typescript
// In Electron main process, triggered by user action
const result = await licenseManager.deactivate();
if (result.success) {
  dialog.showMessageBox({ message: `License deactivated. ${result.remainingDevices} devices remaining.` });
}
```

## Secure Storage

The SDK uses `electron-store` with per-machine AES encryption. The license token is stored in:
- macOS: `~/Library/Application Support/<app-name>/softwarehub-license-<slug>.json`
- Windows: `%APPDATA%\<app-name>\softwarehub-license-<slug>.json`
- Linux: `~/.config/<app-name>/softwarehub-license-<slug>.json`

The encryption key is derived from the machine hostname and username, making it machine-specific.

## Offline Support

The SDK caches the activation token and allows offline use for `offlineGraceDays` days (default: 7).
The JWT token itself expires after 30 days (server-configured). The SDK will attempt to refresh
the token `refreshBeforeDays` days before it expires by calling the activate endpoint again.

## Security Notes

- Never store the license key after activation — only the masked key is kept locally
- The activation token is a signed JWT — the signature is only verified server-side
- Encryption key is machine-specific, preventing token sharing between machines
- Token contains the device ID hash, so tokens can't be copied to other machines
