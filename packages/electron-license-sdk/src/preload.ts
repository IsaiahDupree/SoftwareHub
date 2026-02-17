// =============================================================================
// SoftwareHub License SDK - Preload Script
// Exposes safe license API to the renderer process via contextBridge
// =============================================================================
// This file runs in the activation window's preload context.
// DO NOT expose sensitive APIs here.
// =============================================================================

import { contextBridge, ipcRenderer } from 'electron';
import type { LicenseState } from './types';

contextBridge.exposeInMainWorld('licenseAPI', {
  activate: (licenseKey: string): Promise<LicenseState> =>
    ipcRenderer.invoke('license:activate', licenseKey),

  validate: (): Promise<LicenseState> =>
    ipcRenderer.invoke('license:validate'),

  getStatus: (): Promise<LicenseState> =>
    ipcRenderer.invoke('license:status'),

  notifyActivated: (state: LicenseState): void => {
    ipcRenderer.send('license:activated', state);
  },
});
