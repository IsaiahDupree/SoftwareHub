import React from 'react'
import type { TTSSettings, OutputFormat, AudioQuality } from '../types'

interface Props {
  settings: TTSSettings
  onChange: (settings: TTSSettings) => void
  disabled?: boolean
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string; desc: string }[] = [
  { value: 'mp3', label: 'MP3', desc: 'Smallest size, universal' },
  { value: 'wav', label: 'WAV', desc: 'Lossless, large file' },
  { value: 'aac', label: 'AAC', desc: 'High quality, Apple native' },
  { value: 'flac', label: 'FLAC', desc: 'Lossless compressed' },
]

const QUALITY_OPTIONS: { value: AudioQuality; label: string; desc: string }[] = [
  { value: 'draft', label: 'Draft', desc: 'Fastest, good for testing' },
  { value: 'standard', label: 'Standard', desc: 'Balanced quality/speed' },
  { value: 'high', label: 'High', desc: 'Best quality (slower)' },
]

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  disabled,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-slate-400 text-xs">{label}</label>
        <span className="text-teal-400 text-xs font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-teal-500 disabled:opacity-40"
      />
    </div>
  )
}

export function AudioSettings({ settings, onChange, disabled }: Props) {
  const set = <K extends keyof TTSSettings>(key: K, value: TTSSettings[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Output format */}
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">Output Format</label>
        <div className="grid grid-cols-4 gap-1.5">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set('outputFormat', opt.value)}
              disabled={disabled}
              title={opt.desc}
              className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                settings.outputFormat === opt.value
                  ? 'bg-teal-900/40 border-teal-600 text-teal-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              } disabled:opacity-40`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality */}
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">Quality</label>
        <div className="grid grid-cols-3 gap-1.5">
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set('quality', opt.value)}
              disabled={disabled}
              title={opt.desc}
              className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                settings.quality === opt.value
                  ? 'bg-teal-900/40 border-teal-600 text-teal-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              } disabled:opacity-40`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Speed & Pitch sliders */}
      <div className="flex flex-col gap-4 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <SliderRow
          label="Speed"
          value={settings.speed}
          min={0.5}
          max={2.0}
          step={0.05}
          format={(v) => `${v.toFixed(2)}×`}
          onChange={(v) => set('speed', v)}
          disabled={disabled}
        />
        <SliderRow
          label="Pitch"
          value={settings.pitch}
          min={-20}
          max={20}
          step={1}
          format={(v) => `${v > 0 ? '+' : ''}${v} st`}
          onChange={(v) => set('pitch', v)}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
