import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // License
  license: {
    initialize: () => ipcRenderer.invoke('license:initialize'),
    activate: (key: string) => ipcRenderer.invoke('license:activate', key),
    deactivate: () => ipcRenderer.invoke('license:deactivate'),
    getStatus: () => ipcRenderer.invoke('license:getStatus'),
  },

  // Sora video generation
  sora: {
    generate: (params: {
      prompt: string
      aspectRatio: string
      duration: number
      quality: string
      apiKey: string
      projectId: string
    }) => ipcRenderer.invoke('sora:generate', params),
    getGenerations: (projectId: string) => ipcRenderer.invoke('sora:getGenerations', projectId),
    openVideo: (videoPath: string) => ipcRenderer.invoke('sora:openVideo', videoPath),
    getSettings: () => ipcRenderer.invoke('sora:getSettings'),
    saveSettings: (settings: { apiKey?: string; outputFolder?: string }) =>
      ipcRenderer.invoke('sora:saveSettings', settings),
    onGenerationUpdate: (cb: (generation: unknown) => void) =>
      ipcRenderer.on('sora:generationUpdate', (_e, generation) => cb(generation)),
  },

  // Dialogs
  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
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
