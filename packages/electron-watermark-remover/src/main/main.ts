import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import * as https from 'https'
import { ChildProcess, spawn } from 'child_process'
import { LicenseManager } from '@softwarehub/electron-license-sdk'

const isDev = process.env.NODE_ENV === 'development'
const SOFTWAREHUB_URL = 'https://softwarehub.app'
const API_PORT = 7070
const API_HOST = '127.0.0.1'

let mainWindow: BrowserWindow | null = null
let apiProcess: ChildProcess | null = null

const licenseManager = new LicenseManager({
  baseUrl: SOFTWAREHUB_URL,
  packageSlug: 'watermark-remover',
  appVersion: app.getVersion(),
  offlineGraceDays: 7,
})

// ─── Window Creation ──────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../build/icon.png'),
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3001')
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

// ─── Backend API Management ───────────────────────────────────────────────────

function isApiRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: API_HOST, port: API_PORT, path: '/health', method: 'GET', timeout: 2000 },
      (res) => resolve(res.statusCode === 200)
    )
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
    req.end()
  })
}

async function startApiServer(): Promise<void> {
  const running = await isApiRunning()
  if (running) return

  // Look for the API server in the app resources or sibling directory
  const apiPaths = [
    path.join(process.resourcesPath, 'api', 'dist', 'index.js'),
    path.join(__dirname, '../../../../apps/api/dist/index.js'),
    path.join(__dirname, '../../../apps/api/dist/index.js'),
  ]

  const apiPath = apiPaths.find((p) => fs.existsSync(p))
  if (!apiPath) {
    console.warn('API server not found - watermark processing requires the backend server')
    return
  }

  apiProcess = spawn('node', [apiPath], {
    env: { ...process.env, CONTROL_PORT: String(API_PORT), LOCAL_ONLY: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  apiProcess.stdout?.on('data', (d) => console.log('[API]', d.toString()))
  apiProcess.stderr?.on('data', (d) => console.error('[API]', d.toString()))
  apiProcess.on('exit', (code) => {
    apiProcess = null
    console.log(`API server exited with code ${code}`)
  })

  // Wait for API to be ready (up to 15s)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (await isApiRunning()) break
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

function setupIpcHandlers(): void {
  // License
  ipcMain.handle('license:initialize', () => licenseManager.initialize())
  ipcMain.handle('license:activate', (_e, key: string) => licenseManager.activate(key))
  ipcMain.handle('license:deactivate', () => licenseManager.deactivate())
  ipcMain.handle('license:getStatus', () => licenseManager.getStatusSync())

  // File picker
  ipcMain.handle('dialog:openFiles', async (_e, options: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      ...options,
    })
    return result.canceled ? null : result.filePaths
  })

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'createDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:saveFile', async (_e, options: Electron.SaveDialogOptions) => {
    const result = await dialog.showSaveDialog(mainWindow!, options)
    return result.canceled ? null : result.filePath
  })

  // API proxy - submit job
  ipcMain.handle('api:submitJob', async (_e, payload: object) => {
    return apiRequest('POST', '/api/v1/video/process', payload)
  })

  // API proxy - get job status
  ipcMain.handle('api:getJobStatus', async (_e, jobId: string) => {
    return apiRequest('GET', `/api/v1/jobs/${jobId}`)
  })

  // API proxy - check health
  ipcMain.handle('api:health', async () => {
    try {
      const ok = await isApiRunning()
      return { ok, port: API_PORT }
    } catch {
      return { ok: false, port: API_PORT }
    }
  })

  // File reading (for base64 encoding)
  ipcMain.handle('fs:readFileBase64', async (_e, filePath: string) => {
    const buffer = fs.readFileSync(filePath)
    return buffer.toString('base64')
  })

  // File stats
  ipcMain.handle('fs:stat', async (_e, filePath: string) => {
    const stat = fs.statSync(filePath)
    return { size: stat.size, isFile: stat.isFile(), isDirectory: stat.isDirectory() }
  })

  // Shell operations
  ipcMain.handle('shell:openPath', (_e, p: string) => shell.openPath(p))
  ipcMain.handle('shell:openExternal', (_e, url: string) => shell.openExternal(url))

  // App info
  ipcMain.handle('app:getVersion', () => app.getVersion())

  // Updater controls
  ipcMain.handle('updater:checkNow', () => autoUpdater.checkForUpdates())
  ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate())
  ipcMain.handle('updater:install', () => autoUpdater.quitAndInstall())
}

function apiRequest(method: string, urlPath: string, body?: object): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : undefined
    const req = http.request(
      {
        hostname: API_HOST,
        port: API_PORT,
        path: urlPath,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        },
        timeout: 30_000,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch {
            resolve(data)
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')) })
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await startApiServer()
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
    apiProcess?.kill()
    app.quit()
  }
})

app.on('before-quit', () => {
  apiProcess?.kill()
})

app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
})
