declare interface Window {
  electronAPI: {
    license: {
      initialize: () => Promise<LicenseState>
      activate: (key: string) => Promise<LicenseState>
      deactivate: () => Promise<{ success: boolean }>
      getStatus: () => LicenseState
    }
    tts: {
      listVoices: () => Promise<{ voices: import('./types').Voice[] }>
      previewVoice: (voiceId: string, text: string) => Promise<{ audio_base64?: string }>
      synthesize: (payload: object) => Promise<{
        job_id?: string
        audio_base64?: string
        duration?: number
        error?: string
      }>
      getJobStatus: (jobId: string) => Promise<{
        status: string
        progress?: number
        audio_base64?: string
        duration?: number
        error?: string
      }>
      cloneVoice: (payload: object) => Promise<{ voice?: import('./types').Voice; error?: string }>
      deleteVoice: (voiceId: string) => Promise<void>
      listProjects: () => Promise<{ projects: import('./types').TTSProject[] }>
      saveProject: (project: object) => Promise<{ project: import('./types').TTSProject }>
      deleteProject: (projectId: string) => Promise<void>
      batchSynthesize: (items: object[]) => Promise<{ jobs: { job_id: string }[] }>
    }
    api: {
      health: () => Promise<{ ok: boolean; port: number }>
    }
    dialog: {
      openAudioFile: () => Promise<string | null>
      openTextFile: () => Promise<string | null>
      saveAudioFile: (defaultName: string) => Promise<string | null>
      openFolder: () => Promise<string | null>
    }
    fs: {
      readFileBase64: (filePath: string) => Promise<string>
      saveAudio: (filePath: string, base64Data: string) => Promise<{ success: boolean; path: string }>
      stat: (filePath: string) => Promise<{ size: number; isFile: boolean; isDirectory: boolean }>
    }
    shell: {
      openPath: (p: string) => Promise<void>
      openExternal: (url: string) => Promise<void>
    }
    app: {
      getVersion: () => Promise<string>
    }
    updater: {
      checkNow: () => Promise<void>
      download: () => Promise<void>
      install: () => void
      onChecking: (cb: () => void) => void
      onAvailable: (cb: (info: unknown) => void) => void
      onNotAvailable: (cb: () => void) => void
      onProgress: (cb: (progress: unknown) => void) => void
      onDownloaded: (cb: () => void) => void
      onError: (cb: (msg: string) => void) => void
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
