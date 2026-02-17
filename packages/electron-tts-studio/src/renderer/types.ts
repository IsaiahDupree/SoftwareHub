// ─── TTS Studio Types ─────────────────────────────────────────────────────────

export type AppView = 'studio' | 'voices' | 'history' | 'settings'

export type OutputFormat = 'mp3' | 'wav' | 'aac' | 'flac'
export type AudioQuality = 'draft' | 'standard' | 'high'

export interface Voice {
  id: string
  name: string
  language: string
  gender: 'male' | 'female' | 'neutral'
  style: string
  preview_url?: string
  is_cloned: boolean
  created_at?: string
}

export interface TTSSettings {
  voiceId: string
  outputFormat: OutputFormat
  quality: AudioQuality
  speed: number   // 0.5 – 2.0
  pitch: number   // -20 – 20 semitones
  ssmlMode: boolean
}

export const DEFAULT_TTS_SETTINGS: TTSSettings = {
  voiceId: '',
  outputFormat: 'mp3',
  quality: 'high',
  speed: 1.0,
  pitch: 0,
  ssmlMode: false,
}

export type GenerationStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'error'

export interface GenerationItem {
  id: string
  text: string
  settings: TTSSettings
  status: GenerationStatus
  progress?: number
  outputPath?: string
  outputBase64?: string
  duration?: number  // seconds
  error?: string
  createdAt: string
}

export interface TTSProject {
  id: string
  name: string
  text: string
  voiceId: string
  settings: TTSSettings
  outputPath?: string
  outputFormat?: OutputFormat
  duration?: number
  createdAt: string
  updatedAt: string
}

export interface CloneVoiceFormData {
  name: string
  description: string
  audioFilePath: string
  audioBase64: string
  audioFilename: string
}
