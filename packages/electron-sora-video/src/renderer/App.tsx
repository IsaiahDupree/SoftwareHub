import React, { useState, useEffect, useCallback } from 'react'
import { LicenseGate } from './components/LicenseGate'
import { ProjectManager } from './components/ProjectManager'
import { PromptEditor } from './components/PromptEditor'
import { GenerationQueue } from './components/GenerationQueue'
import type { Project, Generation, AspectRatio, Duration, Quality } from './types'

// ─── License hook ─────────────────────────────────────────────────────────────

function useLicense() {
  const [loading, setLoading] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [tier, setTier] = useState<string | undefined>()
  const [status, setStatus] = useState<string>('unknown')

  const refresh = useCallback(async () => {
    try {
      const result = await window.electronAPI.license.initialize()
      setIsActive(result.status === 'active')
      setTier(result.tier)
      setStatus(result.status)
    } catch {
      setIsActive(false)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const deactivate = useCallback(async () => {
    await window.electronAPI.license.deactivate()
    setIsActive(false)
    setTier(undefined)
    setStatus('inactive')
  }, [])

  return { loading, isActive, tier, status, refresh, deactivate }
}

// ─── Title bar ────────────────────────────────────────────────────────────────

type AppView = 'studio' | 'settings'

function TitleBar({
  tier,
  view,
  onChangeView,
}: {
  tier?: string
  view: AppView
  onChangeView: (v: AppView) => void
}) {
  return (
    <div className="drag-region h-11 flex items-center justify-between px-4 bg-slate-950 border-b border-slate-900 shrink-0">
      {/* Left: logo */}
      <div className="flex items-center gap-2 no-drag">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-slate-300 text-sm font-semibold">Sora Video</span>
        {tier && (
          <span className="px-2 py-0.5 bg-rose-900/40 text-rose-400 text-xs rounded-full capitalize">
            {tier}
          </span>
        )}
      </div>

      {/* Right: settings */}
      <button
        onClick={() => onChangeView(view === 'settings' ? 'studio' : 'settings')}
        className={`no-drag p-1.5 rounded-lg transition-colors ${
          view === 'settings'
            ? 'text-rose-400 bg-rose-900/30'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
        }`}
        title="Settings"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  )
}

// ─── Settings panel ───────────────────────────────────────────────────────────

function SettingsPanel({
  apiKey,
  outputFolder,
  tier,
  licenseStatus,
  onSave,
  onDeactivate,
  onBack,
}: {
  apiKey: string
  outputFolder: string
  tier?: string
  licenseStatus: string
  onSave: (settings: { apiKey: string; outputFolder: string }) => void
  onDeactivate: () => void
  onBack: () => void
}) {
  const [localApiKey, setLocalApiKey] = useState(apiKey)
  const [localOutputFolder, setLocalOutputFolder] = useState(outputFolder)

  async function handleBrowseFolder() {
    const folder = await window.electronAPI.dialog.openFolder()
    if (folder) setLocalOutputFolder(folder)
  }

  function handleSave() {
    onSave({ apiKey: localApiKey, outputFolder: localOutputFolder })
    onBack()
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h2 className="text-white text-xl font-bold mb-6">Settings</h2>

        {/* API Key */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
          <h3 className="text-slate-200 font-semibold text-sm mb-3">OpenAI API Key</h3>
          <p className="text-slate-500 text-xs mb-3">
            Required to generate videos using OpenAI's Sora model. Your key is stored locally.
          </p>
          <input
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors font-mono"
          />
          <button
            onClick={() => window.electronAPI.shell.openExternal('https://platform.openai.com/api-keys')}
            className="mt-2 text-xs text-slate-500 hover:text-rose-400 transition-colors"
          >
            Get an API key from OpenAI
          </button>
        </div>

        {/* Output folder */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
          <h3 className="text-slate-200 font-semibold text-sm mb-3">Default Output Folder</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={localOutputFolder}
              onChange={(e) => setLocalOutputFolder(e.target.value)}
              placeholder="~/Videos/SoraVideo"
              className="flex-1 min-w-0 px-3 py-2.5 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <button
              onClick={handleBrowseFolder}
              className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl transition-colors shrink-0"
            >
              Browse
            </button>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors mb-4"
        >
          Save Settings
        </button>

        {/* License */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
          <h3 className="text-slate-200 font-semibold text-sm mb-3">License</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm">
                Status:{' '}
                <span className={`font-medium ${licenseStatus === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {licenseStatus}
                </span>
              </p>
              {tier && <p className="text-slate-500 text-xs mt-0.5">Plan: {tier}</p>}
            </div>
            <button
              onClick={onDeactivate}
              className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-medium rounded-xl border border-red-900 transition-colors"
            >
              Deactivate
            </button>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-slate-200 font-semibold text-sm mb-3">Resources</h3>
          <div className="flex flex-col gap-2">
            {[
              { label: 'SoftwareHub Portal', url: 'https://softwarehub.app/app/licenses' },
              { label: 'Sora Video Docs', url: 'https://softwarehub.app/docs/sora-video' },
              { label: 'Support', url: 'https://softwarehub.app/support' },
            ].map(({ label, url }) => (
              <button
                key={url}
                onClick={() => window.electronAPI.shell.openExternal(url)}
                className="flex items-center justify-between text-slate-300 hover:text-rose-400 text-sm py-1 transition-colors"
              >
                {label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const license = useLicense()
  const [view, setView] = useState<AppView>('studio')
  const [projects, setProjects] = useState<Project[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [outputFolder, setOutputFolder] = useState('')

  // Load settings on mount
  useEffect(() => {
    window.electronAPI.sora.getSettings().then((s: { apiKey?: string; outputFolder?: string }) => {
      setApiKey(s.apiKey ?? '')
      setOutputFolder(s.outputFolder ?? '')
    })
  }, [])

  // Listen for generation updates from main process
  useEffect(() => {
    window.electronAPI.sora.onGenerationUpdate((updated: Generation) => {
      setGenerations((prev) =>
        prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g))
      )
    })
  }, [])

  // ─── Project operations ────────────────────────────────────────────────────

  function handleCreateProject(name: string) {
    const project: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      createdAt: new Date().toISOString(),
    }
    setProjects((prev) => [...prev, project])
    setSelectedProjectId(project.id)
  }

  function handleDeleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    if (selectedProjectId === id) {
      setSelectedProjectId(null)
    }
    setGenerations((prev) => prev.filter((g) => g.projectId !== id))
  }

  // ─── Generation ────────────────────────────────────────────────────────────

  async function handleGenerate(params: {
    prompt: string
    aspectRatio: AspectRatio
    duration: Duration
    quality: Quality
  }) {
    if (!selectedProjectId) return

    // Optimistically add a pending generation
    const pending: Generation = {
      id: `gen_pending_${Date.now()}`,
      projectId: selectedProjectId,
      prompt: params.prompt,
      aspectRatio: params.aspectRatio,
      duration: params.duration,
      quality: params.quality,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    setGenerations((prev) => [...prev, pending])

    try {
      const result = await window.electronAPI.sora.generate({
        prompt: params.prompt,
        aspectRatio: params.aspectRatio,
        duration: params.duration,
        quality: params.quality,
        apiKey,
        projectId: selectedProjectId,
      })

      // Replace optimistic entry with the real one from main process
      setGenerations((prev) =>
        prev.map((g) =>
          g.id === pending.id
            ? { ...pending, id: result.id, status: result.status as Generation['status'] }
            : g
        )
      )
    } catch (err) {
      setGenerations((prev) =>
        prev.map((g) =>
          g.id === pending.id
            ? { ...g, status: 'failed', errorMessage: (err as Error).message }
            : g
        )
      )
    }
  }

  // ─── Settings save ─────────────────────────────────────────────────────────

  async function handleSaveSettings(settings: { apiKey: string; outputFolder: string }) {
    setApiKey(settings.apiKey)
    setOutputFolder(settings.outputFolder)
    await window.electronAPI.sora.saveSettings(settings)
  }

  // ─── Open video ────────────────────────────────────────────────────────────

  function handleOpenVideo(videoUrl: string) {
    window.electronAPI.sora.openVideo(videoUrl)
  }

  // ─── Guards ────────────────────────────────────────────────────────────────

  if (!license.loading && !license.isActive) {
    return <LicenseGate onActivated={license.refresh} />
  }

  if (license.loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Initializing...</p>
        </div>
      </div>
    )
  }

  const projectGenerations = generations.filter((g) => g.projectId === selectedProjectId)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      <TitleBar
        tier={license.tier}
        view={view}
        onChangeView={setView}
      />

      {view === 'settings' ? (
        <SettingsPanel
          apiKey={apiKey}
          outputFolder={outputFolder}
          tier={license.tier}
          licenseStatus={license.status}
          onSave={handleSaveSettings}
          onDeactivate={async () => {
            await license.deactivate()
            setView('studio')
          }}
          onBack={() => setView('studio')}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: project manager */}
          <ProjectManager
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />

          {/* Main content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
              <PromptEditor
                projectId={selectedProjectId}
                apiKey={apiKey}
                tier={license.tier}
                generationCount={projectGenerations.length}
                onGenerate={handleGenerate}
              />

              <GenerationQueue
                generations={projectGenerations}
                onOpenVideo={handleOpenVideo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
