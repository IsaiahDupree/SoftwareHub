import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // License
  license: {
    initialize: () => ipcRenderer.invoke('license:initialize'),
    activate: (key: string) => ipcRenderer.invoke('license:activate', key),
    deactivate: () => ipcRenderer.invoke('license:deactivate'),
    getStatus: () => ipcRenderer.invoke('license:getStatus'),
  },

  // Dialogs
  dialog: {
    openFiles: (options?: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke('dialog:openFiles', options),
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    saveFile: (options?: Electron.SaveDialogOptions) =>
      ipcRenderer.invoke('dialog:saveFile', options),
  },

  // API
  api: {
    submitJob: (payload: object) => ipcRenderer.invoke('api:submitJob', payload),
    getJobStatus: (jobId: string) => ipcRenderer.invoke('api:getJobStatus', jobId),
    health: () => ipcRenderer.invoke('api:health'),
  },

  // File system
  fs: {
    readFileBase64: (filePath: string) => ipcRenderer.invoke('fs:readFileBase64', filePath),
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
