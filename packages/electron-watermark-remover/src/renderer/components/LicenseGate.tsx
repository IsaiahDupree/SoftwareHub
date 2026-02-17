import React, { useState } from 'react'
import type { LicenseStatus } from '../types'

interface Props {
  onActivated: () => void
  onDemo?: () => void
}

export function LicenseGate({ onActivated, onDemo }: Props) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format key as user types: XXXX-XXXX-XXXX-XXXX
  function handleKeyChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    const parts = raw.match(/.{1,4}/g) ?? []
    setKey(parts.join('-').slice(0, 19))
  }

  async function handleActivate() {
    if (!key.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.license.activate(key.trim())
      if (result.success) {
        onActivated()
      } else {
        setError(result.error ?? 'Activation failed. Please check your license key.')
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function openPortal() {
    window.electronAPI.shell.openExternal('https://softwarehub.app/app/licenses')
  }

  function openPurchase() {
    window.electronAPI.shell.openExternal('https://softwarehub.app/products/watermark-remover')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 mb-4 shadow-lg shadow-purple-900/40">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Watermark Remover</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your license key to continue</p>
        </div>

        {/* License input card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            License Key
          </label>
          <input
            type="text"
            value={key}
            onChange={handleKeyChange}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            maxLength={19}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center text-lg tracking-widest placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
          />

          {error && (
            <div className="mt-3 px-4 py-3 bg-red-900/30 border border-red-800 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={loading || key.length < 4}
            className="mt-4 w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {loading ? 'Activating...' : 'Activate License'}
          </button>
        </div>

        {/* Links */}
        <div className="mt-6 flex flex-col gap-2 text-center">
          <button
            onClick={openPortal}
            className="text-slate-400 hover:text-violet-400 text-sm transition-colors"
          >
            Find my license key on SoftwareHub
          </button>
          <button
            onClick={openPurchase}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Don't have a license? Purchase here
          </button>
          {onDemo && (
            <button
              onClick={onDemo}
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors mt-2"
            >
              Try demo (3 files, watermarked output)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
