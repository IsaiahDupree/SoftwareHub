import React, { useRef, useState } from 'react'

interface Props {
  text: string
  onChange: (text: string) => void
  ssmlMode: boolean
  onToggleSsml: () => void
  disabled?: boolean
}

const SSML_TAGS = [
  { label: 'Pause', snippet: '<break time="500ms"/>', desc: 'Insert a pause' },
  { label: 'Emphasize', snippet: '<emphasis level="strong">$SELECTION</emphasis>', desc: 'Emphasize text' },
  { label: 'Slow', snippet: '<prosody rate="slow">$SELECTION</prosody>', desc: 'Slower speech' },
  { label: 'Fast', snippet: '<prosody rate="fast">$SELECTION</prosody>', desc: 'Faster speech' },
  { label: 'Loud', snippet: '<prosody volume="loud">$SELECTION</prosody>', desc: 'Louder speech' },
  { label: 'Spell', snippet: '<say-as interpret-as="spell-out">$SELECTION</say-as>', desc: 'Spell out letters' },
]

function CharCount({ text, max }: { text: string; max: number }) {
  const count = text.length
  const pct = count / max
  const color = pct > 0.9 ? 'text-red-400' : pct > 0.75 ? 'text-amber-400' : 'text-slate-500'
  return (
    <span className={`text-xs ${color}`}>
      {count.toLocaleString()} / {max.toLocaleString()}
    </span>
  )
}

export function ScriptEditor({ text, onChange, ssmlMode, onToggleSsml, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showSsmlHelp, setShowSsmlHelp] = useState(false)
  const MAX_CHARS = 50_000

  const insertSsmlSnippet = (snippet: string) => {
    const ta = textareaRef.current
    if (!ta) return

    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = text.slice(start, end)
    const resolved = snippet.replace('$SELECTION', selected || 'text')
    const newText = text.slice(0, start) + resolved + text.slice(end)
    onChange(newText)

    // Restore cursor position after React re-render
    setTimeout(() => {
      const newCursor = start + resolved.length
      ta.setSelectionRange(newCursor, newCursor)
      ta.focus()
    }, 0)
  }

  const handleFileImport = async () => {
    const content = await window.electronAPI.dialog.openTextFile()
    if (content) {
      onChange(content.slice(0, MAX_CHARS))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-300 text-sm font-medium">Script</span>
          <button
            onClick={onToggleSsml}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              ssmlMode
                ? 'bg-teal-900/40 border-teal-700 text-teal-300'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            SSML
          </button>
          {ssmlMode && (
            <button
              onClick={() => setShowSsmlHelp(!showSsmlHelp)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
              title="SSML quick-insert"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <CharCount text={text} max={MAX_CHARS} />
          <button
            onClick={handleFileImport}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import text file
          </button>
          {text && (
            <button
              onClick={() => onChange('')}
              className="text-xs text-slate-600 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* SSML quick-insert chips */}
      {ssmlMode && showSsmlHelp && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl">
          {SSML_TAGS.map(({ label, snippet, desc }) => (
            <button
              key={label}
              onClick={() => insertSsmlSnippet(snippet)}
              title={desc}
              className="px-2.5 py-1 bg-slate-800 hover:bg-teal-900/30 border border-slate-700 hover:border-teal-700 text-slate-300 hover:text-teal-300 text-xs rounded-lg transition-colors font-mono"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
        disabled={disabled}
        placeholder={ssmlMode
          ? '<speak>Enter your script here with SSML tags...</speak>'
          : 'Enter the text you want to convert to speech...\n\nTip: Use natural punctuation to control pacing. A new paragraph creates a longer pause.'}
        className={`w-full h-56 px-4 py-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-teal-600/60 focus:ring-1 focus:ring-teal-600/20 transition-colors placeholder:text-slate-600 ${
          ssmlMode ? 'font-mono text-xs' : ''
        } disabled:opacity-50`}
        spellCheck={!ssmlMode}
      />
    </div>
  )
}
