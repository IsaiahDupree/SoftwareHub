import React, { useState, useEffect, useRef, useCallback } from 'react'
import { LicenseGate } from './components/LicenseGate'
import { VoiceLibrary } from './components/VoiceLibrary'
import { ScriptEditor } from './components/ScriptEditor'
import { AudioSettings } from './components/AudioSettings'
import { GenerationQueue } from './components/GenerationQueue'
import { ProjectHistory } from './components/ProjectHistory'
import { useLicense } from './hooks/useLicense'
import { useTTS } from './hooks/useTTS'
import type { AppView, TTSSettings, TTSProject, GenerationItem } from './types'
import { DEFAULT_TTS_SETTINGS } from './types'

// ─── Shared audio player ──────────────────────────────────────────────────────
let globalAudio: HTMLAudioElement | null = null

function TitleBar({ tier, view, onChangeView, onSettings }: {
  tier?: string
  view: AppView
  onChangeView: (v: AppView) => void
  onSettings: () => void
}) {
  const navItems: { id: AppView; label: string }[] = [
    { id: 'studio', label: 'Studio' },
    { id: 'voices', label: 'Voices' },
    { id: 'history', label: 'History' },
  ]

  return (
    <div className="drag-region h-11 flex items-center justify-between px-4 bg-[#0a0a0f] border-b border-slate-900 shrink-0">
      {/* Left: logo */}
      <div className="flex items-center gap-2 no-drag">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <span className="text-slate-300 text-sm font-semibold">TTS Studio</span>
        {tier && (
          <span className="px-2 py-0.5 bg-teal-900/40 text-teal-400 text-xs rounded-full capitalize">
            {tier}
          </span>
        )}
      </div>

      {/* Center: nav */}
      <div className="no-drag flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
        {navItems.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onChangeView(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === id
                ? 'bg-slate-800 text-slate-200'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right: settings */}
      <button
        onClick={onSettings}
        className="no-drag p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
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

function ApiBanner({ online }: { online: boolean | null }) {
  if (online === null || online === true) return null
  return (
    <div className="bg-amber-950/30 border-b border-amber-900/40 px-4 py-2 flex items-center gap-2 shrink-0">
      <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-amber-300 text-xs">
        TTS Python server is offline. Start tts_server.py to enable voice synthesis.
      </p>
    </div>
  )
}

function SettingsPanel({ tier, licenseStatus, onDeactivate, onBack }: {
  tier?: string
  licenseStatus: string
  onDeactivate: () => void
  onBack: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h2 className="text-white text-xl font-bold mb-6">Settings</h2>

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

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-slate-200 font-semibold text-sm mb-3">Resources</h3>
          <div className="flex flex-col gap-2">
            {[
              { label: 'SoftwareHub Portal', url: 'https://softwarehub.app/app/licenses' },
              { label: 'TTS Studio Docs', url: 'https://softwarehub.app/docs/tts-studio' },
              { label: 'Support', url: 'https://softwarehub.app/support' },
            ].map(({ label, url }) => (
              <button
                key={url}
                onClick={() => window.electronAPI.shell.openExternal(url)}
                className="flex items-center justify-between text-slate-300 hover:text-teal-400 text-sm py-1 transition-colors"
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
  const tts = useTTS()
  const [view, setView] = useState<AppView>('studio')
  const [showSettings, setShowSettings] = useState(false)
  const [text, setText] = useState('')
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_TTS_SETTINGS)
  const [playingId, setPlayingId] = useState<string | undefined>()
  const [saveProjectName, setSaveProjectName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    tts.checkApiHealth()
    tts.loadVoices()
  }, [])

  // Auto-select first voice when voices load
  useEffect(() => {
    if (tts.voices.length > 0 && !settings.voiceId) {
      setSettings((s) => ({ ...s, voiceId: tts.voices[0].id }))
    }
  }, [tts.voices])

  // ─── Playback ───────────────────────────────────────────────────────────────

  const playItem = useCallback((item: GenerationItem) => {
    if (!item.outputBase64) return

    // Stop current
    if (globalAudio) {
      globalAudio.pause()
      globalAudio = null
    }

    if (playingId === item.id) {
      setPlayingId(undefined)
      return
    }

    const fmt = item.settings.outputFormat
    const audio = new Audio(`data:audio/${fmt};base64,${item.outputBase64}`)
    audio.onended = () => setPlayingId(undefined)
    audio.play()
    globalAudio = audio
    audioRef.current = audio
    setPlayingId(item.id)
  }, [playingId])

  // ─── Export audio ───────────────────────────────────────────────────────────

  const exportItem = useCallback(async (item: GenerationItem) => {
    if (!item.outputBase64) return
    const fmt = item.settings.outputFormat
    const defaultName = `tts-studio-${Date.now()}.${fmt}`
    const savePath = await window.electronAPI.dialog.saveAudioFile(defaultName)
    if (!savePath) return
    await window.electronAPI.fs.saveAudio(savePath, item.outputBase64)
    window.electronAPI.shell.openPath(savePath.replace(/\/[^/]+$/, '')) // open folder
  }, [])

  // ─── Generate ───────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    if (!text.trim()) return
    const id = tts.addToQueue(text, settings)
    setTimeout(() => tts.synthesize(id), 0)
  }

  // ─── Save project ────────────────────────────────────────────────────────────

  const handleSaveProject = async () => {
    if (!saveProjectName.trim()) return
    const project = {
      name: saveProjectName.trim(),
      text,
      voiceId: settings.voiceId,
      settings,
      outputFormat: settings.outputFormat,
    }
    await window.electronAPI.tts.saveProject(project)
    setShowSaveModal(false)
    setSaveProjectName('')
  }

  // ─── Load project ────────────────────────────────────────────────────────────

  const handleLoadProject = (project: TTSProject) => {
    setText(project.text)
    setSettings(project.settings)
    setView('studio')
  }

  // ─── Guard: loading / not activated ──────────────────────────────────────────

  if (!license.loading && !license.isActive) {
    return <LicenseGate onActivated={license.refresh} />
  }

  if (license.loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Initializing...</p>
        </div>
      </div>
    )
  }

  const selectedVoice = tts.voices.find((v) => v.id === settings.voiceId)
  const canGenerate = !!text.trim() && !!settings.voiceId && tts.apiOnline !== false

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] overflow-hidden">
      <TitleBar
        tier={license.tier}
        view={view}
        onChangeView={setView}
        onSettings={() => setShowSettings(true)}
      />
      <ApiBanner online={tts.apiOnline} />

      {showSettings ? (
        <SettingsPanel
          tier={license.tier}
          licenseStatus={license.status?.status ?? 'unknown'}
          onDeactivate={async () => { await license.deactivate(); setShowSettings(false) }}
          onBack={() => setShowSettings(false)}
        />
      ) : view === 'voices' ? (
        <VoiceLibrary
          voices={tts.voices}
          loading={tts.loadingVoices}
          selectedVoiceId={settings.voiceId}
          onSelect={(id) => setSettings((s) => ({ ...s, voiceId: id }))}
          onCloneVoice={tts.cloneVoice}
          onDeleteVoice={tts.deleteVoice}
          onRefresh={tts.loadVoices}
          apiOnline={tts.apiOnline}
          tier={license.tier}
        />
      ) : view === 'history' ? (
        <ProjectHistory onLoadProject={handleLoadProject} />
      ) : (
        // Studio view
        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6 flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">Generate Speech</h1>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {selectedVoice
                      ? `Voice: ${selectedVoice.name} · ${selectedVoice.language}`
                      : 'Select a voice in the Voices tab'}
                  </p>
                </div>
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={!text.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm rounded-xl transition-colors disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </button>
              </div>

              {/* Script editor */}
              <ScriptEditor
                text={text}
                onChange={setText}
                ssmlMode={settings.ssmlMode}
                onToggleSsml={() => setSettings((s) => ({ ...s, ssmlMode: !s.ssmlMode }))}
                disabled={false}
              />

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-900/30 hover:shadow-teal-900/50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {tts.apiOnline === false
                  ? 'API Offline'
                  : !settings.voiceId
                    ? 'Select a Voice First'
                    : 'Generate Speech'}
              </button>

              {/* Queue */}
              <GenerationQueue
                items={tts.queue}
                onRemove={tts.removeFromQueue}
                onPlayback={playItem}
                onExport={exportItem}
                onClearCompleted={tts.clearCompleted}
                playingId={playingId}
              />
            </div>
          </div>

          {/* Right panel: audio settings */}
          <div className="w-72 border-l border-slate-900 overflow-y-auto p-5 shrink-0">
            <h3 className="text-slate-200 font-semibold text-sm mb-4">Audio Settings</h3>
            <AudioSettings
              settings={settings}
              onChange={setSettings}
            />
          </div>
        </div>
      )}

      {/* Save project modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold text-lg mb-4">Save Project</h3>
            <input
              type="text"
              value={saveProjectName}
              onChange={(e) => setSaveProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveProject()}
              placeholder="Project name..."
              autoFocus
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowSaveModal(false); setSaveProjectName('') }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                disabled={!saveProjectName.trim()}
                className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
