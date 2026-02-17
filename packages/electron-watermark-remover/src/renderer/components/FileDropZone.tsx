import React, { useCallback, useState } from 'react'

interface Props {
  onFiles: (paths: string[]) => void
  disabled?: boolean
}

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.bmp,.gif,.tiff,.mp4,.mov,.mkv,.webm,.avi'

export function FileDropZone({ onFiles, disabled }: Props) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      const paths = Array.from(e.dataTransfer.files).map((f) => (f as File & { path: string }).path)
      if (paths.length > 0) onFiles(paths)
    },
    [onFiles, disabled]
  )

  async function openFilePicker() {
    if (disabled) return
    const paths = await window.electronAPI.dialog.openFiles({
      filters: [
        { name: 'Images & Videos', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tiff', 'mp4', 'mov', 'mkv', 'webm', 'avi'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tiff'] },
        { name: 'Videos', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi'] },
      ],
      title: 'Select files to remove watermarks',
    })
    if (paths) onFiles(paths)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onClick={openFilePicker}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
        ${dragging
          ? 'border-violet-400 bg-violet-900/20 scale-[1.01]'
          : 'border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-900'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex flex-col items-center gap-3">
        <div className={`p-4 rounded-full transition-colors ${dragging ? 'bg-violet-500/20' : 'bg-slate-800'}`}>
          <svg className={`w-10 h-10 ${dragging ? 'text-violet-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <p className="text-slate-200 font-medium">
            {dragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            or <span className="text-violet-400 underline">browse files</span>
          </p>
          <p className="text-slate-600 text-xs mt-2">
            Supports JPEG, PNG, WebP, GIF, TIFF, MP4, MOV, MKV, WebM
          </p>
        </div>
      </div>
    </div>
  )
}
