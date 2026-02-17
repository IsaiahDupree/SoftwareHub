import React, { useState, useEffect } from 'react'
import { LicenseGate } from './components/LicenseGate'
import { FileDropZone } from './components/FileDropZone'
import { FileList } from './components/FileList'
import { SettingsPanel } from './components/SettingsPanel'
import { useLicense } from './hooks/useLicense'
import { useProcessing } from './hooks/useProcessing'
import type { ProcessingOptions, AppView } from './types'

const DEFAULT_OPTIONS: ProcessingOptions = {
  method: 'auto',
  platform: 'auto',
  upscaling: false,
  upscaleScale: 2,
  outputFormat: 'mp4',
  quality: 18,
  outputFolder: null,
}

const DEMO_FILE_LIMIT = 3

function TitleBar({ tier, onSettings, isDemo }: { tier?: string; onSettings: () => void; isDemo?: boolean }) {
  return (
    <div className="drag-region h-10 flex items-center justify-between px-4 bg-slate-950 border-b border-slate-900 shrink-0">
      <div className="flex items-center gap-2 no-drag">
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-700" />
        <span className="text-slate-300 text-sm font-medium">Watermark Remover</span>
        {isDemo ? (
          <span className="px-2 py-0.5 bg-amber-900/50 text-amber-300 text-xs rounded-full">
            Demo
          </span>
        ) : tier ? (
          <span className="px-2 py-0.5 bg-violet-900/50 text-violet-300 text-xs rounded-full capitalize">
            {tier}
          </span>
        ) : null}
      </div>
      <button
        onClick={onSettings}
        className="no-drag p-1.5 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  )
}

function ApiStatusBanner({ online }: { online: boolean | null }) {
  if (online === null || online === true) return null
  return (
    <div className="bg-amber-900/30 border-b border-amber-800/50 px-4 py-2 flex items-center gap-2">
      <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-amber-300 text-xs">
        Backend API is offline. Start the Safari Automation API server on port 7070 to process files.
      </p>
    </div>
  )
}

function DemoBanner({ filesUsed, fileLimit, onUpgrade }: { filesUsed: number; fileLimit: number; onUpgrade: () => void }) {
  return (
    <div className="bg-amber-950/40 border-b border-amber-800/50 px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-amber-300 text-xs">
          Demo mode: {filesUsed}/{fileLimit} files used. Output will be watermarked.
        </p>
      </div>
      <button
        onClick={onUpgrade}
        className="shrink-0 px-3 py-1 bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        Upgrade
      </button>
    </div>
  )
}

function UpgradePrompt({ onClose, onPurchase, onActivate }: { onClose: () => void; onPurchase: () => void; onActivate: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Demo Limit Reached</h2>
          <p className="text-slate-400 text-sm mt-2">
            You've used all {DEMO_FILE_LIMIT} demo files. Unlock unlimited processing with a full license.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onPurchase}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
          >
            Get Full License — from $49
          </button>
          <button
            onClick={onActivate}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
          >
            I already have a license key
          </button>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-400 text-xs text-center transition-colors"
          >
            Continue viewing (no more processing)
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingsView({
  onBack,
  onDeactivate,
  tier,
  licenseStatus,
  isDemo,
  onUpgrade,
}: {
  onBack: () => void
  onDeactivate: () => void
  tier?: string
  licenseStatus: string
  isDemo?: boolean
  onUpgrade?: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-lg mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h2 className="text-white text-xl font-bold mb-6">Settings</h2>

        {/* License info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
          <h3 className="text-slate-200 font-semibold text-sm mb-3">License</h3>
          {isDemo ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Status: <span className="font-medium text-amber-400">Demo Mode</span></p>
                <p className="text-slate-500 text-xs mt-0.5">Limited to {DEMO_FILE_LIMIT} files with watermarked output</p>
              </div>
              {onUpgrade && (
                <button
                  onClick={onUpgrade}
                  className="px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Upgrade
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm capitalize">Status: <span className={`font-medium ${licenseStatus === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>{licenseStatus}</span></p>
                {tier && <p className="text-slate-500 text-xs mt-0.5">Plan: {tier}</p>}
              </div>
              <button
                onClick={onDeactivate}
                className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-medium rounded-xl border border-red-900 transition-colors"
              >
                Deactivate
              </button>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-slate-200 font-semibold text-sm mb-3">Resources</h3>
          <div className="flex flex-col gap-2">
            {[
              { label: 'SoftwareHub Portal', url: 'https://softwarehub.app/app/licenses' },
              { label: 'Documentation', url: 'https://softwarehub.app/app/downloads' },
              { label: 'Support', url: 'https://softwarehub.app/support' },
            ].map(({ label, url }) => (
              <button
                key={url}
                onClick={() => window.electronAPI.shell.openExternal(url)}
                className="flex items-center justify-between text-slate-300 hover:text-violet-400 text-sm py-1 transition-colors"
              >
                {label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const license = useLicense()
  const processing = useProcessing()
  const [options, setOptions] = useState<ProcessingOptions>(DEFAULT_OPTIONS)
  const [view, setView] = useState<AppView>('main')
  const [showSettings, setShowSettings] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const pendingCount = processing.files.filter((f) => f.status === 'pending').length
  const processingCount = processing.files.filter((f) => f.status === 'processing').length
  const completedCount = processing.files.filter((f) => f.status === 'completed').length
  const demoFilesUsed = demoMode ? processing.files.length : 0
  const demoLimitReached = demoMode && demoFilesUsed >= DEMO_FILE_LIMIT

  useEffect(() => {
    processing.checkApiHealth()
  }, [])

  // Show license gate if not activated and not in demo mode
  if (!license.loading && !license.isActive && !demoMode) {
    return (
      <LicenseGate
        onActivated={license.refresh}
        onDemo={() => setDemoMode(true)}
      />
    )
  }

  if (license.loading && !demoMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Initializing...</p>
        </div>
      </div>
    )
  }

  function handleUpgrade() {
    setDemoMode(false)
    setShowUpgradePrompt(false)
  }

  function openPurchase() {
    window.electronAPI.shell.openExternal('https://softwarehub.app/products/watermark-remover')
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      <TitleBar
        tier={license.status?.tier}
        onSettings={() => setShowSettings(true)}
        isDemo={demoMode}
      />

      {demoMode && (
        <DemoBanner
          filesUsed={demoFilesUsed}
          fileLimit={DEMO_FILE_LIMIT}
          onUpgrade={() => setShowUpgradePrompt(true)}
        />
      )}

      {!demoMode && <ApiStatusBanner online={processing.apiOnline} />}

      {showUpgradePrompt && (
        <UpgradePrompt
          onClose={() => setShowUpgradePrompt(false)}
          onPurchase={() => { openPurchase(); setShowUpgradePrompt(false) }}
          onActivate={handleUpgrade}
        />
      )}

      {showSettings ? (
        <SettingsView
          onBack={() => setShowSettings(false)}
          onDeactivate={async () => { await license.deactivate(); setShowSettings(false) }}
          tier={license.status?.tier}
          licenseStatus={license.status?.status ?? 'unknown'}
          isDemo={demoMode}
          onUpgrade={() => { setShowSettings(false); setShowUpgradePrompt(true) }}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 flex flex-col gap-5">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-white">Remove Watermarks</h1>
              <p className="text-slate-400 text-sm mt-1">
                {demoMode
                  ? `Demo mode: process up to ${DEMO_FILE_LIMIT} files (output will be watermarked)`
                  : 'AI-powered watermark removal for images and videos'}
              </p>
            </div>

            {/* Drop zone */}
            <FileDropZone
              onFiles={demoLimitReached ? () => setShowUpgradePrompt(true) : processing.addFiles}
              disabled={processingCount > 0 || demoLimitReached}
            />

            {demoLimitReached && (
              <div className="text-center">
                <p className="text-amber-400 text-sm mb-2">Demo file limit reached.</p>
                <button
                  onClick={() => setShowUpgradePrompt(true)}
                  className="px-6 py-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Upgrade to process more
                </button>
              </div>
            )}

            {/* File list */}
            {processing.files.length > 0 && (
              <>
                <FileList
                  files={processing.files}
                  onRemove={processing.removeFile}
                  onProcess={(id) => processing.processFile(id, options)}
                  onRevealOutput={(path) => window.electronAPI.shell.openPath(path)}
                />

                {completedCount > 0 && (
                  <button
                    onClick={processing.clearCompleted}
                    className="text-slate-500 hover:text-slate-300 text-xs text-center transition-colors"
                  >
                    Clear completed ({completedCount})
                  </button>
                )}
              </>
            )}

            {/* Settings */}
            <SettingsPanel options={options} onChange={setOptions} />

            {/* Process all button */}
            {pendingCount > 0 && !demoLimitReached && (
              <button
                onClick={() => processing.processAll(options)}
                disabled={processing.apiOnline === false}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50"
              >
                {processing.apiOnline === false
                  ? 'API Offline - Cannot Process'
                  : `Remove Watermarks from ${pendingCount} file${pendingCount !== 1 ? 's' : ''}${demoMode ? ' (watermarked output)' : ''}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
