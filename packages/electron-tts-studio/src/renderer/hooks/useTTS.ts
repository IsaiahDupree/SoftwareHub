import { useState, useCallback, useRef } from 'react'
import type { GenerationItem, TTSSettings, Voice } from '../types'

let idCounter = 0
const nextId = () => `gen-${Date.now()}-${++idCounter}`

export function useTTS() {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [queue, setQueue] = useState<GenerationItem[]>([])
  const pollingRef = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  // ─── Voice library ─────────────────────────────────────────────────────────

  const loadVoices = useCallback(async () => {
    setLoadingVoices(true)
    try {
      const result = await window.electronAPI.tts.listVoices() as { voices: Voice[] }
      setVoices(result.voices ?? [])
    } catch {
      // API offline — keep empty list
    } finally {
      setLoadingVoices(false)
    }
  }, [])

  const cloneVoice = useCallback(async (payload: {
    name: string
    description: string
    audioBase64: string
    audioFilename: string
  }) => {
    const result = await window.electronAPI.tts.cloneVoice({
      name: payload.name,
      description: payload.description,
      audio_base64: payload.audioBase64,
      audio_filename: payload.audioFilename,
    }) as { voice?: Voice; error?: string }
    if (result.voice) {
      setVoices((prev) => [...prev, result.voice!])
    }
    return result
  }, [])

  const deleteVoice = useCallback(async (voiceId: string) => {
    await window.electronAPI.tts.deleteVoice(voiceId)
    setVoices((prev) => prev.filter((v) => v.id !== voiceId))
  }, [])

  // ─── Health check ──────────────────────────────────────────────────────────

  const checkApiHealth = useCallback(async () => {
    try {
      const result = await window.electronAPI.api.health() as { ok: boolean }
      setApiOnline(result.ok)
    } catch {
      setApiOnline(false)
    }
  }, [])

  // ─── Generation queue ──────────────────────────────────────────────────────

  const addToQueue = useCallback((text: string, settings: TTSSettings): string => {
    const item: GenerationItem = {
      id: nextId(),
      text,
      settings,
      status: 'idle',
      createdAt: new Date().toISOString(),
    }
    setQueue((prev) => [...prev, item])
    return item.id
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<GenerationItem>) => {
    setQueue((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item))
  }, [])

  const removeFromQueue = useCallback((id: string) => {
    if (pollingRef.current[id]) {
      clearInterval(pollingRef.current[id])
      delete pollingRef.current[id]
    }
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((item) => item.status !== 'completed'))
  }, [])

  const synthesize = useCallback(async (id: string) => {
    const item = queue.find((i) => i.id === id)
    if (!item) return

    updateItem(id, { status: 'queued', progress: 0 })

    try {
      const result = await window.electronAPI.tts.synthesize({
        text: item.text,
        voice_id: item.settings.voiceId,
        output_format: item.settings.outputFormat,
        quality: item.settings.quality,
        speed: item.settings.speed,
        pitch: item.settings.pitch,
        ssml: item.settings.ssmlMode,
      }) as { job_id?: string; audio_base64?: string; duration?: number; error?: string }

      if (result.error) {
        updateItem(id, { status: 'error', error: result.error })
        return
      }

      // If immediate result (short text)
      if (result.audio_base64) {
        updateItem(id, {
          status: 'completed',
          outputBase64: result.audio_base64,
          duration: result.duration,
          progress: 100,
        })
        return
      }

      // Async job — poll for status
      if (result.job_id) {
        updateItem(id, { status: 'processing' })
        const jobId = result.job_id

        pollingRef.current[id] = setInterval(async () => {
          try {
            const status = await window.electronAPI.tts.getJobStatus(jobId) as {
              status: string
              progress?: number
              audio_base64?: string
              duration?: number
              error?: string
            }

            if (status.status === 'completed') {
              clearInterval(pollingRef.current[id])
              delete pollingRef.current[id]
              updateItem(id, {
                status: 'completed',
                outputBase64: status.audio_base64,
                duration: status.duration,
                progress: 100,
              })
            } else if (status.status === 'error') {
              clearInterval(pollingRef.current[id])
              delete pollingRef.current[id]
              updateItem(id, { status: 'error', error: status.error ?? 'Generation failed' })
            } else {
              updateItem(id, { progress: status.progress ?? 50 })
            }
          } catch {
            // Keep polling
          }
        }, 1500)
      }
    } catch (err) {
      updateItem(id, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Synthesis failed',
      })
    }
  }, [queue, updateItem])

  const synthesizeAll = useCallback(async (settings: TTSSettings) => {
    const idle = queue.filter((i) => i.status === 'idle')
    for (const item of idle) {
      // Update settings before synthesizing
      updateItem(item.id, { settings })
      await synthesize(item.id)
    }
  }, [queue, updateItem, synthesize])

  return {
    voices,
    loadingVoices,
    apiOnline,
    queue,
    loadVoices,
    cloneVoice,
    deleteVoice,
    checkApiHealth,
    addToQueue,
    removeFromQueue,
    clearCompleted,
    synthesize,
    synthesizeAll,
  }
}
