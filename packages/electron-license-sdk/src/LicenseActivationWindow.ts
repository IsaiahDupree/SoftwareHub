// =============================================================================
// SoftwareHub Electron License SDK - Activation Window Helper
// =============================================================================
// Creates the license activation window in the main process.
// This shows a modal window with the license key input form.
// =============================================================================

import { LicenseManager } from './LicenseManager';
import { LicenseState } from './types';

interface ActivationWindowOptions {
  /** Reference to the Electron BrowserWindow class */
  BrowserWindow: Electron.BrowserWindowConstructorOptions & { new(options: Electron.BrowserWindowConstructorOptions): Electron.BrowserWindow };
  /** Reference to the Electron ipcMain object */
  ipcMain: Electron.IpcMain;
  /** The LicenseManager instance to use */
  licenseManager: LicenseManager;
  /** Product display name for the activation window title */
  productName: string;
  /** SoftwareHub portal URL for "Buy License" link */
  portalUrl?: string;
  /** Optional parent window to attach modal to */
  parentWindow?: Electron.BrowserWindow;
}

export class LicenseActivationWindow {
  private options: ActivationWindowOptions;

  constructor(options: ActivationWindowOptions) {
    this.options = options;
    this.registerIpcHandlers();
  }

  private registerIpcHandlers(): void {
    const { ipcMain, licenseManager } = this.options;

    ipcMain.handle('license:activate', async (_event, licenseKey: string): Promise<LicenseState> => {
      return licenseManager.activate(licenseKey);
    });

    ipcMain.handle('license:validate', async (): Promise<LicenseState> => {
      return licenseManager.validate();
    });

    ipcMain.handle('license:deactivate', async (): Promise<{ success: boolean }> => {
      return licenseManager.deactivate();
    });

    ipcMain.handle('license:status', (): LicenseState => {
      return licenseManager.getStatusSync();
    });
  }

  /**
   * Show the license activation modal window.
   * Returns a promise that resolves with the license state after activation.
   */
  show(): Promise<LicenseState> {
    return new Promise((resolve) => {
      const { BrowserWindow, productName, portalUrl, parentWindow } = this.options;

      const win = new (BrowserWindow as never)({
        width: 480,
        height: 520,
        title: `Activate ${productName}`,
        resizable: false,
        minimizable: false,
        maximizable: false,
        modal: !!parentWindow,
        parent: parentWindow,
        center: true,
        backgroundColor: '#0f172a',
        show: false,
        titleBarStyle: 'hiddenInset',
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          preload: require('path').join(__dirname, 'preload.js'),
        },
      }) as Electron.BrowserWindow;

      // Load the inline HTML activation form
      win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(
        this.getActivationHTML(productName, portalUrl ?? 'https://softwarehub.app'),
      )}`);

      win.once('ready-to-show', () => win.show());

      // Listen for activation completion from the renderer
      const { ipcMain } = this.options;
      ipcMain.once('license:activated', (_event, state: LicenseState) => {
        win.close();
        resolve(state);
      });

      win.on('closed', () => {
        // If window closed without activation, resolve with not_activated
        resolve({ status: 'not_activated' });
      });
    });
  }

  private getActivationHTML(productName: string, portalUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate ${productName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-app-region: drag;
      padding: 32px;
    }
    .card {
      -webkit-app-region: no-drag;
      width: 100%;
      max-width: 400px;
    }
    .logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 8px;
      color: #f1f5f9;
    }
    p {
      font-size: 14px;
      text-align: center;
      color: #94a3b8;
      margin-bottom: 28px;
      line-height: 1.5;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #cbd5e1;
      margin-bottom: 8px;
    }
    input[type="text"] {
      width: 100%;
      padding: 12px 16px;
      font-size: 16px;
      font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
      letter-spacing: 0.1em;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      color: #f1f5f9;
      outline: none;
      transition: border-color 0.2s;
      text-transform: uppercase;
    }
    input[type="text"]:focus { border-color: #6366f1; }
    input[type="text"]::placeholder { color: #475569; letter-spacing: 0.1em; }
    .error {
      font-size: 13px;
      color: #f87171;
      margin-top: 8px;
      min-height: 18px;
    }
    button {
      width: 100%;
      padding: 13px;
      margin-top: 20px;
      font-size: 15px;
      font-weight: 600;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
    }
    button:hover:not(:disabled) { background: #4f46e5; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
    .footer a:hover { text-decoration: underline; }
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff40;
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🔑</div>
    <h1>Activate ${productName}</h1>
    <p>Enter your license key to unlock all features.<br>Find your key at <strong>softwarehub.app/app/licenses</strong></p>
    <label for="key">License Key</label>
    <input
      type="text"
      id="key"
      placeholder="XXXX-XXXX-XXXX-XXXX"
      maxlength="19"
      autocomplete="off"
      spellcheck="false"
    />
    <div class="error" id="error"></div>
    <button id="activate">Activate License</button>
    <div class="footer">
      Don't have a license? <a href="${portalUrl}" target="_blank">Purchase one</a>
    </div>
  </div>

  <script>
    const input = document.getElementById('key');
    const btn = document.getElementById('activate');
    const errorEl = document.getElementById('error');

    // Auto-format input as user types
    input.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (val.length > 16) val = val.slice(0, 16);
      const parts = val.match(/.{1,4}/g) || [];
      e.target.value = parts.join('-');
      errorEl.textContent = '';
    });

    btn.addEventListener('click', async () => {
      const key = input.value.trim();
      if (!key) {
        errorEl.textContent = 'Please enter your license key.';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>Activating...';
      errorEl.textContent = '';

      try {
        const result = await window.licenseAPI.activate(key);

        if (result.status === 'active') {
          btn.innerHTML = '✓ Activated!';
          btn.style.background = '#10b981';
          setTimeout(() => {
            window.licenseAPI.notifyActivated(result);
          }, 800);
        } else {
          errorEl.textContent = result.errorMessage || 'Activation failed. Please try again.';
          btn.disabled = false;
          btn.innerHTML = 'Activate License';
        }
      } catch (err) {
        errorEl.textContent = 'Unexpected error. Please try again.';
        btn.disabled = false;
        btn.innerHTML = 'Activate License';
      }
    });

    // Allow Enter key to submit
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  </script>
</body>
</html>`;
  }
}
