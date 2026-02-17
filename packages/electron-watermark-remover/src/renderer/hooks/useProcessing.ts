import { useState, useCallback, useRef } from 'react'
import type { ProcessingFile, ProcessingOptions } from '../types'

const POLL_INTERVAL_MS = 1500

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function detectFileType(filePath: string): 'image' | 'video' {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'gif']
  return imageExts.includes(ext) ? 'image' : 'video'
}

export function useProcessing() {
  const [files, setFiles] = useState<ProcessingFile[]>([])
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const pollingRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  const checkApiHealth = useCallback(async () => {
    const result = await window.electronAPI.api.health()
    setApiOnline(result.ok)
    return result.ok
  }, [])

  const addFiles = useCallback(async (paths: string[]) => {
    const newFiles: ProcessingFile[] = await Promise.all(
      paths.map(async (p) => {
        const stat = await window.electronAPI.fs.stat(p)
        return {
          id: generateId(),
          path: p,
          name: p.split('/').pop() ?? p,
          size: stat.size,
          type: detectFileType(p),
          status: 'pending' as const,
        }
      })
    )
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeFile = useCallback((id: string) => {
    clearInterval(pollingRefs.current[id])
    delete pollingRefs.current[id]
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setFiles((prev) => {
      const toKeep = prev.filter((f) => f.status !== 'completed' && f.status !== 'failed')
      const toRemove = prev.filter((f) => f.status === 'completed' || f.status === 'failed')
      toRemove.forEach((f) => {
        clearInterval(pollingRefs.current[f.id])
        delete pollingRefs.current[f.id]
      })
      return toKeep
    })
  }, [])

  const processFile = useCallback(async (fileId: string, options: ProcessingOptions) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'processing', progress: 0 } : f))
    )

    const file = files.find((f) => f.id === fileId)
    if (!file) return

    try {
      const base64 = await window.electronAPI.fs.readFileBase64(file.path)

      const payload = {
        video_bytes: base64,
        options: {
          watermark_removal: {
            enabled: true,
            method: options.method === 'auto' ? undefined : options.method,
            platform: options.platform === 'auto' ? undefined : options.platform,
          },
          upscaling: options.upscaling
            ? { enabled: true, scale: options.upscaleScale }
            : { enabled: false },
          encoding: {
            codec: 'hevc',
            crf: options.quality,
            preset: 'medium',
          },
        },
        metadata: { file_name: file.name },
      }

      const response = await window.electronAPI.api.submitJob(payload)

      if (response.error || !response.job_id) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'failed', error: response.error ?? 'Failed to submit job' }
              : f
          )
        )
        return
      }

      const jobId = response.job_id
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, jobId } : f))
      )

      // Poll for job status
      pollingRefs.current[fileId] = setInterval(async () => {
        const statusResult = await window.electronAPI.api.getJobStatus(jobId)

        if (statusResult.status === 'completed' && statusResult.result) {
          clearInterval(pollingRefs.current[fileId])
          delete pollingRefs.current[fileId]

          const outputPath = statusResult.result.video_url
            ? options.outputFolder
              ? `${options.outputFolder}/${file.name.replace(/\.[^/.]+$/, '')}_cleaned.mp4`
              : null
            : null

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: 'completed',
                    progress: 100,
                    outputPath: outputPath ?? undefined,
                    stats: statusResult.result?.stats,
                  }
                : f
            )
          )
        } else if (statusResult.status === 'failed') {
          clearInterval(pollingRefs.current[fileId])
          delete pollingRefs.current[fileId]
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, status: 'failed', error: statusResult.error ?? 'Processing failed' }
                : f
            )
          )
        } else {
          // Update progress
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, progress: statusResult.progress ?? f.progress } : f
            )
          )
        }
      }, POLL_INTERVAL_MS)
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: 'failed', error: (err as Error).message }
            : f
        )
      )
    }
  }, [files])

  const processAll = useCallback(
    async (options: ProcessingOptions) => {
      const online = await checkApiHealth()
      if (!online) return

      const pending = files.filter((f) => f.status === 'pending')
      for (const file of pending) {
        await processFile(file.id, options)
      }
    },
    [files, checkApiHealth, processFile]
  )

  return {
    files,
    apiOnline,
    addFiles,
    removeFile,
    clearCompleted,
    processFile,
    processAll,
    checkApiHealth,
  }
}
