import React, { useState } from 'react'

interface Props {
  onActivated: () => void
}

export function LicenseGate({ onActivated }: Props) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleKeyChange = (raw: string) => {
    // Auto-format: XXXX-XXXX-XXXX-XXXX
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const formatted = clean.match(/.{1,4}/g)?.join('-') ?? clean
    setKey(formatted.slice(0, 19))
    setError(null)
  }

  const handleActivate = async () => {
    if (key.length < 19) {
      setError('Enter a complete license key (XXXX-XXXX-XXXX-XXXX)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.license.activate(key)
      if (result.status === 'active' || result.status === 'grace_period') {
        onActivated()
      } else {
        setError(result.errorMessage ?? 'Activation failed. Check your key and try again.')
      }
    } catch {
      setError('Unable to connect to the license server. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg shadow-teal-900/40">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">TTS Studio</h1>
          <p className="text-slate-400 text-sm mt-1">AI-powered text-to-speech</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-white font-semibold text-lg mb-1">Activate License</h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter your license key to get started. Purchase at{' '}
            <button
              onClick={() => window.electronAPI.shell.openExternal('https://softwarehub.app')}
              className="text-teal-400 hover:text-teal-300 underline"
            >
              softwarehub.app
            </button>
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                License Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => handleKeyChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength={19}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl font-mono text-center tracking-widest placeholder:text-slate-600 placeholder:tracking-normal focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-900/20 border border-red-900/50 rounded-xl p-3">
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={loading || key.length < 19}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-900/30 hover:shadow-teal-900/50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Activating...
                </>
              ) : (
                'Activate License'
              )}
            </button>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6">
          Having issues?{' '}
          <button
            onClick={() => window.electronAPI.shell.openExternal('https://softwarehub.app/support')}
            className="text-slate-500 hover:text-slate-400 underline"
          >
            Contact Support
          </button>
        </p>
      </div>
    </div>
  )
}
