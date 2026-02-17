import React from 'react'
import type { ProcessingFile } from '../types'

interface Props {
  files: ProcessingFile[]
  onRemove: (id: string) => void
  onProcess: (id: string) => void
  onRevealOutput: (path: string) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function StatusBadge({ status, progress }: { status: ProcessingFile['status']; progress?: number }) {
  switch (status) {
    case 'pending':
      return (
        <span className="px-2.5 py-1 bg-slate-700 text-slate-300 text-xs font-medium rounded-full">
          Pending
        </span>
      )
    case 'processing':
      return (
        <span className="px-2.5 py-1 bg-violet-900/50 text-violet-300 text-xs font-medium rounded-full flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          {progress != null ? `${Math.round(progress)}%` : 'Processing'}
        </span>
      )
    case 'completed':
      return (
        <span className="px-2.5 py-1 bg-emerald-900/50 text-emerald-300 text-xs font-medium rounded-full flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Done
        </span>
      )
    case 'failed':
      return (
        <span className="px-2.5 py-1 bg-red-900/50 text-red-300 text-xs font-medium rounded-full flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Failed
        </span>
      )
  }
}

function FileTypeIcon({ type }: { type: 'image' | 'video' }) {
  return type === 'image' ? (
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ) : (
    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

export function FileList({ files, onRemove, onProcess, onRevealOutput }: Props) {
  if (files.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3 group"
        >
          {/* Icon */}
          <div className="shrink-0">
            <FileTypeIcon type={file.type} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-slate-100 text-sm font-medium truncate">{file.name}</p>
              <StatusBadge status={file.status} progress={file.progress} />
            </div>
            <p className="text-slate-500 text-xs mt-0.5">{formatBytes(file.size)}</p>

            {/* Progress bar */}
            {file.status === 'processing' && file.progress != null && (
              <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            )}

            {/* Error message */}
            {file.status === 'failed' && file.error && (
              <p className="text-red-400 text-xs mt-1">{file.error}</p>
            )}

            {/* Stats */}
            {file.status === 'completed' && file.stats && (
              <div className="flex gap-3 mt-1">
                {file.stats.watermarksDetected != null && (
                  <span className="text-emerald-500 text-xs">
                    {file.stats.watermarksDetected} watermark{file.stats.watermarksDetected !== 1 ? 's' : ''} removed
                  </span>
                )}
                {file.stats.method && (
                  <span className="text-slate-500 text-xs capitalize">via {file.stats.method}</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {file.status === 'pending' && (
              <button
                onClick={() => onProcess(file.id)}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Process
              </button>
            )}
            {file.status === 'completed' && file.outputPath && (
              <button
                onClick={() => onRevealOutput(file.outputPath!)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Reveal
              </button>
            )}
            {file.status === 'failed' && (
              <button
                onClick={() => onProcess(file.id)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => onRemove(file.id)}
              disabled={file.status === 'processing'}
              className="p-1.5 text-slate-600 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
