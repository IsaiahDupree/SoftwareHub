import React, { useState } from 'react'

interface Props {
  onActivated: () => void
}

export function LicenseGate({ onActivated }: Props) {
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
      if (result.status === 'active') {
        onActivated()
      } else {
        setError(result.errorMessage ?? 'Activation failed. Please check your license key.')
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
    window.electronAPI.shell.openExternal('https://softwarehub.app/products/sora-video')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 mb-4 shadow-lg shadow-rose-900/40">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Sora Video</h1>
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
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center text-lg tracking-widest placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
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
            className="mt-4 w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {loading ? 'Activating...' : 'Activate License'}
          </button>
        </div>

        {/* Links */}
        <div className="mt-6 flex flex-col gap-2 text-center">
          <button
            onClick={openPortal}
            className="text-slate-400 hover:text-rose-400 text-sm transition-colors"
          >
            Find my license key on SoftwareHub
          </button>
          <button
            onClick={openPurchase}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Don't have a license? Purchase here
          </button>
        </div>
      </div>
    </div>
  )
}
