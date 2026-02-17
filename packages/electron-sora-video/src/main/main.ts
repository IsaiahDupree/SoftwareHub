import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import * as path from 'path'
import * as fs from 'fs'
import { LicenseManager } from '@softwarehub/electron-license-sdk'

const isDev = process.env.NODE_ENV === 'development'
const SOFTWAREHUB_URL = process.env.SOFTWAREHUB_API_URL ?? 'https://softwarehub.app'

let mainWindow: BrowserWindow | null = null

const licenseManager = new LicenseManager({
  baseUrl: SOFTWAREHUB_URL,
  packageSlug: 'sora-video',
  appVersion: app.getVersion(),
  offlineGraceDays: 7,
})

// ─── Settings storage ─────────────────────────────────────────────────────────

const settingsPath = path.join(app.getPath('userData'), 'settings.json')

function loadSettings(): { apiKey?: string; outputFolder?: string } {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    }
  } catch {
    // ignore parse errors
  }
  return {}
}

function saveSettings(settings: { apiKey?: string; outputFolder?: string }): void {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
}

// ─── In-memory generation store (stub) ───────────────────────────────────────

interface GenerationRecord {
  id: string
  projectId: string
  prompt: string
  aspectRatio: string
  duration: number
  quality: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  videoUrl?: string
  errorMessage?: string
  createdAt: string
}

const generationsStore: GenerationRecord[] = []

// ─── Window Creation ──────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#020617', // slate-950
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../build/icon.png'),
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3003')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ─── Auto Updater ─────────────────────────────────────────────────────────────

function setupAutoUpdater(): void {
  if (isDev) return

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('updater:checking')
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:available', info)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('updater:not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('updater:progress', progress)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('updater:downloaded')
  })

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('updater:error', err.message)
  })

  // Check for updates every 4 hours
  setInterval(() => autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000)
  setTimeout(() => autoUpdater.checkForUpdates(), 10_000)
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

function setupIpcHandlers(): void {
  // License
  ipcMain.handle('license:initialize', () => licenseManager.initialize())
  ipcMain.handle('license:activate', (_e, key: string) => licenseManager.activate(key))
  ipcMain.handle('license:deactivate', () => licenseManager.deactivate())
  ipcMain.handle('license:getStatus', () => licenseManager.getStatusSync())

  // Sora: generate video (stub — logs params and returns a mock job)
  ipcMain.handle('sora:generate', async (_e, params: {
    prompt: string
    aspectRatio: string
    duration: number
    quality: string
    apiKey: string
    projectId: string
  }) => {
    console.log('[Sora] generate called with:', {
      prompt: params.prompt.slice(0, 80),
      aspectRatio: params.aspectRatio,
      duration: params.duration,
      quality: params.quality,
      projectId: params.projectId,
    })

    const record: GenerationRecord = {
      id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId: params.projectId,
      prompt: params.prompt,
      aspectRatio: params.aspectRatio,
      duration: params.duration,
      quality: params.quality,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    generationsStore.push(record)

    // Simulate async generation (stub)
    setTimeout(() => {
      record.status = 'generating'
      mainWindow?.webContents.send('sora:generationUpdate', record)

      setTimeout(() => {
        // Stub: mark as completed with a placeholder video URL
        record.status = 'completed'
        record.videoUrl = `file:///stub/output/${record.id}.mp4`
        mainWindow?.webContents.send('sora:generationUpdate', record)
        console.log('[Sora] stub generation completed:', record.id)
      }, 5000)
    }, 500)

    return { id: record.id, status: record.status }
  })

  // Sora: get generations for a project
  ipcMain.handle('sora:getGenerations', (_e, projectId: string) => {
    return generationsStore.filter((g) => g.projectId === projectId)
  })

  // Sora: open video in system player
  ipcMain.handle('sora:openVideo', (_e, videoPath: string) => {
    return shell.openPath(videoPath)
  })

  // Sora: get settings
  ipcMain.handle('sora:getSettings', () => loadSettings())

  // Sora: save settings
  ipcMain.handle('sora:saveSettings', (_e, settings: { apiKey?: string; outputFolder?: string }) => {
    saveSettings(settings)
    return { success: true }
  })

  // Dialog: open folder for output
  ipcMain.handle('dialog:openFolder', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Shell
  ipcMain.handle('shell:openPath', (_e, p: string) => shell.openPath(p))
  ipcMain.handle('shell:openExternal', (_e, url: string) => shell.openExternal(url))

  // App info
  ipcMain.handle('app:getVersion', () => app.getVersion())

  // Updater
  ipcMain.handle('updater:checkNow', () => autoUpdater.checkForUpdates())
  ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate())
  ipcMain.handle('updater:install', () => autoUpdater.quitAndInstall())
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await licenseManager.initialize()
  createWindow()
  setupIpcHandlers()
  setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
})
