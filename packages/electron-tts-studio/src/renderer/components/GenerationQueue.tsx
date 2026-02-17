import React from 'react'
import type { GenerationItem } from '../types'

interface Props {
  items: GenerationItem[]
  onRemove: (id: string) => void
  onPlayback: (item: GenerationItem) => void
  onExport: (item: GenerationItem) => void
  onClearCompleted: () => void
  playingId?: string
}

function StatusBadge({ status }: { status: GenerationItem['status'] }) {
  const configs = {
    idle: { label: 'Queued', className: 'bg-slate-800 text-slate-400' },
    queued: { label: 'Queued', className: 'bg-slate-800 text-slate-400 animate-pulse' },
    processing: { label: 'Generating', className: 'bg-teal-900/40 text-teal-300 animate-pulse' },
    completed: { label: 'Ready', className: 'bg-emerald-900/40 text-emerald-300' },
    error: { label: 'Error', className: 'bg-red-900/40 text-red-400' },
  }
  const { label, className } = configs[status]
  return (
    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function GenerationCard({
  item,
  onRemove,
  onPlayback,
  onExport,
  isPlaying,
}: {
  item: GenerationItem
  onRemove: () => void
  onPlayback: () => void
  onExport: () => void
  isPlaying: boolean
}) {
  const preview = item.text.length > 80 ? item.text.slice(0, 80) + '…' : item.text
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
      item.status === 'error'
        ? 'bg-red-950/20 border-red-900/30'
        : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Play / status icon */}
      <button
        onClick={onPlayback}
        disabled={item.status !== 'completed'}
        className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          item.status === 'completed'
            ? isPlaying
              ? 'bg-teal-600 text-white'
              : 'bg-teal-900/40 hover:bg-teal-700 text-teal-300'
            : 'bg-slate-800 text-slate-600 cursor-default'
        }`}
      >
        {item.status === 'processing' ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : item.status === 'completed' ? (
          isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )
        ) : item.status === 'error' ? (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-slate-300 text-sm leading-snug">{preview}</p>
        {item.status === 'error' && item.error && (
          <p className="text-red-400 text-xs mt-1">{item.error}</p>
        )}
        {item.status === 'processing' && item.progress !== undefined && (
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <StatusBadge status={item.status} />
          {item.duration && (
            <span className="text-slate-600 text-xs">{fmt(item.duration)}</span>
          )}
          <span className="text-slate-600 text-xs capitalize">
            {item.settings.outputFormat} · {item.settings.quality}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {item.status === 'completed' && (
          <button
            onClick={onExport}
            className="p-1.5 text-slate-500 hover:text-emerald-400 rounded-lg transition-colors"
            title="Export audio"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
        <button
          onClick={onRemove}
          className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg transition-colors"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function GenerationQueue({
  items,
  onRemove,
  onPlayback,
  onExport,
  onClearCompleted,
  playingId,
}: Props) {
  const completedCount = items.filter((i) => i.status === 'completed').length

  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium">Queue ({items.length})</span>
        {completedCount > 0 && (
          <button
            onClick={onClearCompleted}
            className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
          >
            Clear completed ({completedCount})
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
        {items.map((item) => (
          <GenerationCard
            key={item.id}
            item={item}
            onRemove={() => onRemove(item.id)}
            onPlayback={() => onPlayback(item)}
            onExport={() => onExport(item)}
            isPlaying={playingId === item.id}
          />
        ))}
      </div>
    </div>
  )
}
