import React, { useState, useCallback } from 'react'
import type { Voice } from '../types'

interface Props {
  voices: Voice[]
  loading: boolean
  selectedVoiceId: string
  onSelect: (voiceId: string) => void
  onCloneVoice: (payload: {
    name: string
    description: string
    audioBase64: string
    audioFilename: string
  }) => Promise<{ error?: string }>
  onDeleteVoice: (voiceId: string) => void
  onRefresh: () => void
  apiOnline: boolean | null
  tier?: string
}

const GENDER_ICONS: Record<string, string> = {
  male: '♂',
  female: '♀',
  neutral: '◎',
}

function VoiceCard({
  voice,
  selected,
  onSelect,
  onDelete,
  onPreview,
  previewing,
}: {
  voice: Voice
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  onPreview: () => void
  previewing: boolean
}) {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
        selected
          ? 'bg-teal-950/40 border-teal-600/60 ring-1 ring-teal-600/30'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
        voice.is_cloned
          ? 'bg-violet-900/50 text-violet-300'
          : 'bg-slate-800 text-slate-300'
      }`}>
        {voice.is_cloned ? '🎙' : GENDER_ICONS[voice.gender] ?? '◎'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-slate-200 text-sm font-medium truncate">{voice.name}</p>
          {voice.is_cloned && (
            <span className="px-1.5 py-0.5 bg-violet-900/40 text-violet-400 text-xs rounded-md shrink-0">
              Cloned
            </span>
          )}
        </div>
        <p className="text-slate-500 text-xs truncate">{voice.language} · {voice.style}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onPreview() }}
          disabled={previewing}
          className="p-1.5 text-slate-500 hover:text-teal-400 rounded-lg transition-colors"
          title="Preview voice"
        >
          {previewing ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        {voice.is_cloned && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
            title="Delete cloned voice"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {selected && (
        <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-teal-400" />
      )}
    </div>
  )
}

function CloneVoiceModal({
  onClose,
  onClone,
  tier,
}: {
  onClose: () => void
  onClone: (payload: { name: string; description: string; audioBase64: string; audioFilename: string }) => Promise<{ error?: string }>
  tier?: string
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [audioFile, setAudioFile] = useState<{ path: string; name: string; base64: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPro = tier === 'pro' || tier === 'studio' || tier === 'lifetime'

  const handlePickAudio = async () => {
    const filePath = await window.electronAPI.dialog.openAudioFile()
    if (!filePath) return
    const base64 = await window.electronAPI.fs.readFileBase64(filePath)
    const fileName = filePath.split('/').pop() ?? filePath.split('\\').pop() ?? 'audio.mp3'
    setAudioFile({ path: filePath, name: fileName, base64 })
    setError(null)
  }

  const handleClone = async () => {
    if (!name.trim()) { setError('Enter a name for this voice'); return }
    if (!audioFile) { setError('Select an audio sample (30 seconds – 5 minutes)'); return }
    if (!isPro) { setError('Voice cloning requires Pro or Studio plan'); return }

    setLoading(true)
    setError(null)
    const result = await onClone({
      name: name.trim(),
      description: description.trim(),
      audioBase64: audioFile.base64,
      audioFilename: audioFile.name,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Clone a Voice</h3>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isPro && (
          <div className="mb-4 flex items-center gap-2 bg-amber-900/20 border border-amber-800/50 rounded-xl p-3">
            <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-300 text-xs">Voice cloning requires Pro or Studio plan.</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Voice Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Voice Clone"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Warm, conversational tone"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Audio Sample</label>
            <button
              onClick={handlePickAudio}
              className="w-full py-8 border-2 border-dashed border-slate-700 hover:border-teal-700 rounded-xl flex flex-col items-center gap-2 transition-colors"
            >
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              {audioFile ? (
                <span className="text-teal-400 text-sm font-medium">{audioFile.name}</span>
              ) : (
                <>
                  <span className="text-slate-400 text-sm">Click to select audio file</span>
                  <span className="text-slate-600 text-xs">MP3, WAV, FLAC, M4A · 30s – 5 min</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-900/20 border border-red-900/50 rounded-xl p-3">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          <button
            onClick={handleClone}
            disabled={loading || !isPro}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Training model...
              </>
            ) : (
              'Clone Voice'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function VoiceLibrary({
  voices,
  loading,
  selectedVoiceId,
  onSelect,
  onCloneVoice,
  onDeleteVoice,
  onRefresh,
  apiOnline,
  tier,
}: Props) {
  const [search, setSearch] = useState('')
  const [filterCloned, setFilterCloned] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [previewingId, setPreviewingId] = useState<string | null>(null)

  const filtered = voices.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase())
      || v.language.toLowerCase().includes(search.toLowerCase())
    const matchCloned = !filterCloned || v.is_cloned
    return matchSearch && matchCloned
  })

  const handlePreview = useCallback(async (voice: Voice) => {
    if (previewingId) return
    setPreviewingId(voice.id)
    try {
      const result = await window.electronAPI.tts.previewVoice(
        voice.id,
        'Hello! This is a preview of my voice.'
      ) as { audio_base64?: string }
      if (result.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${result.audio_base64}`)
        audio.play()
      }
    } catch {
      // Ignore preview errors
    } finally {
      setPreviewingId(null)
    }
  }, [previewingId])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-800 shrink-0">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search voices..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        <button
          onClick={() => setFilterCloned(!filterCloned)}
          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
            filterCloned
              ? 'bg-violet-900/40 border-violet-700 text-violet-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          My Voices
        </button>
        <button
          onClick={onRefresh}
          className="p-2 text-slate-500 hover:text-slate-300 rounded-xl hover:bg-slate-800 transition-colors"
          title="Refresh voices"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Voice list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="w-6 h-6 text-slate-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : apiOnline === false ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-slate-500 text-sm">API offline</p>
            <p className="text-slate-600 text-xs">Start the TTS Python server to load voices</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-slate-500 text-sm">No voices found</p>
          </div>
        ) : (
          filtered.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              selected={voice.id === selectedVoiceId}
              onSelect={() => onSelect(voice.id)}
              onDelete={() => onDeleteVoice(voice.id)}
              onPreview={() => handlePreview(voice)}
              previewing={previewingId === voice.id}
            />
          ))
        )}
      </div>

      {/* Footer: clone voice */}
      <div className="p-3 border-t border-slate-800 shrink-0">
        <button
          onClick={() => setShowCloneModal(true)}
          className="w-full py-2.5 border border-dashed border-slate-700 hover:border-violet-700 text-slate-500 hover:text-violet-400 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Clone a Voice
        </button>
      </div>

      {showCloneModal && (
        <CloneVoiceModal
          onClose={() => setShowCloneModal(false)}
          onClone={onCloneVoice}
          tier={tier}
        />
      )}
    </div>
  )
}
