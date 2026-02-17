import React, { useState } from 'react'
import type { AspectRatio, Duration, Quality } from '../types'

interface Props {
  projectId: string | null
  apiKey: string
  tier?: string
  generationCount: number
  onGenerate: (params: {
    prompt: string
    aspectRatio: AspectRatio
    duration: Duration
    quality: Quality
  }) => void
  disabled?: boolean
}

const ASPECT_RATIOS: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3']
const DURATIONS: Duration[] = [5, 10, 15, 20]
const QUALITIES: { value: Quality; label: string; description: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Fast' },
  { value: 'standard', label: 'Standard', description: 'Balanced' },
  { value: 'high', label: 'High Quality', description: 'Slow' },
]

function getTierLimit(tier?: string): number {
  if (tier === 'pro') return 50
  if (tier === 'creator') return 10
  return 0
}

export function PromptEditor({ projectId, apiKey, tier, generationCount, onGenerate, disabled }: Props) {
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [duration, setDuration] = useState<Duration>(10)
  const [quality, setQuality] = useState<Quality>('standard')

  const limit = getTierLimit(tier)
  const remaining = Math.max(0, limit - generationCount)
  const canGenerate = !!prompt.trim() && !!projectId && !!apiKey && remaining > 0 && !disabled

  function handleGenerate() {
    if (!canGenerate) return
    onGenerate({ prompt, aspectRatio, duration, quality })
    setPrompt('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Generate Video</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {!projectId
              ? 'Select or create a project first'
              : !apiKey
              ? 'Add your OpenAI API key in Settings'
              : `${remaining} of ${limit} generations remaining this month`}
          </p>
        </div>
        {tier && (
          <span className="px-2.5 py-1 bg-rose-900/30 text-rose-400 text-xs rounded-full capitalize border border-rose-900/40">
            {tier}
          </span>
        )}
      </div>

      {/* Prompt textarea */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video you want to generate... e.g., 'A drone shot flying over a misty mountain range at sunrise, cinematic, 4K'"
          rows={4}
          disabled={!projectId || !apiKey}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${prompt.length > 900 ? 'text-rose-400' : 'text-slate-600'}`}>
            {prompt.length} / 1000
          </span>
        </div>
      </div>

      {/* Options row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Aspect Ratio */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Aspect Ratio</label>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  aspectRatio === ar
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Duration</label>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  duration === d
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Quality</label>
          <div className="flex flex-col gap-1.5">
            {QUALITIES.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => setQuality(value)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  quality === value
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <span>{label}</span>
                <span className={`text-xs ${quality === value ? 'text-rose-200' : 'text-slate-600'}`}>
                  {description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full py-4 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-900/30 hover:shadow-rose-900/50 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {!projectId
          ? 'Select a Project'
          : !apiKey
          ? 'Add API Key in Settings'
          : remaining === 0
          ? 'Monthly Limit Reached'
          : 'Generate Video'}
      </button>
    </div>
  )
}
