import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import { ChildProcess, spawn } from 'child_process'
import { LicenseManager } from '@softwarehub/electron-license-sdk'

const isDev = process.env.NODE_ENV === 'development'
const SOFTWAREHUB_URL = 'https://softwarehub.app'
const API_PORT = 7071
const API_HOST = '127.0.0.1'

let mainWindow: BrowserWindow | null = null
let apiProcess: ChildProcess | null = null

const licenseManager = new LicenseManager({
  baseUrl: SOFTWAREHUB_URL,
  packageSlug: 'tts-studio',
  appVersion: app.getVersion(),
  offlineGraceDays: 7,
})

// ─── Window Creation ──────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../build/icon.png'),
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3002')
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

// ─── TTS Python Backend Management ────────────────────────────────────────────

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

  // Look for the Python TTS API server
  const apiPaths = [
    path.join(process.resourcesPath, 'api', 'tts_server.py'),
    path.join(__dirname, '../../../../api/tts_server.py'),
    path.join(__dirname, '../../../api/tts_server.py'),
  ]

  const apiPath = apiPaths.find((p) => fs.existsSync(p))
  if (!apiPath) {
    console.warn('TTS API server not found - voice synthesis requires the Python backend')
    return
  }

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
  apiProcess = spawn(pythonCmd, [apiPath, '--port', String(API_PORT)], {
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  apiProcess.stdout?.on('data', (d) => console.log('[TTS API]', d.toString()))
  apiProcess.stderr?.on('data', (d) => console.error('[TTS API]', d.toString()))
  apiProcess.on('exit', (code) => {
    apiProcess = null
    console.log(`TTS API server exited with code ${code}`)
  })

  // Wait for API to be ready (up to 20s — Python startup is slower)
  for (let i = 0; i < 40; i++) {
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

  // TTS API: list voices
  ipcMain.handle('tts:listVoices', async () => {
    return apiRequest('GET', '/api/v1/voices')
  })

  // TTS API: preview voice (short sample)
  ipcMain.handle('tts:previewVoice', async (_e, voiceId: string, text: string) => {
    return apiRequest('POST', '/api/v1/voices/preview', { voice_id: voiceId, text })
  })

  // TTS API: synthesize speech (full generation)
  ipcMain.handle('tts:synthesize', async (_e, payload: SynthesizePayload) => {
    return apiRequest('POST', '/api/v1/synthesize', payload)
  })

  // TTS API: get generation status
  ipcMain.handle('tts:getJobStatus', async (_e, jobId: string) => {
    return apiRequest('GET', `/api/v1/jobs/${jobId}`)
  })

  // TTS API: clone voice from audio sample
  ipcMain.handle('tts:cloneVoice', async (_e, payload: CloneVoicePayload) => {
    return apiRequest('POST', '/api/v1/voices/clone', payload)
  })

  // TTS API: delete cloned voice
  ipcMain.handle('tts:deleteVoice', async (_e, voiceId: string) => {
    return apiRequest('DELETE', `/api/v1/voices/${voiceId}`)
  })

  // TTS API: list projects (history)
  ipcMain.handle('tts:listProjects', async () => {
    return apiRequest('GET', '/api/v1/projects')
  })

  // TTS API: save project
  ipcMain.handle('tts:saveProject', async (_e, project: TTSProject) => {
    return apiRequest('POST', '/api/v1/projects', project)
  })

  // TTS API: delete project
  ipcMain.handle('tts:deleteProject', async (_e, projectId: string) => {
    return apiRequest('DELETE', `/api/v1/projects/${projectId}`)
  })

  // TTS API: batch generate
  ipcMain.handle('tts:batchSynthesize', async (_e, items: SynthesizePayload[]) => {
    return apiRequest('POST', '/api/v1/synthesize/batch', { items })
  })

  // TTS API: check health
  ipcMain.handle('api:health', async () => {
    try {
      const ok = await isApiRunning()
      return { ok, port: API_PORT }
    } catch {
      return { ok: false, port: API_PORT }
    }
  })

  // File: read audio file as base64 for preview/upload
  ipcMain.handle('fs:readFileBase64', async (_e, filePath: string) => {
    const buffer = fs.readFileSync(filePath)
    return buffer.toString('base64')
  })

  // File: save audio buffer to disk
  ipcMain.handle('fs:saveAudio', async (_e, filePath: string, base64Data: string) => {
    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filePath, buffer)
    return { success: true, path: filePath }
  })

  // File: stat
  ipcMain.handle('fs:stat', async (_e, filePath: string) => {
    const stat = fs.statSync(filePath)
    return { size: stat.size, isFile: stat.isFile(), isDirectory: stat.isDirectory() }
  })

  // Dialog: open audio file(s)
  ipcMain.handle('dialog:openAudioFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'aac'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Dialog: open text file
  ipcMain.handle('dialog:openTextFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'md', 'srt', 'vtt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    if (result.canceled || !result.filePaths[0]) return null
    return fs.readFileSync(result.filePaths[0], 'utf-8')
  })

  // Dialog: save audio file
  ipcMain.handle('dialog:saveAudioFile', async (_e, defaultName: string) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: defaultName,
      filters: [
        { name: 'MP3', extensions: ['mp3'] },
        { name: 'WAV', extensions: ['wav'] },
        { name: 'AAC', extensions: ['aac'] },
        { name: 'FLAC', extensions: ['flac'] },
      ],
    })
    return result.canceled ? null : result.filePath
  })

  // Dialog: save folder (for batch output)
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface SynthesizePayload {
  text: string
  voice_id: string
  output_format: 'mp3' | 'wav' | 'aac' | 'flac'
  quality: 'draft' | 'standard' | 'high'
  speed?: number
  pitch?: number
  ssml?: boolean
  project_id?: string
}

interface CloneVoicePayload {
  name: string
  audio_base64: string
  audio_filename: string
  description?: string
}

interface TTSProject {
  id?: string
  name: string
  text: string
  voice_id: string
  settings: Record<string, unknown>
  output_path?: string
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

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
        timeout: 60_000, // TTS can take longer
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
