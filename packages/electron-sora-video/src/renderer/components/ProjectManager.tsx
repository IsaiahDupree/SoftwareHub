import React, { useState } from 'react'
import type { Project } from '../types'

interface Props {
  projects: Project[]
  selectedProjectId: string | null
  onSelectProject: (id: string) => void
  onCreateProject: (name: string) => void
  onDeleteProject: (id: string) => void
}

export function ProjectManager({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}: Props) {
  const [showNewInput, setShowNewInput] = useState(false)
  const [newName, setNewName] = useState('')

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    onCreateProject(trimmed)
    setNewName('')
    setShowNewInput(false)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 font-semibold text-sm">Projects</h2>
          <button
            onClick={() => setShowNewInput(true)}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="New project"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {showNewInput && (
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') { setShowNewInput(false); setNewName('') }
              }}
              placeholder="Project name..."
              autoFocus
              className="flex-1 min-w-0 px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-2 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs rounded-lg transition-colors shrink-0"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto p-2">
        {projects.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-slate-600 text-xs">No projects yet.</p>
            <p className="text-slate-600 text-xs mt-1">Click + to create one.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors group flex items-start justify-between gap-2 ${
                    selectedProjectId === project.id
                      ? 'bg-slate-800 text-slate-200'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{formatDate(project.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteProject(project.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all shrink-0 mt-0.5"
                    title="Delete project"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
