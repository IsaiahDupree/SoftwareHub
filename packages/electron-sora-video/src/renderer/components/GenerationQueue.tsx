import React from 'react'
import type { Generation, GenerationStatus } from '../types'

interface Props {
  generations: Generation[]
  onOpenVideo: (videoUrl: string) => void
}

function StatusIcon({ status }: { status: GenerationStatus }) {
  switch (status) {
    case 'pending':
      return (
        <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'generating':
      return (
        <svg className="w-4 h-4 text-rose-400 shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    case 'completed':
      return (
        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'failed':
      return (
        <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
  }
}

function statusLabel(status: GenerationStatus): string {
  switch (status) {
    case 'pending': return 'Pending'
    case 'generating': return 'Generating...'
    case 'completed': return 'Completed'
    case 'failed': return 'Failed'
  }
}

function statusColor(status: GenerationStatus): string {
  switch (status) {
    case 'pending': return 'text-slate-500'
    case 'generating': return 'text-rose-400'
    case 'completed': return 'text-emerald-400'
    case 'failed': return 'text-red-400'
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function GenerationQueue({ generations, onOpenVideo }: Props) {
  if (generations.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <svg className="w-10 h-10 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-slate-500 text-sm">No videos generated yet.</p>
        <p className="text-slate-600 text-xs mt-1">Enter a prompt and click Generate Video.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-slate-200 font-semibold text-sm">Generation Queue</h3>
      <ul className="flex flex-col gap-2">
        {[...generations].reverse().map((gen) => (
          <li
            key={gen.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3"
          >
            <div className="mt-0.5">
              <StatusIcon status={gen.status} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-slate-300 text-sm truncate">{gen.prompt}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className={`text-xs font-medium ${statusColor(gen.status)}`}>
                  {statusLabel(gen.status)}
                </span>
                <span className="text-xs text-slate-600">{gen.aspectRatio}</span>
                <span className="text-xs text-slate-600">{gen.duration}s</span>
                <span className="text-xs text-slate-600 capitalize">{gen.quality}</span>
                <span className="text-xs text-slate-700">{formatDate(gen.createdAt)}</span>
              </div>

              {gen.status === 'failed' && gen.errorMessage && (
                <p className="text-red-400 text-xs mt-2 bg-red-900/20 rounded-lg px-3 py-2 border border-red-900/40">
                  {gen.errorMessage}
                </p>
              )}
            </div>

            {gen.status === 'completed' && gen.videoUrl && (
              <button
                onClick={() => onOpenVideo(gen.videoUrl!)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-900/40 text-emerald-400 text-xs font-medium rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Open Video
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
