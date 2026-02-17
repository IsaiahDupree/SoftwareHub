import type { Generation } from './types'

declare global {
  interface Window {
    electronAPI: {
      license: {
        initialize(): Promise<LicenseState>
        activate(key: string): Promise<LicenseState>
        deactivate(): Promise<{ success: boolean }>
        getStatus(): Promise<LicenseState>
      }
      sora: {
        generate(params: {
          prompt: string
          aspectRatio: string
          duration: number
          quality: string
          apiKey: string
          projectId: string
        }): Promise<{ id: string; status: string }>
        getGenerations(projectId: string): Promise<Generation[]>
        openVideo(path: string): Promise<void>
        getSettings(): Promise<{ apiKey?: string; outputFolder?: string }>
        saveSettings(settings: { apiKey?: string; outputFolder?: string }): Promise<void>
        onGenerationUpdate(cb: (generation: Generation) => void): void
      }
      dialog: {
        openFolder(): Promise<string | null>
      }
      shell: {
        openPath(p: string): Promise<void>
        openExternal(url: string): Promise<void>
      }
      app: {
        getVersion(): Promise<string>
      }
      updater: {
        checkNow(): Promise<void>
        download(): Promise<void>
        install(): void
        onChecking(cb: () => void): void
        onAvailable(cb: (info: unknown) => void): void
        onNotAvailable(cb: () => void): void
        onProgress(cb: (progress: unknown) => void): void
        onDownloaded(cb: () => void): void
        onError(cb: (msg: string) => void): void
      }
    }
  }

  interface LicenseState {
    status: string
    licenseKey?: string
    licenseType?: string
    tier?: string
    expiresAt?: string
    lastValidated?: string
    errorMessage?: string
    activationToken?: string
    deviceId?: string
    licenseId?: string
  }
}
