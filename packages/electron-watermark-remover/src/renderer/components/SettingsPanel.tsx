import React from 'react'
import type { ProcessingOptions } from '../types'

interface Props {
  options: ProcessingOptions
  onChange: (opts: ProcessingOptions) => void
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <span className="text-slate-300 text-sm">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { label: string; value: T }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-slate-700'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}

export function SettingsPanel({ options, onChange }: Props) {
  const set = <K extends keyof ProcessingOptions>(key: K, value: ProcessingOptions[K]) =>
    onChange({ ...options, [key]: value })

  async function pickOutputFolder() {
    const folder = await window.electronAPI.dialog.openFolder()
    if (folder) set('outputFolder', folder)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 className="text-slate-200 font-semibold text-sm mb-1">Processing Options</h3>

      <Row label="Removal method">
        <Select
          value={options.method}
          onChange={(v) => set('method', v)}
          options={[
            { label: 'Auto (recommended)', value: 'auto' },
            { label: 'Modal AI (best quality)', value: 'modal' },
            { label: 'Local FFmpeg (fastest)', value: 'local' },
          ]}
        />
      </Row>

      <Row label="Platform">
        <Select
          value={options.platform}
          onChange={(v) => set('platform', v)}
          options={[
            { label: 'Auto-detect', value: 'auto' },
            { label: 'Sora', value: 'sora' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'Runway', value: 'runway' },
            { label: 'Pika', value: 'pika' },
          ]}
        />
      </Row>

      <Row label="AI upscaling">
        <Toggle checked={options.upscaling} onChange={(v) => set('upscaling', v)} />
      </Row>

      {options.upscaling && (
        <Row label="Upscale factor">
          <Select
            value={String(options.upscaleScale) as '2' | '4'}
            onChange={(v) => set('upscaleScale', Number(v) as 2 | 4)}
            options={[
              { label: '2× (faster)', value: '2' },
              { label: '4× (slower, highest quality)', value: '4' },
            ]}
          />
        </Row>
      )}

      <Row label={`Quality (CRF: ${options.quality})`}>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-xs">Best</span>
          <input
            type="range"
            min={0}
            max={51}
            value={options.quality}
            onChange={(e) => set('quality', Number(e.target.value))}
            className="w-32 accent-violet-500"
          />
          <span className="text-slate-500 text-xs">Smallest</span>
        </div>
      </Row>

      <Row label="Output folder">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs max-w-[180px] truncate">
            {options.outputFolder ?? 'Same as input'}
          </span>
          <button
            onClick={pickOutputFolder}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
          >
            Browse
          </button>
          {options.outputFolder && (
            <button
              onClick={() => set('outputFolder', null)}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </Row>
    </div>
  )
}
