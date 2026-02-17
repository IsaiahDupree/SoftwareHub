import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // License
  license: {
    initialize: () => ipcRenderer.invoke('license:initialize'),
    activate: (key: string) => ipcRenderer.invoke('license:activate', key),
    deactivate: () => ipcRenderer.invoke('license:deactivate'),
    getStatus: () => ipcRenderer.invoke('license:getStatus'),
  },

  // TTS
  tts: {
    listVoices: () => ipcRenderer.invoke('tts:listVoices'),
    previewVoice: (voiceId: string, text: string) =>
      ipcRenderer.invoke('tts:previewVoice', voiceId, text),
    synthesize: (payload: object) => ipcRenderer.invoke('tts:synthesize', payload),
    getJobStatus: (jobId: string) => ipcRenderer.invoke('tts:getJobStatus', jobId),
    cloneVoice: (payload: object) => ipcRenderer.invoke('tts:cloneVoice', payload),
    deleteVoice: (voiceId: string) => ipcRenderer.invoke('tts:deleteVoice', voiceId),
    listProjects: () => ipcRenderer.invoke('tts:listProjects'),
    saveProject: (project: object) => ipcRenderer.invoke('tts:saveProject', project),
    deleteProject: (projectId: string) => ipcRenderer.invoke('tts:deleteProject', projectId),
    batchSynthesize: (items: object[]) => ipcRenderer.invoke('tts:batchSynthesize', items),
  },

  // API health
  api: {
    health: () => ipcRenderer.invoke('api:health'),
  },

  // Dialogs
  dialog: {
    openAudioFile: () => ipcRenderer.invoke('dialog:openAudioFile'),
    openTextFile: () => ipcRenderer.invoke('dialog:openTextFile'),
    saveAudioFile: (defaultName: string) =>
      ipcRenderer.invoke('dialog:saveAudioFile', defaultName),
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  },

  // File system
  fs: {
    readFileBase64: (filePath: string) => ipcRenderer.invoke('fs:readFileBase64', filePath),
    saveAudio: (filePath: string, base64Data: string) =>
      ipcRenderer.invoke('fs:saveAudio', filePath, base64Data),
    stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath),
  },

  // Shell
  shell: {
    openPath: (p: string) => ipcRenderer.invoke('shell:openPath', p),
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },

  // App
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },

  // Auto updater
  updater: {
    checkNow: () => ipcRenderer.invoke('updater:checkNow'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onChecking: (cb: () => void) => ipcRenderer.on('updater:checking', cb),
    onAvailable: (cb: (info: unknown) => void) =>
      ipcRenderer.on('updater:available', (_e, info) => cb(info)),
    onNotAvailable: (cb: () => void) => ipcRenderer.on('updater:not-available', cb),
    onProgress: (cb: (progress: unknown) => void) =>
      ipcRenderer.on('updater:progress', (_e, progress) => cb(progress)),
    onDownloaded: (cb: () => void) => ipcRenderer.on('updater:downloaded', cb),
    onError: (cb: (msg: string) => void) =>
      ipcRenderer.on('updater:error', (_e, msg) => cb(msg)),
  },
})
