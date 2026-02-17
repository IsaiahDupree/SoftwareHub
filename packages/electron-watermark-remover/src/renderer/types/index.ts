export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ProcessingFile {
  id: string
  path: string
  name: string
  size: number
  type: 'image' | 'video'
  status: FileStatus
  jobId?: string
  progress?: number
  outputPath?: string
  error?: string
  processingTimeMs?: number
  stats?: {
    watermarksDetected?: number
    framesProcessed?: number
    method?: string
    inputSizeMb?: number
    outputSizeMb?: number
  }
}

export interface ProcessingOptions {
  method: 'auto' | 'modal' | 'local'
  platform: 'sora' | 'tiktok' | 'runway' | 'pika' | 'auto'
  upscaling: boolean
  upscaleScale: 2 | 4
  outputFormat: 'mp4' | 'mov' | 'webm'
  quality: number // CRF 0-51
  outputFolder: string | null
}

export interface LicenseStatus {
  status: string
  tier?: string
  expiresAt?: string
  deviceId?: string
  activationCount?: number
  maxDevices?: number
}

export interface UpdateInfo {
  version: string
  releaseNotes?: string
}

export type AppView = 'main' | 'settings' | 'license' | 'about'

export interface ElectronAPI {
  license: {
    initialize: () => Promise<LicenseStatus>
    activate: (key: string) => Promise<{ success: boolean; status: string; error?: string }>
    deactivate: () => Promise<{ success: boolean }>
    getStatus: () => LicenseStatus
  }
  dialog: {
    openFiles: (options?: object) => Promise<string[] | null>
    openFolder: () => Promise<string | null>
    saveFile: (options?: object) => Promise<string | null>
  }
  api: {
    submitJob: (payload: object) => Promise<{ job_id?: string; error?: string }>
    getJobStatus: (jobId: string) => Promise<{
      status: string
      progress?: number
      stage?: string
      result?: {
        video_url?: string
        stats?: ProcessingFile['stats']
      }
      error?: string
    }>
    health: () => Promise<{ ok: boolean; port: number }>
  }
  fs: {
    readFileBase64: (filePath: string) => Promise<string>
    stat: (filePath: string) => Promise<{ size: number; isFile: boolean; isDirectory: boolean }>
  }
  shell: {
    openPath: (p: string) => Promise<string>
    openExternal: (url: string) => Promise<void>
  }
  app: {
    getVersion: () => Promise<string>
  }
  updater: {
    checkNow: () => Promise<void>
    download: () => Promise<void>
    install: () => Promise<void>
    onChecking: (cb: () => void) => void
    onAvailable: (cb: (info: UpdateInfo) => void) => void
    onNotAvailable: (cb: () => void) => void
    onProgress: (cb: (progress: { percent: number }) => void) => void
    onDownloaded: (cb: () => void) => void
    onError: (cb: (msg: string) => void) => void
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
